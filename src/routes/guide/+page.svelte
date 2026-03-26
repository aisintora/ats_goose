<script lang="ts">
	const { data } = $props();

	const phoneNumber = '+380914818165';
	const phoneFormatted = '+38 (091) 481-81-65';
</script>

<div class="mx-auto max-w-3xl space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-surface-100">Як це працює</h1>
		<p class="mt-2 text-sm text-surface-400">
			Система AI-дзвінків дозволяє створювати голосових агентів, які автоматично відповідають на дзвінки та самі телефонують клієнтам.
		</p>
	</div>

	<!-- Step 1: Scripts -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-6">
		<div class="mb-3 flex items-center gap-3">
			<span class="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">1</span>
			<h2 class="text-lg font-semibold text-surface-100">Створіть скрипт</h2>
		</div>
		<p class="mb-4 text-sm text-surface-400">
			Скрипт — це сценарій поведінки AI-агента. Він визначає:
		</p>
		<ul class="mb-4 space-y-2 text-sm text-surface-300">
			<li class="flex items-start gap-2">
				<span class="mt-0.5 text-accent">-</span>
				<span><strong>Тип бізнесу</strong> — готель, автомийка чи автосервіс</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-0.5 text-accent">-</span>
				<span><strong>Привітання</strong> — перша фраза, яку почує клієнт</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-0.5 text-accent">-</span>
				<span><strong>Голос</strong> — як звучить агент (чоловічий / жіночий, різні стилі)</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-0.5 text-accent">-</span>
				<span><strong>Скрипт розмови</strong> — інструкція агенту: як відповідати, що пропонувати, які дані збирати</span>
			</li>
		</ul>
		<a
			href="/scripts/new"
			class="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
		>
			Створити скрипт
		</a>
	</section>

	<!-- Step 2: Activate -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-6">
		<div class="mb-3 flex items-center gap-3">
			<span class="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">2</span>
			<h2 class="text-lg font-semibold text-surface-100">Активуйте скрипт</h2>
		</div>
		<p class="text-sm text-surface-400">
			Тільки один скрипт може бути активним одночасно. Активний скрипт відповідає на всі вхідні дзвінки.
			На дашборді натисніть <strong class="text-surface-200">"Зробити активним"</strong> на потрібному скрипті.
		</p>
	</section>

	<!-- Step 3: Inbound -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-6">
		<div class="mb-3 flex items-center gap-3">
			<span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">3</span>
			<h2 class="text-lg font-semibold text-surface-100">Вхідний дзвінок</h2>
		</div>
		<p class="mb-4 text-sm text-surface-400">
			Щоб протестувати, як AI-агент відповідає — просто зателефонуйте на номер:
		</p>
		<div class="rounded-lg border border-blue-500/20 bg-blue-500/5 px-5 py-4">
			<p class="text-center font-mono text-2xl font-bold tracking-wider text-blue-400">
				{phoneFormatted}
			</p>
			<p class="mt-2 text-center text-xs text-surface-500">Звичайний дзвінок з мобільного</p>
		</div>
		<p class="mt-4 text-sm text-surface-400">
			Агент відповість згідно з активним скриптом. Після дзвінка ви побачите транскрипцію, аудіо та AI-аналіз.
		</p>
	</section>

	<!-- Step 4: Outbound -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-6">
		<div class="mb-3 flex items-center gap-3">
			<span class="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-sm font-bold text-green-400">4</span>
			<h2 class="text-lg font-semibold text-surface-100">Вихідний дзвінок</h2>
		</div>
		<p class="mb-4 text-sm text-surface-400">
			AI-агент може сам зателефонувати клієнту. Перейдіть на сторінку нового дзвінка:
		</p>
		<ol class="mb-4 space-y-2 text-sm text-surface-300">
			<li class="flex items-start gap-2">
				<span class="font-mono text-xs text-surface-500">1.</span>
				<span>Оберіть скрипт, за яким агент буде розмовляти</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="font-mono text-xs text-surface-500">2.</span>
				<span>Введіть номер у форматі <code class="rounded bg-surface-800 px-1.5 py-0.5 font-mono text-xs">+380XXXXXXXXX</code></span>
			</li>
			<li class="flex items-start gap-2">
				<span class="font-mono text-xs text-surface-500">3.</span>
				<span>Натисніть "Зателефонувати" — агент зателефонує і почне розмову</span>
			</li>
		</ol>
		<a
			href="/calls/new"
			class="inline-block rounded-lg border border-surface-700 px-4 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800"
		>
			Зателефонувати
		</a>
	</section>

	<!-- Step 5: Results -->
	<section class="rounded-xl border border-surface-800 bg-surface-900 p-6">
		<div class="mb-3 flex items-center gap-3">
			<span class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-sm font-bold text-purple-400">5</span>
			<h2 class="text-lg font-semibold text-surface-100">Аналіз дзвінків</h2>
		</div>
		<p class="text-sm text-surface-400">
			Після кожного дзвінка система автоматично:
		</p>
		<ul class="mt-3 space-y-2 text-sm text-surface-300">
			<li class="flex items-start gap-2">
				<span class="mt-0.5 text-purple-400">-</span>
				<span>Зберігає повну <strong>транскрипцію</strong> розмови</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-0.5 text-purple-400">-</span>
				<span>Записує <strong>аудіо</strong> дзвінка</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="mt-0.5 text-purple-400">-</span>
				<span>Генерує <strong>AI-аналіз</strong>: короткий підсумок, настрій клієнта, дотримання скрипту, ключові теми</span>
			</li>
		</ul>
	</section>
</div>
