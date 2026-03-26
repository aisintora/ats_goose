<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import TranscriptView from '$lib/components/TranscriptView.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import AnalysisCard from '$lib/components/AnalysisCard.svelte';

	const { data } = $props();

	let reanalyzing = $state(false);

	function formatDuration(): string {
		if (!data.call.ended_at) return '—';
		const ms = new Date(data.call.ended_at).getTime() - new Date(data.call.started_at).getTime();
		const secs = Math.floor(ms / 1000);
		const mins = Math.floor(secs / 60);
		return mins > 0 ? `${mins} хв ${secs % 60} с` : `${secs} с`;
	}

	async function reanalyze() {
		reanalyzing = true;
		try {
			await fetch(`/api/calls/${data.call.id}/analyze`, { method: 'POST' });
			window.location.reload();
		} finally {
			reanalyzing = false;
		}
	}
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<div class="mb-1 flex items-center gap-3">
				<h1 class="text-2xl font-bold text-surface-100">
					{data.call.direction === 'inbound' ? '← Вхідний дзвінок' : '→ Вихідний дзвінок'}
				</h1>
				<StatusBadge status={data.call.status} />
			</div>
			<div class="flex items-center gap-4 text-sm text-surface-400">
				<span class="font-mono">{data.call.phone_number}</span>
				<span>{data.call.script?.name ?? '—'}</span>
				<span>{formatDuration()}</span>
				<span>{new Date(data.call.started_at).toLocaleString('uk-UA')}</span>
			</div>
		</div>
		<a href="/" class="text-sm text-surface-400 hover:text-surface-200">← Назад</a>
	</div>

	<!-- Audio Player -->
	{#if data.call.audio_url}
		<AudioPlayer url={data.call.audio_url} />
	{/if}

	<!-- Transcript -->
	<div class="rounded-xl border border-surface-800 bg-surface-900 p-6">
		<h3 class="mb-4 text-lg font-semibold text-surface-100">Транскрипт</h3>
		{#if data.transcript.length > 0}
			<TranscriptView entries={data.transcript} />
		{:else}
			<p class="text-sm text-surface-500">Транскрипт відсутній</p>
		{/if}
	</div>

	<!-- Analysis -->
	{#if data.analysis}
		<AnalysisCard analysis={data.analysis} />
	{/if}

	<!-- Re-analyze button -->
	{#if data.transcript.length > 0}
		<button
			onclick={reanalyze}
			disabled={reanalyzing}
			class="rounded-lg border border-surface-700 px-4 py-2 text-sm text-surface-300 transition-colors hover:bg-surface-800 disabled:opacity-50"
		>
			{reanalyzing ? 'Аналізуємо...' : 'Перезапустити аналіз'}
		</button>
	{/if}
</div>
