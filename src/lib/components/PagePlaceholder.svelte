<script lang="ts">
	let { titulo, descricao }: { titulo: string; descricao?: string } = $props();
</script>

<svelte:head>
	<title>{titulo} · Cuida+</title>
</svelte:head>

<section class="flex min-h-[60dvh] flex-col items-center justify-center gap-2 p-6 text-center">
	<h1 class="text-2xl font-bold text-navy">{titulo}</h1>
	<p class="text-sm text-ink/60">
		{descricao ?? 'Tela em construção — chega numa próxima fase.'}
	</p>
</section>
