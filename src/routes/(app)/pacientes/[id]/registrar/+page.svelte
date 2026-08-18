<script lang="ts">
	import { differenceInMinutes, format, formatISO, parseISO } from 'date-fns';
	import { goto } from '$app/navigation';
	import CampoAfericao from '$lib/components/CampoAfericao.svelte';
	import { prepararLeituras, type EntradaCampo } from '$lib/domain/measurements/form';
	import { statusDoRegistro } from '$lib/domain/schedule/ocorrencias';
	import type { MeasurementType, TipoCuidado } from '$lib/domain/types';
	import { services, type NovaReading } from '$lib/services';
	import { reavaliarAlertas } from '$lib/services/alertas-engine';
	import { atualizarContagemAlertas } from '$lib/stores/alertas.svelte';
	import { preferencias } from '$lib/stores/preferencias.svelte';
	import { TIPOS_CUIDADO } from '$lib/ui/tipos-cuidado';
	import { comprimirImagem } from '$lib/utils/imagem';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const SUGESTOES_SEM_FOTO = ['mãos ocupadas', 'paciente recusou câmera', 'sem bateria'];

	// tarefa via ?tarefa= entra direto no fluxo do tipo dela (§5.1)
	// svelte-ignore state_referenced_locally
	let tipoCuidado = $state<TipoCuidado | null>(data.tarefa?.tipo ?? null);
	let tipoAfericao = $state<MeasurementType | null>(null);
	let valores = $state<Record<string, EntradaCampo>>({});
	// svelte-ignore state_referenced_locally
	let titulo = $state(data.tarefa && data.tarefa.tipo !== 'medicao' ? data.tarefa.titulo : '');
	let observacao = $state('');
	let ocorridoEm = $state(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
	let foto = $state<string | undefined>(undefined);
	let semFoto = $state(false);
	let justificativaSemFoto = $state('');
	let justificativaRetroativa = $state('');
	let erros = $state<string[]>([]);
	let ocupado = $state(false);

	const retroativo = $derived(differenceInMinutes(new Date(), parseISO(ocorridoEm)) > 30);
	const tiposDisponiveis = $derived(
		data.tarefa?.measurementTypeIds?.length
			? data.tipos.filter((t) => data.tarefa!.measurementTypeIds!.includes(t.id))
			: data.tipos
	);

	function escolherTipoCuidado(tipo: TipoCuidado) {
		tipoCuidado = tipo;
		erros = [];
	}

	async function escolherFoto(e: Event) {
		const arquivo = (e.currentTarget as HTMLInputElement).files?.[0];
		if (arquivo) {
			foto = await comprimirImagem(arquivo);
			semFoto = false;
		}
	}

	async function salvar(e: SubmitEvent) {
		e.preventDefault();
		if (!tipoCuidado) return;
		erros = [];
		const agora = new Date();
		const ocorrido = parseISO(ocorridoEm);
		const ehRetroativo = differenceInMinutes(agora, ocorrido) > 30;

		let tituloFinal = titulo.trim();
		let leituras: NovaReading[] = [];

		if (tipoCuidado === 'medicao') {
			if (!tipoAfericao) return;
			tituloFinal = tipoAfericao.nome;
			const preparo = prepararLeituras(tipoAfericao, valores);
			if (!preparo.ok) {
				erros = preparo.erros;
				return;
			}
			leituras = preparo.valores.map((v) => ({
				...v,
				measurementTypeId: tipoAfericao!.id,
				aferidoEm: formatISO(ocorrido)
			}));
		}

		const semFotoNaMedicacao = tipoCuidado === 'medicacao' && !foto;
		if (
			semFotoNaMedicacao &&
			preferencias.fotoObrigatoriaMedicacao &&
			justificativaSemFoto.trim() === ''
		) {
			erros = [...erros, 'Medicação sem foto exige uma justificativa (§5.1)'];
		}
		if (ehRetroativo && justificativaRetroativa.trim() === '') {
			erros = [...erros, 'Registro com mais de 30 min de atraso exige justificativa'];
		}
		if (tituloFinal === '') {
			erros = [...erros, 'Dê um título ao registro'];
		}
		if (erros.length > 0) return;

		ocupado = true;
		await services.events.criar(
			{
				patientId: data.paciente.id,
				taskId: data.tarefa?.id,
				tipo: tipoCuidado,
				titulo: tituloFinal,
				observacao: observacao.trim() || undefined,
				ocorridoEm: formatISO(ocorrido),
				registradoPor: data.cuidador.id,
				status: data.tarefa ? statusDoRegistro(data.tarefa, ocorrido) : 'realizado',
				fotoUrl: foto,
				justificativaSemFoto:
					semFotoNaMedicacao && justificativaSemFoto.trim() !== ''
						? justificativaSemFoto.trim()
						: undefined,
				justificativaRetroativa: ehRetroativo ? justificativaRetroativa.trim() : undefined
			},
			leituras
		);
		await reavaliarAlertas();
		await atualizarContagemAlertas();
		await goto(`/pacientes/${data.paciente.id}`, { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>Registrar · {data.paciente.nome} · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<h1 class="text-2xl font-bold text-marca">Registro rápido</h1>
	<p class="mb-4 text-sm text-ink/60">{data.paciente.nome}</p>

	{#if !tipoCuidado}
		<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">O que aconteceu?</h2>
		<div class="grid grid-cols-3 gap-2">
			{#each Object.entries(TIPOS_CUIDADO) as [valor, meta] (valor)}
				<button
					onclick={() => escolherTipoCuidado(valor as TipoCuidado)}
					class="flex min-h-20 flex-col items-center justify-center gap-1 rounded-(--radius-card-lg) border border-ink/10 transition-colors hover:bg-navy-50"
				>
					<span class="text-2xl" aria-hidden="true">{meta.icone}</span>
					<span class="text-xs font-medium">{meta.rotulo}</span>
				</button>
			{/each}
		</div>
	{:else if tipoCuidado === 'medicao' && !tipoAfericao}
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wide text-ink/50">Qual aferição?</h2>
			{#if !data.tarefa}
				<button onclick={() => (tipoCuidado = null)} class="text-sm font-medium text-cuidado">
					voltar
				</button>
			{/if}
		</div>
		<div class="grid grid-cols-2 gap-3">
			{#each tiposDisponiveis as tipo (tipo.id)}
				<button
					onclick={() => {
						tipoAfericao = tipo;
						valores = {};
						erros = [];
					}}
					class="flex min-h-20 flex-col items-center justify-center gap-1 rounded-(--radius-card-lg) border border-ink/10 p-3 transition-colors hover:bg-navy-50"
				>
					<span class="text-2xl" aria-hidden="true">{tipo.icone}</span>
					<span class="text-center text-sm font-medium">{tipo.nome}</span>
				</button>
			{/each}
		</div>
	{:else}
		<form onsubmit={salvar} class="flex flex-col gap-4">
			<header class="flex items-center gap-3">
				<span
					class="flex size-10 items-center justify-center rounded-full text-lg text-white {TIPOS_CUIDADO[tipoCuidado].cor}"
					aria-hidden="true"
				>
					{tipoAfericao?.icone ?? TIPOS_CUIDADO[tipoCuidado].icone}
				</span>
				<h2 class="text-lg font-bold">
					{tipoAfericao?.nome ?? data.tarefa?.titulo ?? TIPOS_CUIDADO[tipoCuidado].rotulo}
				</h2>
				{#if !data.tarefa}
					<button
						type="button"
						onclick={() => {
							tipoCuidado = null;
							tipoAfericao = null;
							foto = undefined;
							erros = [];
						}}
						class="ml-auto text-sm font-medium text-cuidado"
					>
						trocar
					</button>
				{/if}
			</header>

			{#if tipoCuidado === 'medicacao' && data.tarefa?.medicacao}
				<div class="rounded-(--radius-card-lg) bg-navy-50 p-4">
					<p class="font-semibold text-marca">{data.tarefa.titulo}</p>
					<p class="text-sm text-ink/70">
						{data.tarefa.medicacao.dose} · via {data.tarefa.medicacao.via}
					</p>
				</div>
			{/if}

			{#if tipoCuidado === 'medicao' && tipoAfericao}
				{#each tipoAfericao.campos as campo (campo.chave)}
					<CampoAfericao {campo} bind:valor={valores[campo.chave]} />
				{/each}
			{:else if !data.tarefa}
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-ink/80">Título *</span>
					<input
						type="text"
						bind:value={titulo}
						placeholder={tipoCuidado === 'medicacao' ? 'ex.: Dipirona 500mg' : 'ex.: Banho de aspersão'}
						class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
					/>
				</label>
			{/if}

			{#if tipoCuidado === 'medicacao'}
				<section class="flex flex-col gap-2 rounded-(--radius-card-lg) border border-ink/10 p-3">
					<h3 class="text-sm font-semibold text-marca">
						Foto do momento {preferencias.fotoObrigatoriaMedicacao ? '(obrigatória)' : '(opcional)'}
					</h3>
					{#if foto}
						<img src={foto} alt="Foto do registro" class="h-32 w-32 rounded-(--radius-card) object-cover" />
						<button type="button" onclick={() => (foto = undefined)} class="self-start text-sm text-critico">
							remover foto
						</button>
					{:else}
						<label
							class="touch-target flex cursor-pointer items-center justify-center rounded-(--radius-card) bg-navy text-sm font-semibold text-white"
						>
							📷 Abrir câmera
							<input
								type="file"
								accept="image/*"
								capture="environment"
								onchange={escolherFoto}
								class="hidden"
							/>
						</label>
						{#if preferencias.fotoObrigatoriaMedicacao}
							{#if !semFoto}
								<button
									type="button"
									onclick={() => (semFoto = true)}
									class="self-center text-sm font-medium text-ink/50 underline"
								>
									Registrar sem foto
								</button>
							{:else}
								<label class="flex flex-col gap-1">
									<span class="text-sm font-medium text-atencao">Por que sem foto? *</span>
									<div class="flex flex-wrap gap-1">
										{#each SUGESTOES_SEM_FOTO as sugestao (sugestao)}
											<button
												type="button"
												onclick={() => (justificativaSemFoto = sugestao)}
												class="rounded-full border border-ink/20 px-3 py-1 text-xs
													{justificativaSemFoto === sugestao ? 'border-marca bg-navy text-white' : 'text-ink/60'}"
											>
												{sugestao}
											</button>
										{/each}
									</div>
									<input
										type="text"
										bind:value={justificativaSemFoto}
										placeholder="justificativa curta"
										class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
									/>
								</label>
							{/if}
						{/if}
					{/if}
				</section>
			{/if}

			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-ink/80">Quando aconteceu</span>
				<input
					type="datetime-local"
					bind:value={ocorridoEm}
					max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
					class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
				/>
			</label>

			{#if retroativo}
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-atencao">
						Registro atrasado (mais de 30 min) — justifique *
					</span>
					<input
						type="text"
						bind:value={justificativaRetroativa}
						class="touch-target rounded-(--radius-card) border border-atencao/40 px-4 text-base outline-atencao"
					/>
				</label>
			{/if}

			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium text-ink/80">Observação</span>
				<textarea
					rows="2"
					bind:value={observacao}
					class="rounded-(--radius-card) border border-ink/20 p-4 text-base outline-marca"
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
				{ocupado ? 'Salvando…' : 'Salvar registro'}
			</button>
		</form>
	{/if}
</div>
