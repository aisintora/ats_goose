<script lang="ts">
	import ScriptForm from '$lib/components/ScriptForm.svelte';

	const { form } = $props();
</script>

<div class="mx-auto max-w-3xl">
	{#if form?.error}
		<div class="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{form.error}
		</div>
	{/if}

	<h1 class="mb-6 text-2xl font-bold text-surface-100">Новий скрипт</h1>
	<ScriptForm action="?/create" />
</div>
