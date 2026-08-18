<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { invalidateAll } from '$app/navigation';
	import type { Alert } from '$lib/domain/types';
	import { services } from '$lib/services';
	import { reavaliarAlertas } from '$lib/services/alertas-engine';
	import { atualizarContagemAlertas } from '$lib/stores/alertas.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let reporCaixa = $state<Alert | null>(null);
	let novaQuantidade = $state(30);

	const criticos = $derived(data.alertas.filter((a) => a.severidade === 'critico'));
	const atencao = $derived(data.alertas.filter((a) => a.severidade === 'atencao'));

	async function reconhecer(alerta: Alert) {
		await services.alerts.reconhecer(alerta.id, data.cuidador.id);
		await atualizarContagemAlertas();
		await invalidateAll();
	}

	async function confirmarReposicao() {
		if (!reporCaixa?.referenciaId) return;
		await services.tasks.reporEstoque(reporCaixa.referenciaId, novaQuantidade);
		await services.alerts.reconhecer(reporCaixa.id, data.cuidador.id);
		reporCaixa = null;
		await reavaliarAlertas();
		await atualizarContagemAlertas();
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Alertas · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<h1 class="mb-4 text-2xl font-bold text-marca">Alertas</h1>

	{#if data.alertas.length === 0}
		<div class="rounded-(--radius-card-lg) border border-dashed border-ink/20 p-8 text-center">
			<p class="text-3xl">🎉</p>
			<p class="mt-2 text-ink/60">Tudo em dia — nenhum alerta ativo.</p>
		</div>
	{/if}

	{#snippet cartao(alerta: Alert)}
		<li
			class="rounded-(--radius-card-lg) border-l-4 p-4 shadow-sm {alerta.severidade === 'critico'
				? 'border-critico bg-critico/5'
				: 'border-atencao bg-atencao/5'}"
		>
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0">
					<p class="font-bold {alerta.severidade === 'critico' ? 'text-critico' : 'text-atencao'}">
						{alerta.titulo}
					</p>
					<p class="mt-0.5 text-sm text-ink/80">{alerta.detalhe}</p>
					<p class="mt-1 text-xs text-ink/50">
						<a href="/pacientes/{alerta.patientId}" class="font-medium underline">
							{data.nomesPacientes.get(alerta.patientId) ?? 'Paciente'}
						</a>
						· {format(parseISO(alerta.criadoEm), 'HH:mm')}
					</p>
				</div>
			</div>
			<div class="mt-2 flex justify-end gap-2">
				{#if alerta.tipo === 'estoque_baixo'}
					<button
						onclick={() => {
							reporCaixa = alerta;
							novaQuantidade = 30;
						}}
						class="touch-target rounded-(--radius-card) bg-navy px-4 text-xs font-semibold text-white"
					>
						Repor caixa
					</button>
				{/if}
				{#if alerta.tipo === 'medicacao_atrasada' || alerta.tipo === 'tarefa_pendente'}
					<a
						href="/pacientes/{alerta.patientId}/registrar?tarefa={alerta.referenciaId}"
						class="touch-target flex items-center rounded-(--radius-card) bg-navy px-4 text-xs font-semibold text-white"
					>
						Registrar agora
					</a>
				{/if}
				<button
					onclick={() => reconhecer(alerta)}
					class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-xs font-semibold text-ink/70"
				>
					Reconhecer
				</button>
			</div>
		</li>
	{/snippet}

	{#if criticos.length > 0}
		<section class="mb-6">
			<h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-critico">
				Críticos ({criticos.length})
			</h2>
			<ul class="flex flex-col gap-3">
				{#each criticos as alerta (alerta.id)}
					{@render cartao(alerta)}
				{/each}
			</ul>
		</section>
	{/if}

	{#if atencao.length > 0}
		<section>
			<h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-atencao">
				Atenção ({atencao.length})
			</h2>
			<ul class="flex flex-col gap-3">
				{#each atencao as alerta (alerta.id)}
					{@render cartao(alerta)}
				{/each}
			</ul>
		</section>
	{/if}
</div>

{#if reporCaixa}
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4" role="dialog" aria-modal="true">
		<div class="w-full max-w-md rounded-(--radius-card-lg) bg-superficie p-4 shadow-xl">
			<h3 class="mb-1 text-lg font-bold text-marca">Repor caixa</h3>
			<p class="mb-3 text-sm text-ink/60">{reporCaixa.detalhe}</p>
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-ink/80">Nova quantidade na caixa</span>
				<input
					type="number"
					min="0"
					step="any"
					bind:value={novaQuantidade}
					class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
				/>
			</label>
			<div class="mt-4 grid grid-cols-2 gap-3">
				<button
					onclick={() => (reporCaixa = null)}
					class="touch-target rounded-(--radius-card) border border-ink/20 text-sm font-semibold text-ink/70"
				>
					Cancelar
				</button>
				<button
					onclick={confirmarReposicao}
					class="touch-target rounded-(--radius-card) bg-navy text-sm font-semibold text-white"
				>
					Confirmar
				</button>
			</div>
		</div>
	</div>
{/if}
