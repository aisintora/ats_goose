import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { initiateOutboundCall } from '$lib/server/elevenlabs';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { script_id, phone_number } = body;

	if (!script_id || !phone_number) {
		error(400, 'script_id and phone_number are required');
	}

	const { data: script } = await supabaseAdmin
		.from('scripts')
		.select('agent_id')
		.eq('id', script_id)
		.single();

	if (!script?.agent_id) {
		error(400, 'Script not synced with ElevenLabs');
	}

	const conversationId = await initiateOutboundCall(script.agent_id, phone_number);

	const { data: call } = await supabaseAdmin
		.from('calls')
		.insert({
			script_id,
			direction: 'outbound',
			phone_number,
			status: 'active',
			conversation_id: conversationId
		})
		.select()
		.single();

	return json({ call_id: call?.id, conversation_id: conversationId });
};
