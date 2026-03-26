import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { getConversation } from '$lib/server/elevenlabs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { data: call } = await supabaseAdmin
		.from('calls')
		.select('conversation_id, status')
		.eq('id', params.id)
		.single();

	if (!call?.conversation_id) {
		error(404, 'Call not found');
	}

	const conversation = await getConversation(call.conversation_id);

	// Get existing entries count to detect new ones
	const { count: existingCount } = await supabaseAdmin
		.from('transcript_entries')
		.select('*', { count: 'exact', head: true })
		.eq('call_id', params.id);

	const newEntries = conversation.transcript?.slice(existingCount ?? 0) ?? [];

	if (newEntries.length > 0) {
		const entries = newEntries.map((item) => ({
			call_id: params.id,
			speaker: item.role === 'agent' ? 'agent' : 'customer',
			text: item.message,
			timestamp_ms: Math.round((item.time_in_call_secs ?? 0) * 1000)
		}));

		await supabaseAdmin.from('transcript_entries').insert(entries);
	}

	// Check if call ended
	const isEnded = ['done', 'failed'].includes(conversation.status);
	if (isEnded && call.status === 'active') {
		await supabaseAdmin
			.from('calls')
			.update({
				status: conversation.status === 'failed' ? 'failed' : 'completed',
				ended_at: new Date().toISOString()
			})
			.eq('id', params.id);
	}

	return json({
		new_entries: newEntries.length,
		call_status: isEnded ? 'completed' : 'active',
		total: conversation.transcript?.length ?? 0
	});
};
