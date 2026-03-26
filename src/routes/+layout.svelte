<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>AI Call Demo — Sintora Labs</title>
</svelte:head>

{#if navigating.to}
	<div class="fixed inset-x-0 top-0 z-50 h-0.5 bg-accent/30">
		<div class="h-full animate-pulse bg-accent" style="width: 80%"></div>
	</div>
{/if}

<div class="flex h-screen overflow-hidden">
	<Nav />
	<main class="flex-1 overflow-y-auto p-8">
		{@render children()}
	</main>
</div>
