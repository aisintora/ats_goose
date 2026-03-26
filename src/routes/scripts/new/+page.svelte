<script lang="ts">
	import ScriptForm from '$lib/components/ScriptForm.svelte';
</script>

<div class="mx-auto max-w-3xl">
	<h1 class="mb-6 text-2xl font-bold text-surface-100">Новий скрипт</h1>
	<ScriptForm action="?/create" />
</div>
