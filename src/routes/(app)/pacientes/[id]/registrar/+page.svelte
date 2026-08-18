<script lang="ts">
	import { formatISO } from 'date-fns';
	import { goto } from '$app/navigation';
	import CampoAfericao from '$lib/components/CampoAfericao.svelte';
	import { prepararLeituras, type EntradaCampo } from '$lib/domain/measurements/form';
	import type { MeasurementType } from '$lib/domain/types';
	import { services } from '$lib/services';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let tipoSelecionado = $state<MeasurementType | null>(null);
	let valores = $state<Record<string, EntradaCampo>>({});
	let observacao = $state('');
	let erros = $state<string[]>([]);
	let ocupado = $state(false);

	function escolherTipo(tipo: MeasurementType) {
		tipoSelecionado = tipo;
		valores = {};
		erros = [];
	}

	async function salvar(e: SubmitEvent) {
		e.preventDefault();
		if (!tipoSelecionado) return;
		const preparo = prepararLeituras(tipoSelecionado, valores);
		if (!preparo.ok) {
			erros = preparo.erros;
			return;
		}
		ocupado = true;
		const agora = formatISO(new Date());
		await services.events.criar(
			{
				patientId: data.paciente.id,
				tipo: 'medicao',
				titulo: tipoSelecionado.nome,
				observacao: observacao.trim() || undefined,
				ocorridoEm: agora,
				registradoPor: data.cuidador.id,
				status: 'realizado'
			},
			preparo.valores.map((v) => ({
				...v,
				measurementTypeId: tipoSelecionado!.id,
				aferidoEm: agora
			}))
		);
		await goto(`/pacientes/${data.paciente.id}`, { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>Registrar · {data.paciente.nome} · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<h1 class="text-2xl font-bold text-navy">Registro rápido</h1>
	<p class="mb-4 text-sm text-ink/60">{data.paciente.nome}</p>

	{#if !tipoSelecionado}
		<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">Aferição</h2>
		<div class="grid grid-cols-2 gap-3">
			{#each data.tipos as tipo (tipo.id)}
				<button
					onclick={() => escolherTipo(tipo)}
					class="flex min-h-20 flex-col items-center justify-center gap-1 rounded-(--radius-card-lg) border border-ink/10 p-3 transition-colors hover:bg-navy-50"
				>
					<span class="text-2xl" aria-hidden="true">{tipo.icone}</span>
					<span class="text-center text-sm font-medium">{tipo.nome}</span>
				</button>
			{/each}
		</div>
		<p class="mt-6 rounded-(--radius-card) bg-navy-50 p-3 text-center text-sm text-ink/60">
			Medicação, refeição e os demais registros chegam na Fase 6.
		</p>
	{:else}
		<form onsubmit={salvar} class="flex flex-col gap-4">
			<header class="flex items-center gap-3">
				<span class="text-3xl" aria-hidden="true">{tipoSelecionado.icone}</span>
				<h2 class="text-lg font-bold">{tipoSelecionado.nome}</h2>
				<button
					type="button"
					onclick={() => (tipoSelecionado = null)}
					class="ml-auto text-sm font-medium text-cuidado"
				>
					trocar
				</button>
			</header>

			{#each tipoSelecionado.campos as campo (campo.chave)}
				<CampoAfericao {campo} bind:valor={valores[campo.chave]} />
			{/each}

			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-ink/80">Observação (opcional)</span>
				<textarea
					rows="2"
					bind:value={observacao}
					class="rounded-(--radius-card) border border-ink/20 p-4 text-base outline-navy"
				></textarea>
			</label>

			{#if erros.length > 0}
				<ul role="alert" class="rounded-(--radius-card) bg-critico/10 px-4 py-3 text-sm font-medium text-critico">
					{#each erros as e (e)}
						<li>{e}</li>
					{/each}
				</ul>
			{/if}

			<button
				type="submit"
				disabled={ocupado}
				class="touch-target rounded-(--radius-card) bg-navy text-base font-semibold text-white disabled:opacity-60"
			>
				{ocupado ? 'Salvando…' : 'Salvar aferição'}
			</button>
		</form>
	{/if}
</div>
