<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { ptBR } from 'date-fns/locale';
	import Avatar from '$lib/components/Avatar.svelte';
	import { TIPOS_CUIDADO } from '$lib/ui/tipos-cuidado';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const hoje = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
	const realizados = $derived(
		data.valido ? data.eventos.filter((e) => e.status === 'realizado').length : 0
	);
	const atrasados = $derived(
		data.valido ? data.eventos.filter((e) => e.status === 'atrasado').length : 0
	);
</script>

<svelte:head>
	<title>{data.valido ? `Dia de ${data.paciente.nome}` : 'Link indisponível'} · Cuida+</title>
</svelte:head>

{#if !data.valido}
	<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
		<p class="text-4xl" aria-hidden="true">🔒</p>
		<h1 class="text-xl font-bold text-navy">Link indisponível</h1>
		<p class="text-sm text-ink/60">
			Este link não está mais ativo. Peça um novo endereço para quem cuida.
		</p>
	</main>
{:else}
	<main class="mx-auto w-full max-w-lg pb-10">
		<header class="flex items-center gap-4 bg-navy p-4 text-white">
			<Avatar nome={data.paciente.nome} fotoUrl={data.paciente.fotoUrl} tamanho="lg" />
			<div class="min-w-0">
				<h1 class="truncate text-xl font-bold">{data.paciente.nome}</h1>
				<p class="text-sm text-white/70 first-letter:uppercase">{hoje}</p>
			</div>
		</header>

		{#if data.temAlertaCritico}
			<p class="border-l-4 border-critico bg-critico/10 p-3 text-sm font-semibold text-critico" role="alert">
				⚠️ Há um alerta crítico não resolvido hoje. O cuidador já foi notificado.
			</p>
		{/if}

		<section class="grid grid-cols-3 gap-2 p-4 text-center" aria-label="Resumo do dia">
			<div class="rounded-(--radius-card-lg) border border-ink/10 p-2">
				<p class="text-xl font-bold text-realizado">{realizados}</p>
				<p class="text-[11px] text-ink/60">realizados</p>
			</div>
			<div class="rounded-(--radius-card-lg) border border-ink/10 p-2">
				<p class="text-xl font-bold text-atencao">{atrasados}</p>
				<p class="text-[11px] text-ink/60">atrasados</p>
			</div>
			<div class="rounded-(--radius-card-lg) border border-ink/10 p-2">
				<p class="text-xl font-bold text-navy">{data.eventos.length}</p>
				<p class="text-[11px] text-ink/60">registros</p>
			</div>
		</section>

		<section class="px-4">
			{#if data.eventos.length === 0}
				<p class="rounded-(--radius-card-lg) border border-dashed border-ink/20 p-8 text-center text-ink/60">
					Nenhum registro hoje ainda.
				</p>
			{:else}
				<ol class="relative flex flex-col gap-4 pl-2">
					{#each data.eventos as evento (evento.id)}
						<li class="flex gap-3">
							<span class="w-11 shrink-0 pt-1.5 text-right font-mono text-sm font-bold text-navy">
								{format(parseISO(evento.ocorridoEm), 'HH:mm')}
							</span>
							<div class="relative flex flex-col items-center">
								<span
									class="z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm text-white {TIPOS_CUIDADO[evento.tipo].cor}"
									aria-hidden="true"
								>
									{TIPOS_CUIDADO[evento.tipo].icone}
								</span>
								<span class="absolute top-8 bottom-[-1rem] w-px bg-ink/15" aria-hidden="true"></span>
							</div>
							<div class="min-w-0 flex-1 rounded-(--radius-card-lg) border border-ink/10 p-3 {evento.status === 'pulado' ? 'opacity-60' : ''}">
								<p class="font-semibold {evento.status === 'pulado' ? 'line-through' : ''}">
									{evento.titulo}
								</p>
								{#if evento.status === 'atrasado'}
									<span class="rounded-full bg-atencao/15 px-2 py-0.5 text-xs font-bold text-atencao">atrasado</span>
								{/if}
								<!-- §6: observações do cuidador não aparecem para a família -->
							</div>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		<footer class="mt-8 px-4 text-center text-xs text-ink/40">
			Cuida+ · acesso somente leitura do dia atual, liberado pelo cuidador
		</footer>
	</main>
{/if}
