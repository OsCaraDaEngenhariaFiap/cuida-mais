<script lang="ts">
	import { addDays, format, isSameDay, parseISO } from 'date-fns';
	import { ptBR } from 'date-fns/locale';
	import type { CareEvent } from '$lib/domain/types';
	import { services } from '$lib/services';
	import { TIPOS_CUIDADO } from '$lib/ui/tipos-cuidado';

	let { patientId, nomeCuidador }: { patientId: string; nomeCuidador: string } = $props();

	let dia = $state(new Date());
	let eventos = $state<CareEvent[]>([]);
	let carregando = $state(true);
	let editando = $state<CareEvent | null>(null);
	let pulando = $state<CareEvent | null>(null);
	let motivo = $state('');
	let novaObservacao = $state('');

	async function carregar(alvo: Date) {
		carregando = true;
		eventos = await services.events.listarPorDia(patientId, alvo);
		carregando = false;
	}

	$effect(() => {
		void carregar(dia);
	});

	const hora = (iso: string) => format(parseISO(iso), 'HH:mm');
	const hoje = $derived(isSameDay(dia, new Date()));

	function abrirEdicao(evento: CareEvent) {
		editando = evento;
		novaObservacao = evento.observacao ?? '';
		motivo = '';
	}

	async function salvarEdicao() {
		if (!editando || motivo.trim() === '') return;
		await services.events.editar(
			editando.id,
			{ observacao: novaObservacao.trim() || undefined },
			motivo.trim()
		);
		editando = null;
		await carregar(dia);
	}

	async function confirmarPulo() {
		if (!pulando || motivo.trim() === '') return;
		await services.events.marcarPulado(pulando.id, motivo.trim());
		pulando = null;
		await carregar(dia);
	}
</script>

