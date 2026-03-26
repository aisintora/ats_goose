import { json, error } from '@sveltejs/kit';
import { WEBHOOK_SECRET } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabase';
import { getConversation, getConversationAudio } from '$lib/server/elevenlabs';
import { runCallAnalysis } from '$lib/server/analysis';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const secret = request.headers.get('x-webhook-secret') ?? request.headers.get('x-elevenlabs-signature');
	if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
		error(401, 'Invalid webhook secret');
	}

	const payload = await request.json();
	const conversationId = payload.data?.conversation_id ?? payload.conversation_id;

	if (!conversationId) {
		error(400, 'Missing conversation_id');
	}

	// Find existing call or create one (inbound)
	let { data: call } = await supabaseAdmin
		.from('calls')
		.select('id, script_id')
		.eq('conversation_id', conversationId)
		.single();

	if (!call) {
		// Inbound call — find script by agent_id
		const conversation = await getConversation(conversationId);
		const { data: script } = await supabaseAdmin
			.from('scripts')
			.select('id')
			.eq('agent_id', conversation.agent_id)
			.single();

		if (!script) {
			console.error(`No script found for agent ${conversation.agent_id}`);
			return json({ ok: false });
		}

		const phoneNumber =
			conversation.metadata?.phone_call?.from_number ?? 'unknown';

		const { data: newCall } = await supabaseAdmin
			.from('calls')
			.insert({
				script_id: script.id,
				direction: 'inbound',
				phone_number: phoneNumber,
				status: 'completed',
				conversation_id: conversationId,
				ended_at: new Date().toISOString()
			})
			.select()
			.single();

		if (!newCall) return json({ ok: false });
		call = newCall;
	} else {
		// Update existing call as completed
		await supabaseAdmin
			.from('calls')
			.update({ status: 'completed', ended_at: new Date().toISOString() })
			.eq('id', call.id);
	}

	// Fetch and store transcript
	try {
		const conversation = await getConversation(conversationId);

		if (conversation.transcript?.length) {
			const entries = conversation.transcript.map((item) => ({
				call_id: call!.id,
				speaker: item.role === 'agent' ? 'agent' : 'customer',
				text: item.message,
				timestamp_ms: Math.round((item.time_in_call_secs ?? 0) * 1000)
			}));

			await supabaseAdmin.from('transcript_entries').insert(entries);
		}

		// Fetch and store audio
		if (conversation.has_audio) {
			try {
				const audioBuffer = await getConversationAudio(conversationId);
				const fileName = `${call!.id}.mp3`;

				await supabaseAdmin.storage
					.from('call-recordings')
					.upload(fileName, audioBuffer, {
						contentType: 'audio/mpeg',
						upsert: true
					});

				const { data: urlData } = supabaseAdmin.storage
					.from('call-recordings')
					.getPublicUrl(fileName);

				await supabaseAdmin
					.from('calls')
					.update({ audio_url: urlData.publicUrl })
					.eq('id', call!.id);
			} catch (e) {
				console.error('Audio fetch failed:', e);
			}
		}

		// Run AI analysis
		await runCallAnalysis(call!.id);
	} catch (e) {
		console.error('Transcript ingestion failed:', e);
	}

	return json({ ok: true });
};
