import { supabaseAdmin } from './supabase';
import { openai } from './openai';
import type { TranscriptEntry } from '$lib/types';

export async function runCallAnalysis(callId: string): Promise<void> {
	const { data: entries } = await supabaseAdmin
		.from('transcript_entries')
		.select('*')
		.eq('call_id', callId)
		.order('timestamp_ms', { ascending: true });

	if (!entries || entries.length === 0) return;

	const { data: call } = await supabaseAdmin
		.from('calls')
		.select('script_id')
		.eq('id', callId)
		.single();

	if (!call) return;

	const { data: script } = await supabaseAdmin
		.from('scripts')
		.select('system_prompt, name')
		.eq('id', call.script_id)
		.single();

	const transcriptText = (entries as TranscriptEntry[])
		.map((e) => `${e.speaker === 'agent' ? 'Агент' : 'Клієнт'}: ${e.text}`)
		.join('\n');

	const response = await openai.chat.completions.create({
		model: 'gpt-4o',
		response_format: { type: 'json_object' },
		messages: [
			{
				role: 'system',
				content: `Ти аналізуєш телефонну розмову між AI-агентом та клієнтом.
Агент працював за таким скриптом: ${script?.system_prompt ?? 'невідомо'}

Надай JSON відповідь з полями:
- "summary": короткий підсумок розмови (2-3 речення) українською
- "sentiment": "positive" | "neutral" | "negative" — загальний тон клієнта
- "script_adherence": число 0-100 — наскільки агент дотримувався скрипту
- "action_items": масив рядків — дії, які потрібно виконати після дзвінка
- "key_topics": масив рядків — основні теми розмови

Відповідай ТІЛЬКИ валідним JSON.`
			},
			{
				role: 'user',
				content: `Транскрипт розмови:\n\n${transcriptText}`
			}
		]
	});

	const content = response.choices[0]?.message?.content;
	if (!content) return;

	const analysis = JSON.parse(content) as {
		summary: string;
		sentiment: string;
		script_adherence: number;
		action_items: string[];
		key_topics: string[];
	};

	await supabaseAdmin.from('call_analyses').upsert(
		{
			call_id: callId,
			summary: analysis.summary,
			sentiment: analysis.sentiment,
			script_adherence: Math.min(100, Math.max(0, analysis.script_adherence)),
			action_items: analysis.action_items,
			key_topics: analysis.key_topics
		},
		{ onConflict: 'call_id' }
	);
}
