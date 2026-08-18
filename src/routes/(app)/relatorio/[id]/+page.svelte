<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { ptBR } from 'date-fns/locale';
	import { TIPOS_CUIDADO } from '$lib/ui/tipos-cuidado';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let copiado = $state(false);

	const hoje = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
	const realizados = $derived(data.eventos.filter((e) => e.status === 'realizado').length);
	const atrasados = $derived(data.eventos.filter((e) => e.status === 'atrasado').length);
	const pulados = $derived(data.eventos.filter((e) => e.status === 'pulado').length);

	const resumoTexto = $derived(
		[
			`Relatório do dia — ${data.paciente.nome} (${hoje})`,
			`${realizados} realizados · ${atrasados} atrasados · ${pulados} pulados · ${data.foraDoPadraoHoje.length} aferição(ões) fora do padrão`,
			'',
			...data.eventos.map(
				(e) =>
					`${format(parseISO(e.ocorridoEm), 'HH:mm')} ${e.titulo}${e.status !== 'realizado' ? ` (${e.status})` : ''}`
			)
		].join('\n')
	);

	async function compartilhar() {
		if (navigator.share) {
			try {
				await navigator.share({ title: `Relatório — ${data.paciente.nome}`, text: resumoTexto });
				return;
			} catch {
				// cancelado — cai no clipboard
			}
		}
		await navigator.clipboard.writeText(resumoTexto);
		copiado = true;
		setTimeout(() => (copiado = false), 2500);
	}
</script>

<svelte:head>
	<title>Relatório · {data.paciente.nome} · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<header class="mb-4">
		<h1 class="text-2xl font-bold text-navy">Relatório do dia</h1>
		<p class="text-sm text-ink/60">
			{data.paciente.nome} · <span class="first-letter:uppercase">{hoje}</span>
		</p>
	</header>

	<section class="mb-4 grid grid-cols-4 gap-2 text-center" aria-label="Contadores do dia">
		<div class="rounded-(--radius-card-lg) border border-ink/10 p-2" data-contador="realizados">
			<p class="text-xl font-bold text-realizado">{realizados}</p>
			<p class="text-[11px] text-ink/60">realizados</p>
		</div>
		<div class="rounded-(--radius-card-lg) border border-ink/10 p-2" data-contador="atrasados">
			<p class="text-xl font-bold text-atencao">{atrasados}</p>
			<p class="text-[11px] text-ink/60">atrasados</p>
		</div>
		<div class="rounded-(--radius-card-lg) border border-ink/10 p-2" data-contador="pulados">
			<p class="text-xl font-bold text-ink/50">{pulados}</p>
			<p class="text-[11px] text-ink/60">pulados</p>
		</div>
		<div class="rounded-(--radius-card-lg) border border-ink/10 p-2" data-contador="fora">
			<p class="text-xl font-bold text-critico">{data.foraDoPadraoHoje.length}</p>
			<p class="text-[11px] text-ink/60">fora do padrão</p>
		</div>
	</section>

	{#if data.eventos.length === 0}
		<p class="rounded-(--radius-card-lg) border border-dashed border-ink/20 p-8 text-center text-ink/60">
			Nenhum registro hoje ainda.
		</p>
	{:else}
		<ol class="mb-6 flex flex-col overflow-hidden rounded-(--radius-card-lg) border border-ink/10">
			{#each data.eventos as evento (evento.id)}
				<li class="flex items-center gap-3 border-b border-ink/5 px-4 py-2.5 last:border-b-0">
					<span class="w-12 shrink-0 font-mono text-sm font-bold text-navy">
						{format(parseISO(evento.ocorridoEm), 'HH:mm')}
					</span>
					<span aria-hidden="true">{TIPOS_CUIDADO[evento.tipo].icone}</span>
					<span class="min-w-0 flex-1 truncate text-sm {evento.status === 'pulado' ? 'line-through opacity-60' : ''}">
						{evento.titulo}
					</span>
					{#if evento.status === 'atrasado'}
						<span class="rounded-full bg-atencao/15 px-2 py-0.5 text-[10px] font-bold text-atencao">atrasado</span>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}

	<div class="flex flex-col gap-2">
		<button
			onclick={compartilhar}
			class="touch-target rounded-(--radius-card) bg-comunicacao text-sm font-semibold text-white"
		>
			{copiado ? 'Copiado! ✓' : 'Compartilhar resumo'}
		</button>
		<a
			href="/pacientes/{data.paciente.id}/compartilhar"
			class="touch-target flex items-center justify-center rounded-(--radius-card) border border-comunicacao text-sm font-semibold text-comunicacao"
		>
			Link permanente para a família
		</a>
	</div>
</div>