<div>
	<div class="mb-4 flex items-center justify-between gap-2">
		<button
			onclick={() => (dia = addDays(dia, -1))}
			aria-label="Dia anterior"
			class="touch-target rounded-(--radius-card) border border-ink/15 px-4 font-bold text-navy"
		>
			‹
		</button>
		<div class="text-center">
			<p class="text-sm font-semibold first-letter:uppercase">
				{format(dia, "EEEE, d 'de' MMMM", { locale: ptBR })}
			</p>
			{#if !hoje}
				<button onclick={() => (dia = new Date())} class="text-xs font-medium text-cuidado underline">
					voltar para hoje
				</button>
			{/if}
		</div>
		<button
			onclick={() => (dia = addDays(dia, 1))}
			aria-label="Próximo dia"
			class="touch-target rounded-(--radius-card) border border-ink/15 px-4 font-bold text-navy"
		>
			›
		</button>
	</div>

	{#if carregando}
		<p class="p-6 text-center text-sm text-ink/50">Carregando…</p>
	{:else if eventos.length === 0}
		<div class="flex flex-col items-center gap-3 rounded-(--radius-card-lg) border border-dashed border-ink/20 p-8 text-center">
			<p class="text-ink/60">Nenhum registro {hoje ? 'hoje ainda' : 'neste dia'}.</p>
			{#if hoje}
				<a
					href="/pacientes/{patientId}/registrar"
					class="touch-target flex items-center rounded-(--radius-card) bg-navy px-5 text-sm font-semibold text-white"
				>
					Fazer o primeiro registro
				</a>
			{/if}
		</div>
	{:else}
		<ol class="relative flex flex-col gap-4 pl-2">
			{#each eventos as evento (evento.id)}
				<li class="flex gap-3">
					<div class="flex w-11 shrink-0 flex-col items-end pt-2">
						<span class="font-mono text-sm font-bold text-navy">{hora(evento.ocorridoEm)}</span>
					</div>
					<div class="relative flex flex-col items-center">
						<span
							class="z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-base text-white {TIPOS_CUIDADO[evento.tipo].cor}"
							aria-hidden="true"
						>
							{TIPOS_CUIDADO[evento.tipo].icone}
						</span>
						<span class="absolute top-9 bottom-[-1rem] w-px bg-ink/15" aria-hidden="true"></span>
					</div>
					<div
						class="min-w-0 flex-1 rounded-(--radius-card-lg) border border-ink/10 p-3 {evento.status === 'pulado' ? 'opacity-60' : ''}"
					>
						<div class="flex flex-wrap items-center gap-2">
							<p class="font-semibold {evento.status === 'pulado' ? 'line-through' : ''}">
								{evento.titulo}
							</p>
							{#if evento.status === 'atrasado'}
								<span class="rounded-full bg-atencao/15 px-2 py-0.5 text-xs font-bold text-atencao">
									atrasado
								</span>
							{/if}
							{#if evento.status === 'pulado'}
								<span class="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-bold text-ink/60">
									pulado
								</span>
							{/if}
							{#if evento.editadoEm}
								<span class="text-xs text-ink/40" title={evento.motivoEdicao}>editado</span>
							{/if}
						</div>
						{#if evento.observacao}
							<p class="mt-1 text-sm text-ink/70">{evento.observacao}</p>
						{/if}
						{#if evento.motivoPulo}
							<p class="mt-1 text-sm text-ink/50">Motivo: {evento.motivoPulo}</p>
						{/if}
						{#if evento.justificativaSemFoto}
							<p class="mt-1 text-xs text-ink/50">Sem foto: {evento.justificativaSemFoto}</p>
						{/if}
						{#if evento.fotoUrl}
							<img
								src={evento.fotoUrl}
								alt="Foto do registro"
								class="mt-2 h-20 w-20 rounded-(--radius-card) object-cover"
							/>
						{/if}
						<div class="mt-1 flex items-center justify-between">
							<p class="text-xs text-ink/40">por {nomeCuidador}</p>
							{#if evento.status !== 'pulado'}
								<div class="flex gap-1">
									<button
										onclick={() => abrirEdicao(evento)}
										class="px-2 py-1 text-xs font-medium text-cuidado"
									>
										Corrigir
									</button>
									<button
										onclick={() => {
											pulando = evento;
											motivo = '';
										}}
										class="px-2 py-1 text-xs font-medium text-ink/50"
									>
										Marcar pulado
									</button>
								</div>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</div>

{#if editando || pulando}
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4" role="dialog" aria-modal="true">
		<div class="w-full max-w-md rounded-(--radius-card-lg) bg-white p-4 shadow-xl">
			{#if editando}
				<h3 class="mb-3 text-lg font-bold text-navy">Corrigir registro</h3>
				<label class="mb-3 flex flex-col gap-1">
					<span class="text-sm font-medium text-ink/80">Observação</span>
					<textarea
						rows="2"
						bind:value={novaObservacao}
						class="rounded-(--radius-card) border border-ink/20 p-3 text-base outline-navy"
					></textarea>
				</label>
			{:else}
				<h3 class="mb-3 text-lg font-bold text-navy">Marcar como pulado</h3>
				<p class="mb-3 text-sm text-ink/60">
					O registro não é apagado — fica na linha do tempo como pulado.
				</p>
			{/if}
			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-ink/80">Motivo *</span>
				<textarea
					rows="2"
					bind:value={motivo}
					class="rounded-(--radius-card) border border-ink/20 p-3 text-base outline-navy"
				></textarea>
			</label>
			<div class="mt-4 grid grid-cols-2 gap-3">
				<button
					onclick={() => {
						editando = null;
						pulando = null;
					}}
					class="touch-target rounded-(--radius-card) border border-ink/20 text-sm font-semibold text-ink/70"
				>
					Cancelar
				</button>
				<button
					onclick={() => (editando ? salvarEdicao() : confirmarPulo())}
					disabled={motivo.trim() === ''}
					class="touch-target rounded-(--radius-card) bg-navy text-sm font-semibold text-white disabled:opacity-50"
				>
					Confirmar
				</button>
			</div>
		</div>
	</div>
{/if}
