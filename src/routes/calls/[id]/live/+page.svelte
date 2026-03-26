<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import TranscriptView from '$lib/components/TranscriptView.svelte';
	import type { TranscriptEntry } from '$lib/types';

	const { data } = $props();

	let entries: TranscriptEntry[] = $state([...data.initialEntries]);
	let callStatus = $state(data.call.status);
	let pollInterval: ReturnType<typeof setInterval> | undefined;
	let elapsedSeconds = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | undefined;

	function formatElapsed(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	onMount(() => {
		// Timer
		const startTime = new Date(data.call.started_at).getTime();
		timerInterval = setInterval(() => {
			elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
		}, 1000);

		// Supabase Realtime subscription for new transcript entries
		const channel = supabase
			.channel(`transcript-${data.call.id}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'transcript_entries',
					filter: `call_id=eq.${data.call.id}`
				},
				(payload) => {
					const newEntry = payload.new as TranscriptEntry;
					const exists = entries.some((e) => e.id === newEntry.id);
					if (!exists) {
						entries = [...entries, newEntry];
					}
				}
			)
			.subscribe();

		// Poll for transcript updates (triggers Supabase Realtime inserts)
		pollInterval = setInterval(async () => {
			try {
				const res = await fetch(`/api/calls/${data.call.id}/poll-transcript`);
				const result = await res.json();

				if (result.call_status === 'completed') {
					callStatus = 'completed';
					clearInterval(pollInterval);
					clearInterval(timerInterval);
				}
			} catch (e) {
				console.error('Poll failed:', e);
			}
		}, 2500);

		// Also subscribe to call status changes
		const callChannel = supabase
			.channel(`call-${data.call.id}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'calls',
					filter: `id=eq.${data.call.id}`
				},
				(payload) => {
					const updated = payload.new as { status: string };
					if (updated.status !== 'active') {
						callStatus = updated.status as 'completed' | 'failed';
						clearInterval(pollInterval);
						clearInterval(timerInterval);
					}
				}
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
			callChannel.unsubscribe();
		};
	});

	onDestroy(() => {
		clearInterval(pollInterval);
		clearInterval(timerInterval);
	});
</script>

<div class="mx-auto max-w-3xl">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="text-2xl font-bold text-surface-100">Live дзвінок</h1>
				{#if callStatus === 'active'}
					<div class="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
						<span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
						Активний
					</div>
				{:else}
					<div class="rounded-full bg-surface-800 px-3 py-1 text-sm text-surface-400">
						Завершено
					</div>
				{/if}
			</div>
			<div class="mt-1 flex items-center gap-4 text-sm text-surface-400">
				<span class="font-mono">{data.call.phone_number}</span>
				<span>{data.call.script?.name ?? ''}</span>
				<span class="font-mono tabular-nums">{formatElapsed(elapsedSeconds)}</span>
			</div>
		</div>
	</div>

	<!-- Live Transcript -->
	<div class="rounded-xl border border-surface-800 bg-surface-900 p-6">
		<TranscriptView {entries} live={true} />
	</div>

	<!-- Post-call link -->
	{#if callStatus !== 'active'}
		<div class="mt-6 rounded-xl border border-surface-800 bg-surface-900 p-6 text-center">
			<p class="mb-3 text-surface-300">Дзвінок завершено</p>
			<a
				href="/calls/{data.call.id}"
				class="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
			>
				Переглянути деталі та аналіз
			</a>
		</div>
	{/if}
</div>
