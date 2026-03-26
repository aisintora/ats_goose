<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<p class="mb-2 text-6xl font-bold text-surface-600">{page.status}</p>
	<h1 class="mb-4 text-xl font-semibold text-surface-100">
		{#if page.status === 404}
			Сторінку не знайдено
		{:else if page.status === 500}
			Помилка сервера
		{:else}
			Щось пішло не так
		{/if}
	</h1>
	<p class="mb-8 max-w-md text-sm text-surface-400">
		{page.error?.message ?? 'Спробуйте оновити сторінку або повернутись на головну.'}
	</p>
	<a
		href="/"
		class="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light"
	>
		На головну
	</a>
</div>
