<script lang="ts">
	import { enhance } from '$app/forms';

	const { data, form } = $props();

	let loading = $state(false);

	const businessTypeLabels: Record<string, string> = {
		hotel: 'Готель',
		carwash: 'Автомийка',
		autoservice: 'Автосервіс'
	};
</script>

<div class="mx-auto max-w-lg">
	<h1 class="mb-2 text-2xl font-bold text-surface-100">Вихідний дзвінок</h1>
	<p class="mb-6 text-sm text-surface-400">
		AI-агент зателефонує на вказаний номер і проведе розмову за обраним скриптом.
	</p>

	{#if form?.error}
		<div class="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{form.error}
		</div>
	{/if}

	{#if data.scripts.length === 0}
		<div class="rounded-xl border border-dashed border-surface-700 p-12 text-center">
			<p class="text-surface-500">Немає синхронізованих скриптів</p>
			<a href="/scripts/new" class="mt-2 inline-block text-sm text-accent hover:text-accent-light">
				Створити скрипт
			</a>
		</div>
	{:else}
		<form
			method="POST"
			action="?/call"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-6"
		>
			<div>
				<label for="script_id" class="mb-1.5 block text-sm font-medium text-surface-300">Скрипт</label>
				<select
					id="script_id"
					name="script_id"
					required
					class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
				>
					<option value="" disabled selected>Оберіть скрипт...</option>
					{#each data.scripts as script}
						<option value={script.id}>
							{script.name} ({businessTypeLabels[script.business_type] ?? script.business_type})
						</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="phone_number" class="mb-1.5 block text-sm font-medium text-surface-300">Номер телефону</label>
				<input
					type="tel"
					id="phone_number"
					name="phone_number"
					required
					placeholder="+380XXXXXXXXX"
					class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 font-mono text-sm text-surface-100 placeholder-surface-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
				/>
				<p class="mt-1 text-xs text-surface-500">Формат E.164: +380...</p>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
			>
				{#if loading}
					<span class="inline-flex items-center gap-2">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						Ініціюємо дзвінок...
					</span>
				{:else}
					Зателефонувати
				{/if}
			</button>
		</form>
	{/if}
</div>
