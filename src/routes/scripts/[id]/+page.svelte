<script lang="ts">
	import ScriptForm from '$lib/components/ScriptForm.svelte';

	const { data } = $props();
</script>

<div class="mx-auto max-w-3xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-surface-100">Редагувати скрипт</h1>
		<form method="POST" action="?/delete">
			<button
				type="submit"
				class="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
				onclick={(e: MouseEvent) => { if (!confirm('Видалити скрипт?')) e.preventDefault(); }}
			>
				Видалити
			</button>
		</form>
	</div>
	<ScriptForm script={data.script} action="?/update" />
</div>
