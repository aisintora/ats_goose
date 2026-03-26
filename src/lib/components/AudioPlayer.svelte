<script lang="ts">
	type Props = {
		url: string;
	};

	const { url }: Props = $props();
</script>

<div class="rounded-xl border border-surface-800 bg-surface-900 p-4">
	<p class="mb-2 text-sm font-medium text-surface-300">Запис дзвінка</p>
	<audio controls src={url} class="w-full" preload="metadata">
		<track kind="captions" />
	</audio>
</div>
