import { redirect, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { createAgent } from '$lib/server/elevenlabs';
import type { Actions } from './$types';
import type { Script } from '$lib/types';

export const actions: Actions = {
	create: async ({ request }) => {
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

		const { data: script, error: dbError } = await supabaseAdmin
			.from('scripts')
			.insert({ name, business_type, language, voice_id, first_message, system_prompt })
			.select()
			.single();

		if (dbError || !script) {
			return fail(500, { error: 'Помилка збереження' });
		}

		try {
			const agentId = await createAgent(script as Script);
			await supabaseAdmin
				.from('scripts')
				.update({ agent_id: agentId })
				.eq('id', script.id);
		} catch (e) {
			console.error('ElevenLabs agent creation failed:', e);
		}

		redirect(303, `/scripts/${script.id}`);
	}
};
