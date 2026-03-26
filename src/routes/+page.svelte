<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { Call } from '$lib/types';

	const { data } = $props();

	onMount(() => {
		const channel = supabase
			.channel('dashboard-calls')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => {
				invalidateAll();
			})
			.subscribe();

		return () => { channel.unsubscribe(); };
	});

	const businessTypeLabels: Record<string, string> = {
		hotel: 'Готель',
		carwash: 'Автомийка',
		autoservice: 'Автосервіс'
	};

	const sentimentEmoji: Record<string, string> = {
		positive: '😊',
		neutral: '😐',
		negative: '😠'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('uk-UA', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(call: Call): string {
		if (!call.ended_at) return 'в процесі...';
		const ms = new Date(call.ended_at).getTime() - new Date(call.started_at).getTime();
		const secs = Math.floor(ms / 1000);
		const mins = Math.floor(secs / 60);
		return mins > 0 ? `${mins}хв ${secs % 60}с` : `${secs}с`;
	}

	async function deleteCall(callId: string) {
		if (!confirm('Видалити дзвінок?')) return;
		await fetch(`/api/calls/${callId}`, { method: 'DELETE' });
		await invalidateAll();
	}

	async function activateScript(e: MouseEvent, scriptId: string) {
		e.preventDefault();
		e.stopPropagation();
		await fetch(`/api/scripts/${scriptId}/activate`, { method: 'POST' });
		await invalidateAll();
	}
</script>

<div class="space-y-8">
	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-surface-100">Скрипти</h2>
			<a
				href="/scripts/new"
				class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
			>
				+ Новий скрипт
			</a>
		</div>

		{#if data.scripts.length === 0}
			<div class="rounded-xl border border-dashed border-surface-700 p-12 text-center">
				<p class="text-surface-500">Скриптів ще немає</p>
				<a href="/scripts/new" class="mt-2 inline-block text-sm text-accent hover:text-accent-light">
					Створити перший скрипт
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.scripts as script (script.id)}
					<a
						href="/scripts/{script.id}"
						class="group rounded-xl border p-5 transition-colors
							{script.is_active
							? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
							: 'border-surface-800 bg-surface-900 hover:border-surface-700'}"
					>
						<div class="mb-3 flex items-start justify-between">
							<div class="flex items-center gap-2">
								<h3 class="font-medium text-surface-100 group-hover:text-white">{script.name}</h3>
								{#if script.is_active}
									<span class="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">Активний</span>
								{/if}
							</div>
							{#if !script.agent_id}
								<div class="h-2 w-2 rounded-full bg-yellow-500" title="Не синхронізовано"></div>
							{/if}
						</div>
						<div class="flex gap-2">
							<span class="rounded-md bg-surface-800 px-2 py-0.5 text-xs text-surface-400">
								{businessTypeLabels[script.business_type] ?? script.business_type}
							</span>
						</div>
						<p class="mt-3 line-clamp-2 text-xs text-surface-500">
							{script.first_message || script.system_prompt.slice(0, 100)}
						</p>
						{#if !script.is_active && script.agent_id}
							<button
								onclick={(e) => activateScript(e, script.id)}
								class="mt-3 rounded-md border border-surface-700 px-3 py-1 text-xs text-surface-400 transition-colors hover:border-green-500/30 hover:text-green-400"
							>
								Зробити активним
							</button>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-surface-100">Останні дзвінки</h2>
			<a
				href="/calls/new"
				class="rounded-lg border border-surface-700 px-4 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800"
			>
				Зателефонувати
			</a>
		</div>

		{#if data.calls.length === 0}
			<div class="rounded-xl border border-dashed border-surface-700 p-12 text-center">
				<p class="text-surface-500">Дзвінків ще не було</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.calls as call (call.id)}
					<a
						href={call.status === 'active' ? `/calls/${call.id}/live` : `/calls/${call.id}`}
						class="group block rounded-xl border border-surface-800 bg-surface-900 p-4 transition-colors hover:border-surface-700"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3">
									<span class="text-sm font-medium {call.direction === 'inbound' ? 'text-blue-400' : 'text-green-400'}">
										{call.direction === 'inbound' ? '← Вхідний' : '→ Вихідний'}
									</span>
									<span class="font-mono text-sm text-surface-300">{call.phone_number}</span>
									<StatusBadge status={call.status} />
									{#if call.status === 'active'}
										<span class="inline-flex items-center gap-1.5 text-xs text-green-400">
											<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
											Live
										</span>
									{/if}
								</div>

								<div class="mt-1 flex items-center gap-3 text-xs text-surface-500">
									<span>{call.script?.name ?? '—'}</span>
									<span>{formatDuration(call)}</span>
									<span>{formatDate(call.started_at)}</span>
								</div>

								{#if call.analysis?.[0]?.summary}
									<div class="mt-2 flex items-start gap-2">
										<span class="text-sm">{sentimentEmoji[call.analysis[0].sentiment] ?? ''}</span>
										<p class="line-clamp-2 text-xs leading-relaxed text-surface-400">
											{call.analysis[0].summary}
										</p>
									</div>
									{#if call.analysis[0].key_topics?.length}
										<div class="mt-1.5 flex flex-wrap gap-1">
											{#each call.analysis[0].key_topics.slice(0, 4) as topic}
												<span class="rounded bg-surface-800 px-1.5 py-0.5 text-[10px] text-surface-400">{topic}</span>
											{/each}
										</div>
									{/if}
								{/if}
							</div>

							<button
								onclick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); deleteCall(call.id); }}
								class="ml-4 rounded p-1.5 text-surface-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
								title="Видалити"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>
