<script lang="ts">
	import { gerarSlug } from '$lib/domain/measurements/form';
	import type { FormatoCampo, MeasurementField, MeasurementType, SeveridadeAlerta } from '$lib/domain/types';
	import { services } from '$lib/services';

	let {
		inicial,
		aoFechar
	}: { inicial?: MeasurementType; aoFechar: (salvou: boolean) => void } = $props();

	interface LinhaCampo {
		chave: string;
		rotulo: string;
		formato: FormatoCampo;
		unidade: string;
		casasDecimais: string;
		escalaMin: string;
		escalaMax: string;
		opcoes: string;
		faixaMin: string;
		faixaMax: string;
		faixaSeveridade: SeveridadeAlerta;
		valorEsperado: string; // '' | 'sim' | 'nao' | opção
		pisoDesvio: string;
	}

	const paraLinha = (c?: MeasurementField): LinhaCampo => ({
		chave: c?.chave ?? '',
		rotulo: c?.rotulo ?? '',
		formato: c?.formato ?? 'numero',
		unidade: c?.unidade ?? '',
		casasDecimais: c?.casasDecimais?.toString() ?? '0',
		escalaMin: c?.escala?.min.toString() ?? '0',
		escalaMax: c?.escala?.max.toString() ?? '10',
		opcoes: c?.opcoes?.join(', ') ?? '',
		faixaMin: c?.faixaNormal?.min?.toString() ?? '',
		faixaMax: c?.faixaNormal?.max?.toString() ?? '',
		faixaSeveridade: c?.faixaNormal?.severidade ?? 'atencao',
		valorEsperado:
			c?.valorEsperado === true ? 'sim' : c?.valorEsperado === false ? 'nao' : (c?.valorEsperado ?? ''),
		pisoDesvio: c?.pisoDesvio?.toString() ?? ''
	});

	// Formulário captura o valor inicial de propósito (edição local até salvar).
	// svelte-ignore state_referenced_locally
	let form = $state({
		nome: inicial?.nome ?? '',
		icone: inicial?.icone ?? '📏',
		alertaSemRegistroHoras: inicial?.alertaSemRegistroHoras?.toString() ?? '',
		campos: inicial?.campos.map((c) => paraLinha(c)) ?? [paraLinha()]
	});
	let erro = $state('');
	let ocupado = $state(false);

	const numeroOuUndefined = (s: string) => {
		const n = Number(s.replace(',', '.'));
		return s.trim() !== '' && Number.isFinite(n) ? n : undefined;
	};

	function montarCampo(linha: LinhaCampo): MeasurementField {
		const base: MeasurementField = {
			chave: linha.chave.trim() || gerarSlug(linha.rotulo),
			rotulo: linha.rotulo.trim(),
			formato: linha.formato
		};
		if (linha.formato === 'numero') {
			base.unidade = linha.unidade.trim() || undefined;
			base.casasDecimais = numeroOuUndefined(linha.casasDecimais) ?? 0;
		}
		if (linha.formato === 'escala') {
			base.escala = {
				min: numeroOuUndefined(linha.escalaMin) ?? 0,
				max: numeroOuUndefined(linha.escalaMax) ?? 10
			};
		}
		if (linha.formato === 'opcoes') {
			base.opcoes = linha.opcoes
				.split(',')
				.map((o) => o.trim())
				.filter(Boolean);
		}
		if (linha.formato === 'numero' || linha.formato === 'escala') {
			const min = numeroOuUndefined(linha.faixaMin);
			const max = numeroOuUndefined(linha.faixaMax);
			if (min !== undefined || max !== undefined) {
				base.faixaNormal = { min, max, severidade: linha.faixaSeveridade };
			}
			base.pisoDesvio = numeroOuUndefined(linha.pisoDesvio);
		}
		if (linha.formato === 'booleano' && linha.valorEsperado !== '') {
			base.valorEsperado = linha.valorEsperado === 'sim';
		}
		if (linha.formato === 'opcoes' && linha.valorEsperado !== '') {
			base.valorEsperado = linha.valorEsperado;
		}
		return base;
	}

	async function salvar(e: SubmitEvent) {
		e.preventDefault();
		erro = '';
		const campos = form.campos.filter((c) => c.rotulo.trim() !== '').map((linha) => montarCampo(linha));
		if (campos.length === 0) {
			erro = 'Inclua pelo menos um campo';
			return;
		}
		ocupado = true;
		try {
			const dados = {
				slug: inicial?.slug ?? gerarSlug(form.nome),
				nome: form.nome.trim(),
				icone: form.icone.trim() || '📏',
				alertaSemRegistroHoras: numeroOuUndefined(form.alertaSemRegistroHoras),
				campos
			};
			if (inicial) await services.measurements.atualizarTipo(inicial.id, dados);
			else await services.measurements.criarTipo(dados);
			aoFechar(true);
		} catch (falha) {
			erro = falha instanceof Error ? falha.message : 'Não foi possível salvar';
			ocupado = false;
		}
	}
