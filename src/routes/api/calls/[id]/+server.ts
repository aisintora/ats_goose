import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	const { data: call } = await supabaseAdmin
		.from('calls')
		.select('id')
		.eq('id', params.id)
		.single();

	if (!call) error(404, 'Call not found');

	// Delete related records first (cascade should handle it, but explicit)
	await supabaseAdmin.from('call_analyses').delete().eq('call_id', params.id);
	await supabaseAdmin.from('transcript_entries').delete().eq('call_id', params.id);
	await supabaseAdmin.from('calls').delete().eq('id', params.id);

	return json({ ok: true });
};
