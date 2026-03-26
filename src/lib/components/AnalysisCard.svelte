<script lang="ts">
	import type { CallAnalysis } from '$lib/types';
	import StatusBadge from './StatusBadge.svelte';

	type Props = {
		analysis: CallAnalysis;
	};

	const { analysis }: Props = $props();

	const sentimentEmoji: Record<string, string> = {
		positive: '😊',
		neutral: '😐',
		negative: '😠'
	};
</script>

<div class="space-y-4">
	<h3 class="text-lg font-semibold text-surface-100">AI Аналіз</h3>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<!-- Sentiment -->
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
			<p class="mb-2 text-xs font-medium uppercase tracking-wider text-surface-500">Настрій</p>
			<div class="flex items-center gap-2">
				<span class="text-2xl">{sentimentEmoji[analysis.sentiment] ?? '😐'}</span>
				<StatusBadge sentiment={analysis.sentiment} />
			</div>
		</div>

		<!-- Script Adherence -->
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
			<p class="mb-2 text-xs font-medium uppercase tracking-wider text-surface-500">Дотримання скрипту</p>
			<div class="flex items-center gap-3">
				<span class="text-2xl font-bold text-surface-100">{analysis.script_adherence}%</span>
				<div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-800">
					<div
						class="h-full rounded-full transition-all
							{analysis.script_adherence >= 70
							? 'bg-green-500'
							: analysis.script_adherence >= 40
								? 'bg-yellow-500'
								: 'bg-red-500'}"
						style="width: {analysis.script_adherence}%"
					></div>
				</div>
			</div>
		</div>

		<!-- Key Topics -->
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
			<p class="mb-2 text-xs font-medium uppercase tracking-wider text-surface-500">Теми</p>
			<div class="flex flex-wrap gap-1.5">
				{#each analysis.key_topics as topic}
					<span class="rounded-md bg-surface-800 px-2 py-0.5 text-xs text-surface-300">{topic}</span>
				{/each}
			</div>
		</div>
	</div>

	<!-- Summary -->
	<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
		<p class="mb-2 text-xs font-medium uppercase tracking-wider text-surface-500">Підсумок</p>
		<p class="text-sm leading-relaxed text-surface-200">{analysis.summary}</p>
	</div>

	<!-- Action Items -->
	{#if analysis.action_items.length > 0}
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
			<p class="mb-2 text-xs font-medium uppercase tracking-wider text-surface-500">Дії після дзвінка</p>
			<ul class="space-y-1.5">
				{#each analysis.action_items as item}
					<li class="flex items-start gap-2 text-sm text-surface-200">
						<span class="mt-0.5 text-accent">•</span>
						{item}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
