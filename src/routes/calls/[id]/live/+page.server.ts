import { error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { data: call } = await supabaseAdmin
		.from('calls')
		.select('*, script:scripts(name)')
		.eq('id', params.id)
		.single();

	if (!call) error(404, 'Дзвінок не знайдено');

	const { data: entries } = await supabaseAdmin
		.from('transcript_entries')
		.select('*')
		.eq('call_id', params.id)
		.order('timestamp_ms', { ascending: true });

	return {
		call,
		initialEntries: entries ?? []
	};
};
