<script lang="ts">
	import type { TranscriptEntry } from '$lib/types';

	type Props = {
		entries: TranscriptEntry[];
		live?: boolean;
	};

	const { entries, live = false }: Props = $props();

	let container: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (live && container && entries.length) {
			container.scrollTop = container.scrollHeight;
		}
	});

	function formatTime(ms: number): string {
		const totalSecs = Math.floor(ms / 1000);
		const mins = Math.floor(totalSecs / 60);
		const secs = totalSecs % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div
	bind:this={container}
	class="space-y-3 {live ? 'max-h-[60vh] overflow-y-auto' : ''}"
>
	{#each entries as entry (entry.id)}
		<div class="flex gap-3 {entry.speaker === 'agent' ? '' : 'flex-row-reverse'}">
			<div class="flex-shrink-0 pt-1">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium
						{entry.speaker === 'agent'
						? 'bg-accent/20 text-accent'
						: 'bg-blue-500/20 text-blue-400'}"
				>
					{entry.speaker === 'agent' ? 'AI' : 'K'}
				</div>
			</div>
			<div class="max-w-[75%]">
				<div
					class="rounded-xl px-4 py-2.5 text-sm
						{entry.speaker === 'agent'
						? 'bg-surface-800 text-surface-200'
						: 'bg-blue-500/10 text-surface-200'}"
				>
					{entry.text}
				</div>
				<span class="mt-1 block text-xs text-surface-600">{formatTime(entry.timestamp_ms)}</span>
			</div>
		</div>
	{/each}

	{#if live && entries.length === 0}
		<div class="py-12 text-center text-surface-500">
			<div class="mb-2 inline-flex items-center gap-2">
				<span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
				Очікуємо транскрипцію...
			</div>
		</div>
	{/if}
</div>
