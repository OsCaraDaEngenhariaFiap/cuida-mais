<script lang="ts">
	import { formatISO, parseISO } from 'date-fns';
	import type { CareTask, MeasurementType, TipoCuidado } from '$lib/domain/types';
	import { services } from '$lib/services';
	import { DIAS_SEMANA, TIPOS_CUIDADO, VIAS_MEDICACAO } from '$lib/ui/tipos-cuidado';

	let {
		patientId,
		tipos,
		inicial,
		aoFechar
	}: {
		patientId: string;
		tipos: MeasurementType[];
		inicial?: CareTask;
		aoFechar: (salvou: boolean) => void;
	} = $props();

	// Formulário captura o valor inicial de propósito (edição local até salvar).
	// svelte-ignore state_referenced_locally
	let form = $state({
		tipo: (inicial?.tipo ?? 'medicacao') as TipoCuidado,
		titulo: inicial?.titulo ?? '',
		descricao: inicial?.descricao ?? '',
		horarios: inicial?.horarios.slice() ?? ['08:00'],
		diasSemana: inicial?.diasSemana.slice() ?? [0, 1, 2, 3, 4, 5, 6],
		toleranciaMin: inicial?.toleranciaMin ?? 30,
		lembreteAntesMin: inicial?.lembreteAntesMin ?? 15,
		measurementTypeIds: inicial?.measurementTypeIds?.slice() ?? [],
		dose: inicial?.medicacao?.dose ?? '',
		via: inicial?.medicacao?.via ?? 'oral',
		inicioTratamento: inicial?.medicacao
			? formatISO(parseISO(inicial.medicacao.inicioTratamento), { representation: 'date' })
			: formatISO(new Date(), { representation: 'date' }),
		fimTratamento: inicial?.medicacao?.fimTratamento
			? formatISO(parseISO(inicial.medicacao.fimTratamento), { representation: 'date' })
			: '',
		comEstoque: Boolean(inicial?.medicacao?.estoque),
		quantidadeAtual: inicial?.medicacao?.estoque?.quantidadeAtual ?? 30,
		unidade: inicial?.medicacao?.estoque?.unidade ?? 'comprimidos',
		consumoPorDose: inicial?.medicacao?.estoque?.consumoPorDose ?? 1,
		alertarAbaixoDe: inicial?.medicacao?.estoque?.alertarAbaixoDe ?? 6
	});
	let erro = $state('');
	let ocupado = $state(false);

	function alternarDia(dia: number) {
		form.diasSemana = form.diasSemana.includes(dia)
			? form.diasSemana.filter((d) => d !== dia)
			: [...form.diasSemana, dia].sort();
	}

	function alternarTipoAfericao(id: string) {
		form.measurementTypeIds = form.measurementTypeIds.includes(id)
			? form.measurementTypeIds.filter((t) => t !== id)
			: [...form.measurementTypeIds, id];
	}

	async function salvar(e: SubmitEvent) {
		e.preventDefault();
		erro = '';
		// $state entrega Proxies; IndexedDB só aceita dados clonáveis — snapshot primeiro
		const plano = $state.snapshot(form);
		const horarios = plano.horarios.filter((h) => /^\d{2}:\d{2}$/.test(h));
		if (horarios.length === 0) {
			erro = 'Inclua pelo menos um horário';
			return;
		}
		if (form.diasSemana.length === 0) {
			erro = 'Escolha pelo menos um dia da semana';
			return;
		}
		if (form.tipo === 'medicao' && form.measurementTypeIds.length === 0) {
			erro = 'Escolha o que aferir';
			return;
		}
		if (form.tipo === 'medicacao' && form.dose.trim() === '') {
			erro = 'Informe a dose da medicação';
			return;
		}
		ocupado = true;
		try {
			const dados = {
				patientId,
				tipo: plano.tipo,
				titulo: plano.titulo.trim(),
				descricao: plano.descricao.trim() || undefined,
				horarios: [...horarios].sort(),
				diasSemana: plano.diasSemana,
				toleranciaMin: Number(plano.toleranciaMin) || 30,
				lembreteAntesMin: Number(plano.lembreteAntesMin) || 15,
				measurementTypeIds: plano.tipo === 'medicao' ? plano.measurementTypeIds : undefined,
				medicacao:
					plano.tipo === 'medicacao'
						? {
								dose: plano.dose.trim(),
								via: plano.via,
								inicioTratamento: formatISO(parseISO(plano.inicioTratamento)),
								fimTratamento: plano.fimTratamento
									? formatISO(parseISO(plano.fimTratamento))
									: undefined,
								estoque: plano.comEstoque
									? {
											quantidadeAtual: Number(plano.quantidadeAtual),
											unidade: plano.unidade.trim() || 'unidades',
											consumoPorDose: Number(plano.consumoPorDose) || 1,
											alertarAbaixoDe: Number(plano.alertarAbaixoDe) || 0
										}
									: undefined
							}
						: undefined
			};
			if (inicial) await services.tasks.atualizar(inicial.id, dados);
			else await services.tasks.criar(dados);
			aoFechar(true);
		} catch (falha) {
			erro = falha instanceof Error ? falha.message : 'Não foi possível salvar';
			ocupado = false;
		}
	}
</script>

