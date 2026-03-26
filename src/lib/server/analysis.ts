import { supabaseAdmin } from './supabase';
import { llm, model } from './llm';
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

	const response = await llm.messages.create({
		model,
		max_tokens: 2048,
		system: `Ти аналізуєш телефонну розмову між AI-агентом та клієнтом.
Агент працював за таким скриптом: ${script?.system_prompt ?? 'невідомо'}

Надай відповідь ВИКЛЮЧНО у форматі JSON (без markdown, без коментарів) з полями:
- "summary": короткий підсумок розмови (2-3 речення) українською
- "sentiment": "positive" | "neutral" | "negative" — загальний тон клієнта
- "script_adherence": число 0-100 — наскільки агент дотримувався скрипту
- "action_items": масив рядків — дії, які потрібно виконати після дзвінка
- "key_topics": масив рядків — основні теми розмови
- "triggers": масив обʼєктів з полями "type" (тип тригера) та "description" (опис) — ключові моменти розмови що потребують уваги (скарга, запит на знижку, негатив, спроба маніпуляції, відмова від послуги, тощо)
- "tags": масив рядків — короткі теги для категоризації дзвінка (наприклад: "бронювання", "скарга", "VIP-гість", "повторний клієнт", "відміна")`,
		messages: [
			{
				role: 'user',
				content: `Транскрипт розмови:\n\n${transcriptText}`
			}
		]
	});

	const textBlock = response.content.find((b) => b.type === 'text');
	if (!textBlock || textBlock.type !== 'text') return;

	const analysis = JSON.parse(textBlock.text) as {
		summary: string;
		sentiment: string;
		script_adherence: number;
		action_items: string[];
		key_topics: string[];
		triggers: { type: string; description: string }[];
		tags: string[];
	};

	await supabaseAdmin.from('call_analyses').upsert(
		{
			call_id: callId,
			summary: analysis.summary,
			sentiment: analysis.sentiment,
			script_adherence: Math.min(100, Math.max(0, analysis.script_adherence)),
			action_items: analysis.action_items,
			key_topics: [...analysis.key_topics, ...(analysis.tags ?? [])]
		},
		{ onConflict: 'call_id' }
	);
}
