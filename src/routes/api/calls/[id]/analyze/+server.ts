import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { getConversation, getConversationAudio } from '$lib/server/elevenlabs';
import { runCallAnalysis } from '$lib/server/analysis';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const { data: call } = await supabaseAdmin
		.from('calls')
		.select('id, conversation_id')
		.eq('id', params.id)
		.single();

	if (!call) error(404, 'Call not found');

	// If no transcript entries, try to fetch from ElevenLabs
	const { count } = await supabaseAdmin
		.from('transcript_entries')
		.select('id', { count: 'exact', head: true })
		.eq('call_id', params.id);

	if ((count ?? 0) === 0 && call.conversation_id) {
		const conversation = await getConversation(call.conversation_id);

		if (conversation.transcript?.length) {
			const entries = conversation.transcript
				.filter((item) => item.message)
				.map((item) => ({
					call_id: call.id,
					speaker: item.role === 'agent' ? 'agent' : 'customer',
					text: item.message,
					timestamp_ms: Math.round((item.time_in_call_secs ?? 0) * 1000)
				}));

			if (entries.length) {
				await supabaseAdmin.from('transcript_entries').insert(entries);
			}
		}

		// Fetch audio if missing
		const { data: callData } = await supabaseAdmin
			.from('calls')
			.select('audio_url')
			.eq('id', params.id)
			.single();

		if (!callData?.audio_url && conversation.has_audio) {
			try {
				const audioBuffer = await getConversationAudio(call.conversation_id);
				const fileName = `${call.id}.mp3`;
				await supabaseAdmin.storage
					.from('call-recordings')
					.upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });
				const { data: urlData } = supabaseAdmin.storage
					.from('call-recordings')
					.getPublicUrl(fileName);
				await supabaseAdmin
					.from('calls')
					.update({ audio_url: urlData.publicUrl })
					.eq('id', call.id);
			} catch (e) {
				console.error('Audio fetch failed:', e);
			}
		}
	}

	// Delete existing analysis to re-run
	await supabaseAdmin.from('call_analyses').delete().eq('call_id', params.id);

	await runCallAnalysis(params.id);

	return json({ ok: true });
};
