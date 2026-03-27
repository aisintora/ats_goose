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

	const { count, error: countErr } = await supabaseAdmin
		.from('transcript_entries')
		.select('id', { count: 'exact', head: true })
		.eq('call_id', params.id);

	console.log(`[analyze] call=${params.id} conversation_id=${call.conversation_id} transcript_count=${count} countErr=${JSON.stringify(countErr)}`);

	if ((count ?? 0) === 0 && call.conversation_id) {
		console.log(`[analyze] fetching transcript from ElevenLabs for ${call.conversation_id}`);
		const conversation = await getConversation(call.conversation_id);
		console.log(`[analyze] ElevenLabs returned ${conversation.transcript?.length ?? 0} entries, has_audio=${conversation.has_audio}`);

		if (conversation.transcript?.length) {
			const entries = conversation.transcript.map((item) => ({
				call_id: call.id,
				speaker: item.role === 'agent' ? 'agent' : 'customer',
				text: item.message,
				timestamp_ms: Math.round((item.time_in_call_secs ?? 0) * 1000)
			}));
			const { error: insertErr } = await supabaseAdmin.from('transcript_entries').insert(entries);
			console.log(`[analyze] inserted ${entries.length} transcript entries, error=${JSON.stringify(insertErr)}`);
		}

		const { data: callData } = await supabaseAdmin
			.from('calls')
			.select('audio_url')
			.eq('id', params.id)
			.single();

		if (!callData?.audio_url && conversation.has_audio) {
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
			console.log(`[analyze] uploaded audio`);
		}
	} else {
		console.log(`[analyze] skipping ElevenLabs fetch: count=${count}, conversation_id=${call.conversation_id}`);
	}

	await supabaseAdmin.from('call_analyses').delete().eq('call_id', params.id);

	console.log(`[analyze] running analysis...`);
	await runCallAnalysis(params.id);
	console.log(`[analyze] done`);

	return json({ ok: true, version: 'v2-debug' });
};
