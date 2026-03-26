import { error, redirect, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { createAgent, updateAgent } from '$lib/server/elevenlabs';
import type { PageServerLoad, Actions } from './$types';
import type { Script } from '$lib/types';

export const load: PageServerLoad = async ({ params }) => {
	const { data: script } = await supabaseAdmin
		.from('scripts')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!script) error(404, 'Скрипт не знайдено');

	return { script };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const form = await request.formData();

		const name = form.get('name') as string;
		const business_type = form.get('business_type') as string;
		const language = form.get('language') as string;
		const voice_id = form.get('voice_id') as string;
		const first_message = form.get('first_message') as string;
		const system_prompt = form.get('system_prompt') as string;

		if (!name || !system_prompt) {
			return fail(400, { error: 'Назва та скрипт обовʼязкові' });
		}

		const { data: updated, error: dbError } = await supabaseAdmin
			.from('scripts')
			.update({ name, business_type, language, voice_id, first_message, system_prompt })
			.eq('id', params.id)
			.select()
			.single();

		if (dbError || !updated) {
			return fail(500, { error: 'Помилка збереження' });
		}

		try {
			if (updated.agent_id) {
				await updateAgent(updated.agent_id, updated as Script);
			} else {
				const agentId = await createAgent(updated as Script);
				await supabaseAdmin
					.from('scripts')
					.update({ agent_id: agentId })
					.eq('id', params.id);
			}
		} catch (e) {
			console.error('ElevenLabs sync failed:', e);
		}

		redirect(303, `/scripts/${params.id}`);
	},

	delete: async ({ params }) => {
		await supabaseAdmin.from('scripts').delete().eq('id', params.id);
		redirect(303, '/');
	}
};
