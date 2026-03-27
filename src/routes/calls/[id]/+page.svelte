<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import TranscriptView from '$lib/components/TranscriptView.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import AnalysisCard from '$lib/components/AnalysisCard.svelte';

	const { data } = $props();

	let reanalyzing = $state(false);

	onMount(() => {
		// Listen for new transcript entries and analysis
		const channel = supabase
			.channel(`call-detail-${data.call.id}`)
			.on('postgres_changes', {
				event: 'INSERT',
				schema: 'public',
				table: 'call_analyses',
				filter: `call_id=eq.${data.call.id}`
			}, () => {
				invalidateAll();
			})
			.on('postgres_changes', {
				event: 'INSERT',
				schema: 'public',
				table: 'transcript_entries',
				filter: `call_id=eq.${data.call.id}`
			}, () => {
				invalidateAll();
			})
			.subscribe();

		// Auto-sync: if completed call has no transcript, fetch from ElevenLabs
		if (data.call.status === 'completed' && data.transcript.length === 0 && data.call.conversation_id) {
			fetch(`/api/calls/${data.call.id}/analyze`, { method: 'POST' });
		}

		return () => { channel.unsubscribe(); };
	});

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
			await invalidateAll();
		} finally {
			reanalyzing = false;
		}
	}

	async function deleteCall() {
		if (!confirm('Видалити дзвінок?')) return;
		await fetch(`/api/calls/${data.call.id}`, { method: 'DELETE' });
		goto('/');
	}
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<div class="mb-1 flex items-center gap-3">
				<a href="/" class="text-surface-400 transition-colors hover:text-surface-200" title="На дашборд">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</a>
				<h1 class="text-2xl font-bold text-surface-100">
					{data.call.direction === 'inbound' ? 'Вхідний дзвінок' : 'Вихідний дзвінок'}
				</h1>
				<StatusBadge status={data.call.status} />
			</div>
			<div class="ml-8 flex items-center gap-4 text-sm text-surface-400">
				<span class="font-mono">{data.call.phone_number}</span>
				<span>{data.call.script?.name ?? '—'}</span>
				<span>{formatDuration()}</span>
				<span>{new Date(data.call.started_at).toLocaleString('uk-UA')}</span>
			</div>
		</div>
		<button
			onclick={deleteCall}
			class="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
		>
			Видалити
		</button>
	</div>

	<!-- Audio Player -->
	{#if data.call.audio_url}
		<AudioPlayer url={data.call.audio_url} />
	{/if}

	<!-- Analysis or Loading -->
	{#if data.analysis}
		<AnalysisCard analysis={data.analysis} />
	{:else if data.transcript.length > 0}
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-6">
			<div class="flex items-center gap-3">
				<div class="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
				<p class="text-sm text-surface-400">Аналіз дзвінка в процесі...</p>
			</div>
		</div>
	{/if}

	<!-- Transcript -->
	{#if data.transcript.length > 0}
		<div class="rounded-xl border border-surface-800 bg-surface-900 p-6">
			<h3 class="mb-4 text-lg font-semibold text-surface-100">Транскрипт</h3>
			<TranscriptView entries={data.transcript} />
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex gap-3">
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
</div>
