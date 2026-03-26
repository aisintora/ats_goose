import { error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [callResult, transcriptResult, analysisResult] = await Promise.all([
		supabaseAdmin
			.from('calls')
			.select('*, script:scripts(name, business_type)')
			.eq('id', params.id)
			.single(),
		supabaseAdmin
			.from('transcript_entries')
			.select('*')
			.eq('call_id', params.id)
			.order('timestamp_ms', { ascending: true }),
		supabaseAdmin
			.from('call_analyses')
			.select('*')
			.eq('call_id', params.id)
			.single()
	]);

	if (!callResult.data) error(404, 'Дзвінок не знайдено');

	return {
		call: callResult.data,
		transcript: transcriptResult.data ?? [],
		analysis: analysisResult.data
	};
};
