<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import TipoAfericaoForm from '$lib/components/TipoAfericaoForm.svelte';
	import type { MeasurementType } from '$lib/domain/types';
	import { services } from '$lib/services';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let editando = $state<MeasurementType | 'novo' | null>(null);

	async function fechar(salvou: boolean) {
		editando = null;
		if (salvou) await invalidateAll();
	}

	async function alternar(tipo: MeasurementType) {
		await services.measurements.alternarAtivo(tipo.id, !tipo.ativo);
		await invalidateAll();
	}

	const resumoCampos = (tipo: MeasurementType) =>
		tipo.campos.map((c) => c.rotulo + (c.unidade ? ` (${c.unidade})` : '')).join(' · ');
</script>

<svelte:head>
	<title>Catálogo de aferições · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	{#if editando}
		<h1 class="mb-4 text-2xl font-bold text-marca">
			{editando === 'novo' ? 'Nova aferição' : `Editar ${editando.nome}`}
		</h1>
		<TipoAfericaoForm inicial={editando === 'novo' ? undefined : editando} aoFechar={fechar} />
	{:else}
		<header class="mb-4 flex items-center justify-between gap-3">
			<h1 class="text-2xl font-bold text-marca">Aferições</h1>
			<button
				onclick={() => (editando = 'novo')}
				class="touch-target flex items-center rounded-(--radius-card) bg-navy px-4 text-sm font-semibold text-white"
			>
				+ Nova
			</button>
		</header>
		<p class="mb-4 text-sm text-ink/60">
			Crie qualquer aferição sem mexer em código — os alertas passam a valer na hora.
		</p>

		<ul class="flex flex-col gap-3">
			{#each data.tipos as tipo (tipo.id)}
				<li
					class="flex items-center gap-3 rounded-(--radius-card-lg) border border-ink/10 p-4 {tipo.ativo ? '' : 'opacity-50'}"
				>
					<span class="text-2xl" aria-hidden="true">{tipo.icone}</span>
					<div class="min-w-0 flex-1">
						<p class="font-semibold">
							{tipo.nome}
							{#if tipo.sistema}
								<span class="ml-1 rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-marca">padrão</span>
							{/if}
						</p>
						<p class="truncate text-sm text-ink/60">{resumoCampos(tipo)}</p>
					</div>
					<div class="flex shrink-0 gap-1">
						<button
							onclick={() => (editando = tipo)}
							class="touch-target px-2 text-sm font-medium text-cuidado"
						>
							Editar
						</button>
						<button
							onclick={() => alternar(tipo)}
							class="touch-target px-2 text-sm font-medium {tipo.ativo ? 'text-ink/50' : 'text-realizado'}"
						>
							{tipo.ativo ? 'Desativar' : 'Ativar'}
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
