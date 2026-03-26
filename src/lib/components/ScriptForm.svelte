<script lang="ts">
	import type { Script, BusinessType } from '$lib/types';

	type Props = {
		script?: Script;
		action: string;
	};

	const { script, action }: Props = $props();

	const businessTypes: { value: BusinessType; label: string }[] = [
		{ value: 'hotel', label: 'Готель' },
		{ value: 'carwash', label: 'Автомийка' },
		{ value: 'autoservice', label: 'Автосервіс' }
	];

	const voices: { value: string; label: string; gender: string }[] = [
		{ value: '0ZQZuw8Sn4cU0rN1Tm2K', label: 'Ярослава', gender: 'Жін.' },
		{ value: 'YNU4vLsch5CerDqxgcFS', label: 'Роман', gender: 'Чол.' },
		{ value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah — впевнена, зріла', gender: 'Жін.' },
		{ value: 'JBFqnCBsd6RMkjVDRZzb', label: 'George — теплий, привітний', gender: 'Чол.' },
		{ value: 'Xb7hH8MSUJpSbSDYk0k2', label: 'Alice — чітка, залучена', gender: 'Жін.' },
		{ value: 'XrExE9yKIg1WjnnlVkGX', label: 'Matilda — професійна', gender: 'Жін.' },
		{ value: 'cgSgspJ2msm6clMCkdW9', label: 'Jessica — яскрава, тепла', gender: 'Жін.' },
		{ value: 'cjVigY5qzO86Huf0OWal', label: 'Eric — рівний, надійний', gender: 'Чол.' },
		{ value: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel — ведучий', gender: 'Чол.' },
		{ value: 'nPczCjzI2devNBz1zQrb', label: 'Brian — глибокий, заспокійливий', gender: 'Чол.' }
	];
</script>

<form method="POST" {action} class="space-y-6">
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="name" class="mb-1.5 block text-sm font-medium text-surface-300">Назва</label>
			<input
				type="text"
				id="name"
				name="name"
				value={script?.name ?? ''}
				required
				class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
				placeholder="Консьерж готелю Люмен"
			/>
		</div>

		<div>
			<label for="business_type" class="mb-1.5 block text-sm font-medium text-surface-300">Тип бізнесу</label>
			<select
				id="business_type"
				name="business_type"
				required
				class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
			>
				{#each businessTypes as bt}
					<option value={bt.value} selected={script?.business_type === bt.value}>{bt.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<input type="hidden" name="language" value="uk" />

	<div class="grid grid-cols-1 gap-4">
		<div>
			<label for="voice_id" class="mb-1.5 block text-sm font-medium text-surface-300">Голос агента</label>
			<select
				id="voice_id"
				name="voice_id"
				required
				class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
			>
				<option value="" disabled selected={!script?.voice_id}>Оберіть голос...</option>
				{#each voices as voice}
					<option value={voice.value} selected={script?.voice_id === voice.value}>
						{voice.label} ({voice.gender})
					</option>
				{/each}
			</select>
		</div>
	</div>

	<div>
		<label for="first_message" class="mb-1.5 block text-sm font-medium text-surface-300">Привітання агента</label>
		<textarea
			id="first_message"
			name="first_message"
			rows="2"
			required
			class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
			placeholder="Вітаємо! Готель Люмен, адміністратор Олена. Чим можу допомогти?"
		>{script?.first_message ?? ''}</textarea>
	</div>

	<div>
		<label for="system_prompt" class="mb-1.5 block text-sm font-medium text-surface-300">
			Скрипт розмови
		</label>
		<textarea
			id="system_prompt"
			name="system_prompt"
			rows="16"
			required
			class="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 font-mono text-sm text-surface-100 placeholder-surface-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
			placeholder="Ти — AI-консьерж готелю. Твоя задача..."
		>{script?.system_prompt ?? ''}</textarea>
	</div>

	{#if script?.agent_id}
		<div class="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
			<p class="text-xs text-green-400">Агент синхронізовано</p>
		</div>
	{/if}

	<div class="flex gap-3">
		<button
			type="submit"
			class="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
		>
			{script ? 'Зберегти зміни' : 'Створити скрипт'}
		</button>
		<a
			href="/"
			class="rounded-lg border border-surface-700 px-5 py-2.5 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800"
		>
			Скасувати
		</a>
	</div>
</form>
