import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { getConversation, getConversationAudio } from '$lib/server/elevenlabs';
import { runCallAnalysis } from '$lib/server/analysis';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const payload = await request.json();
	console.log('Webhook received:', JSON.stringify(payload).slice(0, 800));

	// Determine event type
	const eventType = payload.type ?? payload.event_type ?? 'unknown';
	const conversationId =
		payload.data?.conversation_id ??
		payload.conversation_id;

	// --- CALL INITIATION (початок дзвінка) ---
	if (eventType === 'conversation_initiation' || eventType === 'call.initiated' || payload.conversation_initiation_client_data) {
		if (!conversationId) {
			// Return empty conversation_initiation_client_data to ElevenLabs
			return json({ dynamic_variables: {} });
		}

		// Check if call already exists
		const { data: existing } = await supabaseAdmin
			.from('calls')
			.select('id')
			.eq('conversation_id', conversationId)
			.single();

		if (!existing) {
			// Find script by agent_id
			const agentId = payload.data?.agent_id ?? payload.agent_id;
			const { data: script } = await supabaseAdmin
				.from('scripts')
				.select('id')
				.eq('agent_id', agentId)
				.single();

			if (script) {
				const phoneNumber = payload.data?.from_number ?? payload.from_number ?? 'incoming';

				await supabaseAdmin.from('calls').insert({
					script_id: script.id,
					direction: 'inbound',
					phone_number: phoneNumber,
					status: 'active',
					conversation_id: conversationId
				});
				console.log(`Call started: ${conversationId}`);
			}
		}

		return json({ dynamic_variables: {} });
	}

	// --- POST-CALL (кінець дзвінка) ---
	if (!conversationId) {
		console.log('No conversation_id, skipping');
		return json({ ok: true, skipped: true });
	}

	// Find existing call or create one
	let { data: call } = await supabaseAdmin
		.from('calls')
		.select('id, script_id')
		.eq('conversation_id', conversationId)
		.single();

	if (!call) {
		// Call not tracked yet — create from ElevenLabs data
		let conversation;
		try {
			conversation = await getConversation(conversationId);
		} catch (e) {
			console.error('Failed to fetch conversation:', e);
			return json({ ok: false });
		}

		const { data: script } = await supabaseAdmin
			.from('scripts')
			.select('id')
			.eq('agent_id', conversation.agent_id)
			.single();

		if (!script) {
			console.error(`No script for agent ${conversation.agent_id}`);
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
		// Update status to completed
		await supabaseAdmin
			.from('calls')
			.update({ status: 'completed', ended_at: new Date().toISOString() })
			.eq('id', call.id);
	}

	// Fetch and store transcript
	try {
		const conversation = await getConversation(conversationId);

		if (conversation.transcript?.length) {
			// Delete old entries if re-processing
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
