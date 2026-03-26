<script lang="ts">
	import type { CallStatus, Sentiment } from '$lib/types';

	type Props = {
		status?: CallStatus;
		sentiment?: Sentiment;
		direction?: 'inbound' | 'outbound';
	};

	const { status, sentiment, direction }: Props = $props();

	const statusColors: Record<string, string> = {
		active: 'bg-green-500/20 text-green-400 border-green-500/30',
		completed: 'bg-surface-700/50 text-surface-300 border-surface-600',
		failed: 'bg-red-500/20 text-red-400 border-red-500/30'
	};

	const sentimentColors: Record<string, string> = {
		positive: 'bg-green-500/20 text-green-400 border-green-500/30',
		neutral: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
		negative: 'bg-red-500/20 text-red-400 border-red-500/30'
	};

	const sentimentLabels: Record<string, string> = {
		positive: 'Позитивний',
		neutral: 'Нейтральний',
		negative: 'Негативний'
	};

	const directionLabels: Record<string, string> = {
		inbound: 'Вхідний',
		outbound: 'Вихідний'
	};

	const colorClass = $derived(
		status
			? statusColors[status]
			: sentiment
				? sentimentColors[sentiment]
				: 'bg-surface-700/50 text-surface-300 border-surface-600'
	);

	const label = $derived(
		status ?? (sentiment ? sentimentLabels[sentiment] : direction ? directionLabels[direction] : '')
	);
</script>

<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {colorClass}">
	{label}
</span>