<form onsubmit={salvar} class="flex flex-col gap-4">
	<div class="grid grid-cols-3 gap-2">
		{#each Object.entries(TIPOS_CUIDADO) as [valor, meta] (valor)}
			<button
				type="button"
				onclick={() => (form.tipo = valor as TipoCuidado)}
				class="touch-target flex flex-col items-center justify-center gap-0.5 rounded-(--radius-card) border text-xs font-medium
					{form.tipo === valor ? 'border-navy bg-navy text-white' : 'border-ink/15 text-ink/70'}"
			>
				<span class="text-lg">{meta.icone}</span>
				{meta.rotulo}
			</button>
		{/each}
	</div>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-ink/80">Título *</span>
		<input
			type="text"
			required
			placeholder={form.tipo === 'medicacao' ? 'ex.: Losartana 50mg' : 'ex.: Café da manhã'}
			bind:value={form.titulo}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
		/>
	</label>

	<fieldset>
		<legend class="mb-1 text-sm font-medium text-ink/80">Horários *</legend>
		<div class="flex flex-col gap-2">
			{#each form.horarios as _, i (i)}
				<div class="flex items-center gap-2">
					<input
						type="time"
						required
						bind:value={form.horarios[i]}
						class="touch-target flex-1 rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
					/>
					{#if form.horarios.length > 1}
						<button
							type="button"
							aria-label="Remover horário"
							onclick={() => form.horarios.splice(i, 1)}
							class="touch-target px-3 text-critico"
						>
							✕
						</button>
					{/if}
				</div>
			{/each}
			<button
				type="button"
				onclick={() => form.horarios.push('12:00')}
				class="touch-target rounded-(--radius-card) border border-dashed border-navy/40 text-sm font-medium text-navy"
			>
				+ horário
			</button>
		</div>
	</fieldset>

	<fieldset>
		<legend class="mb-1 text-sm font-medium text-ink/80">Dias da semana</legend>
		<div class="grid grid-cols-7 gap-1">
			{#each DIAS_SEMANA as rotulo, dia (dia)}
				<button
					type="button"
					onclick={() => alternarDia(dia)}
					aria-pressed={form.diasSemana.includes(dia)}
					class="touch-target rounded-(--radius-card) border text-xs font-semibold
						{form.diasSemana.includes(dia) ? 'border-navy bg-navy text-white' : 'border-ink/15 text-ink/50'}"
				>
					{rotulo}
				</button>
			{/each}
		</div>
	</fieldset>

	<div class="grid grid-cols-2 gap-3">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">Tolerância (min)</span>
			<input
				type="number"
				min="0"
				bind:value={form.toleranciaMin}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">Lembrar antes (min)</span>
			<input
				type="number"
				min="0"
				bind:value={form.lembreteAntesMin}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
			/>
		</label>
	</div>

	{#if form.tipo === 'medicao'}
		<fieldset class="rounded-(--radius-card-lg) border border-ink/10 p-3">
			<legend class="px-1 text-sm font-semibold text-navy">O que aferir *</legend>
			<div class="flex flex-wrap gap-2">
				{#each tipos as tipo (tipo.id)}
					<button
						type="button"
						onclick={() => alternarTipoAfericao(tipo.id)}
						aria-pressed={form.measurementTypeIds.includes(tipo.id)}
						class="touch-target rounded-full border px-3 text-sm
							{form.measurementTypeIds.includes(tipo.id) ? 'border-navy bg-navy text-white' : 'border-ink/20 text-ink/70'}"
					>
						{tipo.icone} {tipo.nome}
					</button>
				{/each}
			</div>
		</fieldset>
	{/if}

	{#if form.tipo === 'medicacao'}
		<fieldset class="flex flex-col gap-3 rounded-(--radius-card-lg) border border-ink/10 p-3">
			<legend class="px-1 text-sm font-semibold text-navy">Medicação</legend>
			<div class="grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-ink/80">Dose *</span>
					<input
						type="text"
						placeholder="50 mg, 10 gotas…"
						bind:value={form.dose}
						class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-ink/80">Via</span>
					<select
						bind:value={form.via}
						class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
					>
						{#each VIAS_MEDICACAO as via (via)}
							<option value={via}>{via}</option>
						{/each}
					</select>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-ink/80">Início do tratamento</span>
					<input
						type="date"
						required
						bind:value={form.inicioTratamento}
						class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-ink/80">Fim (vazio = contínuo)</span>
					<input
						type="date"
						bind:value={form.fimTratamento}
						class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
					/>
				</label>
			</div>

			<label class="flex items-center gap-2 text-sm font-medium text-ink/80">
				<input type="checkbox" bind:checked={form.comEstoque} class="size-5 accent-navy" />
				Controlar estoque da caixa
			</label>
			{#if form.comEstoque}
				<div class="grid grid-cols-2 gap-3">
					<label class="flex flex-col gap-1">
						<span class="text-sm text-ink/70">Quantidade atual</span>
						<input
							type="number"
							min="0"
							step="any"
							bind:value={form.quantidadeAtual}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-sm text-ink/70">Unidade</span>
						<input
							type="text"
							bind:value={form.unidade}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-sm text-ink/70">Consumo por dose</span>
						<input
							type="number"
							min="0"
							step="any"
							bind:value={form.consumoPorDose}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="text-sm text-ink/70">Alertar abaixo de</span>
						<input
							type="number"
							min="0"
							step="any"
							bind:value={form.alertarAbaixoDe}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
						/>
					</label>
				</div>
			{/if}
		</fieldset>
	{/if}

	{#if erro}
		<p role="alert" class="rounded-(--radius-card) bg-critico/10 px-4 py-3 text-sm font-medium text-critico">
			{erro}
		</p>
	{/if}

	<div class="grid grid-cols-2 gap-3">
		<button
			type="button"
			onclick={() => aoFechar(false)}
			class="touch-target rounded-(--radius-card) border border-ink/20 text-sm font-semibold text-ink/70"
		>
			Cancelar
		</button>
		<button
			type="submit"
			disabled={ocupado}
			class="touch-target rounded-(--radius-card) bg-navy text-sm font-semibold text-white disabled:opacity-60"
		>
			{ocupado ? 'Salvando…' : 'Salvar rotina'}
		</button>
	</div>
</form>
