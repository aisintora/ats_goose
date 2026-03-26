import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { getConversation, getConversationAudio } from '$lib/server/elevenlabs';
import { runCallAnalysis } from '$lib/server/analysis';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json();
	console.log('Webhook received:', JSON.stringify(payload).slice(0, 800));

	const eventType = payload.type ?? payload.event_type ?? 'unknown';
	const conversationId =
		payload.data?.conversation_id ??
		payload.conversation_id;

	// --- CALL INITIATION ---
	if (eventType === 'conversation_initiation' || payload.conversation_initiation_client_data) {
		return json({ dynamic_variables: {} });
	}

	// --- POST-CALL ---
	if (!conversationId) {
		console.log('No conversation_id, skipping');
		return json({ ok: true, skipped: true });
	}

	// Always fetch full conversation data from ElevenLabs
	let conversation;
	try {
		conversation = await getConversation(conversationId);
	} catch (e) {
		console.error('Failed to fetch conversation:', e);
		return json({ ok: false });
	}

	// Extract real data from ElevenLabs
	const phoneNumber =
		conversation.metadata?.phone_call?.external_number ??
		conversation.metadata?.phone_call?.from_number ??
		'unknown';
	const startTime = conversation.metadata?.start_time_unix_secs
		? new Date(conversation.metadata.start_time_unix_secs * 1000).toISOString()
		: new Date().toISOString();
	const duration = conversation.metadata?.call_duration_secs ?? 0;
	const endTime = new Date(new Date(startTime).getTime() + duration * 1000).toISOString();

	// Find existing call or create one
	let { data: call } = await supabaseAdmin
		.from('calls')
		.select('id, script_id')
		.eq('conversation_id', conversationId)
		.single();

	if (!call) {
		const { data: script } = await supabaseAdmin
			.from('scripts')
			.select('id')
			.eq('agent_id', conversation.agent_id)
			.single();

		if (!script) {
			console.error(`No script for agent ${conversation.agent_id}`);
			return json({ ok: false });
		}

		const { data: newCall } = await supabaseAdmin
			.from('calls')
			.insert({
				script_id: script.id,
				direction: 'inbound',
				phone_number: phoneNumber,
				status: 'completed',
				conversation_id: conversationId,
				started_at: startTime,
				ended_at: endTime
			})
			.select()
			.single();

		if (!newCall) return json({ ok: false });
		call = newCall;
	} else {
		// Update with real data from ElevenLabs
		await supabaseAdmin
			.from('calls')
			.update({
				status: 'completed',
				phone_number: phoneNumber !== 'unknown' ? phoneNumber : undefined,
				started_at: startTime,
				ended_at: endTime
			})
			.eq('id', call.id);
	}

	// Store transcript
	try {
		if (conversation.transcript?.length) {
			await supabaseAdmin
				.from('transcript_entries')
				.delete()
				.eq('call_id', call!.id);

			const entries = conversation.transcript.map((item) => ({
				call_id: call!.id,
				speaker: item.role === 'agent' ? 'agent' : 'customer',
				text: item.message,
				timestamp_ms: Math.round((item.time_in_call_secs ?? 0) * 1000)
			}));

			await supabaseAdmin.from('transcript_entries').insert(entries);
		}

		// Store audio
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
		try {
			await runCallAnalysis(call!.id);
		} catch (e) {
			console.error('Analysis failed:', e);
		}
	} catch (e) {
		console.error('Transcript ingestion failed:', e);
	}

	return json({ ok: true });
};
