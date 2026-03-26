import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { assignAgentToNumber } from '$lib/server/elevenlabs';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const { data: script } = await supabaseAdmin
		.from('scripts')
		.select('id, agent_id')
		.eq('id', params.id)
		.single();

	if (!script) error(404, 'Script not found');
	if (!script.agent_id) error(400, 'Script not synced with voice agent');

	// Deactivate all other scripts
	await supabaseAdmin
		.from('scripts')
		.update({ is_active: false })
		.eq('is_active', true);

	// Activate this one
	await supabaseAdmin
		.from('scripts')
		.update({ is_active: true })
		.eq('id', params.id);

	// Assign agent to phone number
	await assignAgentToNumber(script.agent_id);

	return json({ ok: true });
};
