import { supabaseAdmin } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [scriptsResult, callsResult] = await Promise.all([
		supabaseAdmin
			.from('scripts')
			.select('*')
			.order('created_at', { ascending: false }),
		supabaseAdmin
			.from('calls')
			.select('*, script:scripts(name), analysis:call_analyses(summary, sentiment, key_topics)')
			.order('started_at', { ascending: false })
			.limit(20)
	]);

	return {
		scripts: scriptsResult.data ?? [],
		calls: callsResult.data ?? []
	};
};
