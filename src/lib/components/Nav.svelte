<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/', label: 'Дашборд', icon: '📊' },
		{ href: '/scripts/new', label: 'Новий скрипт', icon: '📝' },
		{ href: '/calls/new', label: 'Новий дзвінок', icon: '📞' }
	];
</script>

<nav class="flex h-screen w-64 flex-col border-r border-surface-800 bg-surface-900">
	<div class="border-b border-surface-800 p-6">
		<h1 class="text-xl font-bold text-surface-100">AI Call Demo</h1>
	</div>

	<div class="flex flex-1 flex-col gap-1 p-3">
		{#each links as link}
			<a
				href={link.href}
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors
					{page.url.pathname === link.href
					? 'bg-surface-800 text-surface-100'
					: 'text-surface-400 hover:bg-surface-800/50 hover:text-surface-200'}"
			>
				<span>{link.icon}</span>
				<span>{link.label}</span>
			</a>
		{/each}
	</div>

	<div class="border-t border-surface-800 p-4">
		<div class="flex items-center gap-2">
			<div class="h-2 w-2 rounded-full bg-green-500"></div>
			<span class="text-xs text-surface-500">Система активна</span>
		</div>
	</div>
</nav>
