import { redirect, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { initiateOutboundCall } from '$lib/server/elevenlabs';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const { data: scripts } = await supabaseAdmin
		.from('scripts')
		.select('id, name, business_type, agent_id')
		.not('agent_id', 'is', null)
		.order('name');

	return { scripts: scripts ?? [] };
};

export const actions: Actions = {
	call: async ({ request }) => {
		const form = await request.formData();
		const scriptId = form.get('script_id') as string;
		const phoneNumber = form.get('phone_number') as string;

		if (!scriptId || !phoneNumber) {
			return fail(400, { error: 'Оберіть скрипт та введіть номер' });
		}

		const { data: script } = await supabaseAdmin
			.from('scripts')
			.select('agent_id')
			.eq('id', scriptId)
			.single();

		if (!script?.agent_id) {
			return fail(400, { error: 'Скрипт не синхронізовано з ElevenLabs' });
		}

		let conversationId: string;
		try {
			conversationId = await initiateOutboundCall(script.agent_id, phoneNumber);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Невідома помилка';
			return fail(500, { error: `Помилка ініціації дзвінка: ${message}` });
		}

		const { data: call, error: dbError } = await supabaseAdmin
			.from('calls')
			.insert({
				script_id: scriptId,
				direction: 'outbound',
				phone_number: phoneNumber,
				status: 'active',
				conversation_id: conversationId
			})
			.select()
			.single();

		if (dbError || !call) {
			return fail(500, { error: 'Помилка збереження дзвінка' });
		}

		redirect(303, `/calls/${call.id}/live`);
	}
};
