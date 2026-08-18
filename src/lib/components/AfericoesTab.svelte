<script lang="ts">
	import { formatISO, subDays } from 'date-fns';
	import GraficoCampo from '$lib/components/GraficoCampo.svelte';
	import type { MeasurementField, MeasurementType, Reading } from '$lib/domain/types';
	import { services } from '$lib/services';

	let { patientId }: { patientId: string } = $props();

	interface CartaoCampo {
		tipo: MeasurementType;
		campo: MeasurementField;
		leituras: Reading[];
	}

	let periodo = $state<7 | 30>(7);
	let cartoes = $state<CartaoCampo[]>([]);
	let carregando = $state(true);

	// um card por campo JÁ REGISTRADO — a tela nasce dos dados (§5)
	async function carregar(dias: number) {
		carregando = true;
		const [tipos, campos] = await Promise.all([
			services.measurements.listarTipos(true),
			services.measurements.camposRegistrados(patientId)
		]);
		const tiposPorId = new Map(tipos.map((t) => [t.id, t]));
		const corte = formatISO(subDays(new Date(), dias));
		const montados: CartaoCampo[] = [];
		for (const { measurementTypeId, campo } of campos) {
			const tipo = tiposPorId.get(measurementTypeId);
			const def = tipo?.campos.find((c) => c.chave === campo);
			if (!tipo || !def) continue;
			const leituras = (await services.measurements.leituras(patientId, tipo.id, campo)).filter(
				(r) => r.aferidoEm >= corte
			);
			montados.push({ tipo, campo: def, leituras });
		}
		cartoes = montados.sort((a, b) => a.tipo.nome.localeCompare(b.tipo.nome));
		carregando = false;
	}

	$effect(() => {
		void carregar(periodo);
	});
</script>

<div>
	<div class="mb-4 flex items-center justify-end gap-1" role="group" aria-label="Período">
		{#each [7, 30] as dias (dias)}
			<button
				onclick={() => (periodo = dias as 7 | 30)}
				aria-pressed={periodo === dias}
				class="touch-target rounded-(--radius-card) border px-4 text-sm font-semibold
					{periodo === dias ? 'border-marca bg-navy text-white' : 'border-ink/15 text-ink/60'}"
			>
				{dias} dias
			</button>
		{/each}
	</div>

	{#if carregando}
		<p class="p-6 text-center text-sm text-ink/50">Carregando…</p>
	{:else if cartoes.length === 0}
		<div class="flex flex-col items-center gap-3 rounded-(--radius-card-lg) border border-dashed border-ink/20 p-8 text-center">
			<p class="text-ink/60">Nenhuma aferição registrada ainda.</p>
			<a
				href="/pacientes/{patientId}/registrar"
				class="touch-target flex items-center rounded-(--radius-card) bg-navy px-5 text-sm font-semibold text-white"
			>
				Registrar a primeira
			</a>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each cartoes as cartao (cartao.tipo.id + cartao.campo.chave)}
				<GraficoCampo tipo={cartao.tipo} campo={cartao.campo} leituras={cartao.leituras} />
			{/each}
		</div>
	{/if}
</div>
