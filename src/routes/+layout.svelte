<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>AI Call Demo — Sintora Labs</title>
</svelte:head>

<div class="flex h-screen overflow-hidden">
	<Nav />
	<main class="flex-1 overflow-y-auto p-8">
		{@render children()}
	</main>
</div>
