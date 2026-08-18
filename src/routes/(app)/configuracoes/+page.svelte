<script lang="ts">
	import { goto } from '$app/navigation';
	import { services } from '$lib/services';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let resetando = $state(false);

	async function sair() {
		await services.auth.logout();
		await goto('/login');
	}

	async function resetarDemo() {
		if (!confirm('Apagar todos os dados e recarregar a demonstração?')) return;
		resetando = true;
		await services.demo.resetar();
		await services.auth.logout(); // a sessão aponta para um cuidador que não existe mais
		resetando = false;
		await goto('/login');
	}
</script>

<svelte:head>
	<title>Configurações · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<h1 class="mb-4 text-2xl font-bold text-navy">Configurações</h1>

	<section class="mb-4 flex items-center gap-3 rounded-(--radius-card-lg) border border-ink/10 p-4">
		{#if data.cuidador.fotoUrl}
			<img src={data.cuidador.fotoUrl} alt="" class="size-12 rounded-full object-cover" />
		{:else}
			<div class="flex size-12 items-center justify-center rounded-full bg-navy-50 text-lg font-bold text-navy">
				{data.cuidador.nome.slice(0, 1)}
			</div>
		{/if}
		<div>
			<p class="font-semibold">{data.cuidador.nome}</p>
			<p class="text-sm text-ink/60">{data.cuidador.email}</p>
		</div>
	</section>

	<nav class="flex flex-col overflow-hidden rounded-(--radius-card-lg) border border-ink/10">
		<a href="/configuracoes/afericoes" class="touch-target flex items-center justify-between px-4 hover:bg-navy-50">
			<span>Catálogo de aferições</span>
			<span aria-hidden="true" class="text-ink/40">›</span>
		</a>
		<button
			onclick={resetarDemo}
			disabled={resetando}
			class="touch-target flex items-center justify-between border-t border-ink/10 px-4 text-left text-atencao hover:bg-navy-50"
		>
			<span>{resetando ? 'Resetando…' : 'Resetar dados de demonstração'}</span>
		</button>
		<button
			onclick={sair}
			class="touch-target flex items-center justify-between border-t border-ink/10 px-4 text-left text-critico hover:bg-navy-50"
		>
			<span>Sair</span>
		</button>
	</nav>
</div>
