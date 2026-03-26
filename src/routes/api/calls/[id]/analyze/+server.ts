import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { runCallAnalysis } from '$lib/server/analysis';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const { data: call } = await supabaseAdmin
		.from('calls')
		.select('id')
		.eq('id', params.id)
		.single();

	if (!call) error(404, 'Call not found');

	// Delete existing analysis to re-run
	await supabaseAdmin.from('call_analyses').delete().eq('call_id', params.id);

	await runCallAnalysis(params.id);

	return json({ ok: true });
};