</script>

<form onsubmit={salvar} class="flex flex-col gap-4">
	<div class="grid grid-cols-[4rem_1fr] gap-3">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">Ícone</span>
			<input
				type="text"
				bind:value={form.icone}
				maxlength="4"
				class="touch-target rounded-(--radius-card) border border-ink/20 text-center text-xl outline-navy"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">Nome *</span>
			<input
				type="text"
				required
				placeholder="ex.: Diurese (mL)"
				bind:value={form.nome}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
			/>
		</label>
	</div>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-ink/80">
			Alertar se ficar sem registro por (horas)
			<small class="text-ink/50">— opcional, ex.: 72</small>
		</span>
		<input
			type="number"
			min="1"
			bind:value={form.alertaSemRegistroHoras}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
		/>
	</label>

	<section class="flex flex-col gap-3">
		<h3 class="text-sm font-semibold text-navy">Campos</h3>
		{#each form.campos as linha, i (i)}
			<fieldset class="flex flex-col gap-2 rounded-(--radius-card-lg) border border-ink/10 p-3">
				<div class="flex items-center justify-between">
					<legend class="text-xs font-semibold uppercase tracking-wide text-ink/50">
						Campo {i + 1}
					</legend>
					{#if form.campos.length > 1}
						<button
							type="button"
							onclick={() => form.campos.splice(i, 1)}
							class="text-sm font-medium text-critico"
						>
							remover
						</button>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-2">
					<input
						type="text"
						placeholder="Rótulo *"
						required
						bind:value={linha.rotulo}
						class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
					/>
					<select
						bind:value={linha.formato}
						class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
					>
						<option value="numero">Número</option>
						<option value="escala">Escala</option>
						<option value="booleano">Sim / não</option>
						<option value="opcoes">Opções</option>
						<option value="texto">Texto</option>
					</select>
				</div>

				{#if linha.formato === 'numero'}
					<div class="grid grid-cols-2 gap-2">
						<input
							type="text"
							placeholder="Unidade (bpm, mL…)"
							bind:value={linha.unidade}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
						/>
						<input
							type="number"
							min="0"
							max="3"
							placeholder="Casas decimais"
							bind:value={linha.casasDecimais}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
						/>
					</div>
				{:else if linha.formato === 'escala'}
					<div class="grid grid-cols-2 gap-2">
						<input
							type="number"
							placeholder="Mínimo"
							bind:value={linha.escalaMin}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
						/>
						<input
							type="number"
							placeholder="Máximo"
							bind:value={linha.escalaMax}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
						/>
					</div>
				{:else if linha.formato === 'opcoes'}
					<input
						type="text"
						placeholder="Opções separadas por vírgula"
						bind:value={linha.opcoes}
						class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
					/>
					<label class="flex flex-col gap-1 text-sm">
						<span class="text-ink/60">Valor esperado (alerta se diferente)</span>
						<input
							type="text"
							placeholder="deixe vazio para não alertar"
							bind:value={linha.valorEsperado}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
						/>
					</label>
				{:else if linha.formato === 'booleano'}
					<label class="flex flex-col gap-1 text-sm">
						<span class="text-ink/60">Valor esperado (alerta se diferente)</span>
						<select
							bind:value={linha.valorEsperado}
							class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
						>
							<option value="">Sem valor esperado</option>
							<option value="sim">Sim</option>
							<option value="nao">Não</option>
						</select>
					</label>
				{/if}

				{#if linha.formato === 'numero' || linha.formato === 'escala'}
					<details class="text-sm">
						<summary class="cursor-pointer py-2 font-medium text-navy">Faixa normal e desvio (alertas)</summary>
						<div class="mt-2 grid grid-cols-2 gap-2">
							<input
								type="number"
								step="any"
								placeholder="Faixa: mín."
								bind:value={linha.faixaMin}
								class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
							/>
							<input
								type="number"
								step="any"
								placeholder="Faixa: máx."
								bind:value={linha.faixaMax}
								class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
							/>
							<select
								bind:value={linha.faixaSeveridade}
								class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
							>
								<option value="atencao">Fora da faixa → atenção</option>
								<option value="critico">Fora da faixa → crítico</option>
							</select>
							<input
								type="number"
								step="any"
								placeholder="Piso de desvio (opcional)"
								bind:value={linha.pisoDesvio}
								class="touch-target rounded-(--radius-card) border border-ink/20 px-3 text-base outline-navy"
							/>
						</div>
					</details>
				{/if}
			</fieldset>
		{/each}
		<button
			type="button"
			onclick={() => form.campos.push(paraLinha())}
			class="touch-target rounded-(--radius-card) border border-dashed border-navy/40 text-sm font-medium text-navy"
		>
			+ Adicionar campo
		</button>
	</section>

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
			{ocupado ? 'Salvando…' : 'Salvar aferição'}
		</button>
	</div>
</form>
