<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { scaleTime } from 'd3-scale';
	import { AnnotationRange, Axis, Chart, Layer, Points, Spline } from 'layerchart';
	import type { MeasurementField, MeasurementType, Reading } from '$lib/domain/types';

	let {
		tipo,
		campo,
		leituras
	}: { tipo: MeasurementType; campo: MeasurementField; leituras: Reading[] } = $props();

	// A tela é gerada a partir dos DADOS (formato do campo), nunca de lista fixa (§5)
	const numerico = $derived(campo.formato === 'numero' || campo.formato === 'escala');

	const pontos = $derived(
		leituras
			.map((r) => ({
				data: parseISO(r.aferidoEm),
				valor: r.valorNum ?? 0,
				texto: r.valorTexto,
				fora: r.foraDoPadrao
			}))
			.sort((a, b) => a.data.getTime() - b.data.getTime())
	);
	const foraDoPadrao = $derived(pontos.filter((p) => p.fora));

	const dominioY = $derived.by(() => {
		if (pontos.length === 0) return [0, 1] as [number, number];
		const valores = pontos.map((p) => p.valor);
		if (campo.faixaNormal?.min !== undefined) valores.push(campo.faixaNormal.min);
		if (campo.faixaNormal?.max !== undefined) valores.push(campo.faixaNormal.max);
		const min = Math.min(...valores);
		const max = Math.max(...valores);
		const folga = Math.max((max - min) * 0.15, 1);
		return [min - folga, max + folga] as [number, number];
	});

	// grade de frequência por dia (booleano/opcoes)
	const porDia = $derived.by(() => {
		const mapa = new Map<string, Reading[]>();
		for (const r of leituras) {
			const dia = r.aferidoEm.slice(0, 10);
			mapa.set(dia, [...(mapa.get(dia) ?? []), r]);
		}
		return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0]));
	});
</script>

<article class="rounded-(--radius-card-lg) border border-ink/10 p-4">
	<header class="mb-2 flex items-center gap-2">
		<span class="text-xl" aria-hidden="true">{tipo.icone}</span>
		<h3 class="font-semibold">
			{tipo.nome}
			{#if tipo.campos.length > 1}
				<span class="text-sm font-normal text-ink/60">· {campo.rotulo}</span>
			{/if}
			{#if campo.unidade}
				<span class="text-sm font-normal text-ink/50">({campo.unidade})</span>
			{/if}
		</h3>
		{#if foraDoPadrao.length > 0}
			<span class="ml-auto rounded-full bg-critico/10 px-2 py-0.5 text-xs font-bold text-critico">
				{foraDoPadrao.length} fora do padrão
			</span>
		{/if}
	</header>

	{#if leituras.length === 0}
		<p class="py-4 text-center text-sm text-ink/50">Sem registros no período.</p>
	{:else if numerico}
		<div class="h-44" data-grafico={campo.chave}>
			<Chart
				data={pontos}
				x="data"
				xScale={scaleTime()}
				y="valor"
				yDomain={dominioY}
				padding={{ left: 32, bottom: 20, top: 8, right: 8 }}
			>
				<Layer type="svg">
					{#if campo.faixaNormal && (campo.faixaNormal.min !== undefined || campo.faixaNormal.max !== undefined)}
						<AnnotationRange
							y={[campo.faixaNormal.min ?? dominioY[0], campo.faixaNormal.max ?? dominioY[1]]}
							fill="var(--color-realizado)"
							class="opacity-10"
						/>
					{/if}
					<Axis placement="left" />
					<Axis placement="bottom" format={(d: Date) => format(d, 'dd/MM')} />
					<Spline class="stroke-cuidado stroke-2" />
					<Points r={3} class="fill-navy" />
					{#if foraDoPadrao.length > 0}
						<Points data={foraDoPadrao} r={5} class="fill-critico stroke-white" />
					{/if}
				</Layer>
			</Chart>
		</div>
	{:else if campo.formato === 'texto'}
		<ol class="flex flex-col gap-2">
			{#each [...pontos].reverse() as ponto (ponto.data.getTime())}
				<li class="rounded-(--radius-card) bg-navy-50 p-3 text-sm">
					<span class="font-mono text-xs text-ink/50">{format(ponto.data, 'dd/MM HH:mm')}</span>
					<p>{ponto.texto}</p>
				</li>
			{/each}
		</ol>
	{:else}
		<!-- booleano/opcoes: grade de frequência por dia -->
		<ul class="flex flex-col gap-1">
			{#each porDia as [dia, registros] (dia)}
				<li class="flex items-center gap-2 text-sm">
					<span class="w-14 shrink-0 font-mono text-xs text-ink/50">
						{format(parseISO(dia), 'dd/MM')}
					</span>
					<div class="flex flex-wrap gap-1">
						{#each registros as r (r.id)}
							{#if campo.formato === 'booleano'}
								<span
									class="flex size-6 items-center justify-center rounded text-xs font-bold text-white {r.valorNum === 1 ? 'bg-realizado' : 'bg-atencao'}"
									title={r.foraDoPadrao ? 'fora do esperado' : ''}
								>
									{r.valorNum === 1 ? '✓' : '✗'}
								</span>
							{:else}
								<span
									class="rounded px-2 py-0.5 text-xs font-medium {r.foraDoPadrao ? 'bg-critico/15 text-critico' : 'bg-navy-50 text-navy'}"
								>
									{r.valorTexto}
								</span>
							{/if}
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</article>
