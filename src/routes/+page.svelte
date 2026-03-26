<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { Call } from '$lib/types';

	const { data } = $props();

	const businessTypeLabels: Record<string, string> = {
		hotel: 'Готель',
		carwash: 'Автомийка',
		autoservice: 'Автосервіс'
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
		if (!call.ended_at) return '...';
		const ms = new Date(call.ended_at).getTime() - new Date(call.started_at).getTime();
		const secs = Math.floor(ms / 1000);
		const mins = Math.floor(secs / 60);
		return mins > 0 ? `${mins}хв ${secs % 60}с` : `${secs}с`;
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
						class="group rounded-xl border border-surface-800 bg-surface-900 p-5 transition-colors hover:border-surface-700"
					>
						<div class="mb-3 flex items-start justify-between">
							<h3 class="font-medium text-surface-100 group-hover:text-white">{script.name}</h3>
							{#if script.agent_id}
								<div class="h-2 w-2 rounded-full bg-green-500" title="Синхронізовано"></div>
							{:else}
								<div class="h-2 w-2 rounded-full bg-yellow-500" title="Не синхронізовано"></div>
							{/if}
						</div>
						<div class="flex gap-2">
							<span class="rounded-md bg-surface-800 px-2 py-0.5 text-xs text-surface-400">
								{businessTypeLabels[script.business_type] ?? script.business_type}
							</span>
							<span class="rounded-md bg-surface-800 px-2 py-0.5 text-xs text-surface-400">
								{script.language.toUpperCase()}
							</span>
						</div>
						<p class="mt-3 line-clamp-2 text-xs text-surface-500">
							{script.first_message || script.system_prompt.slice(0, 100)}
						</p>
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
			<div class="overflow-hidden rounded-xl border border-surface-800">
				<table class="w-full text-sm">
					<thead class="border-b border-surface-800 bg-surface-900">
						<tr>
							<th class="px-4 py-3 text-left font-medium text-surface-400">Напрямок</th>
							<th class="px-4 py-3 text-left font-medium text-surface-400">Номер</th>
							<th class="px-4 py-3 text-left font-medium text-surface-400">Скрипт</th>
							<th class="px-4 py-3 text-left font-medium text-surface-400">Статус</th>
							<th class="px-4 py-3 text-left font-medium text-surface-400">Тривалість</th>
							<th class="px-4 py-3 text-left font-medium text-surface-400">Дата</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-surface-800">
						{#each data.calls as call (call.id)}
							<tr class="transition-colors hover:bg-surface-900/50">
								<td class="px-4 py-3">
									<span class="text-xs {call.direction === 'inbound' ? 'text-blue-400' : 'text-green-400'}">
										{call.direction === 'inbound' ? '← Вхідний' : '→ Вихідний'}
									</span>
								</td>
								<td class="px-4 py-3 font-mono text-surface-300">{call.phone_number}</td>
								<td class="px-4 py-3 text-surface-300">{call.script?.name ?? '—'}</td>
								<td class="px-4 py-3"><StatusBadge status={call.status} /></td>
								<td class="px-4 py-3 text-surface-400">{formatDuration(call)}</td>
								<td class="px-4 py-3 text-surface-400">{formatDate(call.started_at)}</td>
								<td class="px-4 py-3">
									<a
										href={call.status === 'active' ? `/calls/${call.id}/live` : `/calls/${call.id}`}
										class="text-accent hover:text-accent-light"
									>
										{call.status === 'active' ? 'Live' : 'Деталі'}
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
