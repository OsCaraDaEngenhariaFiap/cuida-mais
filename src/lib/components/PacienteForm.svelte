<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Patient } from '$lib/domain/types';
	import { services } from '$lib/services';
	import { comprimirImagem } from '$lib/utils/imagem';

	let { caregiverId, inicial }: { caregiverId: string; inicial?: Patient } = $props();

	// O formulário captura o valor inicial de propósito: edições ficam locais até salvar.
	// svelte-ignore state_referenced_locally
	let form = $state({
		nome: inicial?.nome ?? '',
		dataNascimento: inicial?.dataNascimento.slice(0, 10) ?? '',
		fotoUrl: inicial?.fotoUrl,
		localizacao: inicial?.localizacao ?? '',
		respNome: inicial?.responsavel?.nome ?? '',
		respParentesco: inicial?.responsavel?.parentesco ?? '',
		respTelefone: inicial?.responsavel?.telefone ?? '',
		alergias: inicial?.alergias?.join(', ') ?? '',
		condicoes: inicial?.condicoes?.join(', ') ?? '',
		observacoes: inicial?.observacoes ?? ''
	});
	let erro = $state('');
	let ocupado = $state(false);

	const emLista = (texto: string) =>
		texto
			.split(',')
			.map((parte) => parte.trim())
			.filter(Boolean);

	async function escolherFoto(e: Event) {
		const arquivo = (e.currentTarget as HTMLInputElement).files?.[0];
		if (arquivo) form.fotoUrl = await comprimirImagem(arquivo);
	}

	async function salvar(e: SubmitEvent) {
		e.preventDefault();
		ocupado = true;
		erro = '';
		try {
			const dados = {
				caregiverId,
				nome: form.nome.trim(),
				dataNascimento: form.dataNascimento,
				fotoUrl: form.fotoUrl,
				localizacao: form.localizacao.trim() || undefined,
				responsavel: form.respNome.trim()
					? {
							nome: form.respNome.trim(),
							parentesco: form.respParentesco.trim() || undefined,
							telefone: form.respTelefone.trim() || undefined
						}
					: undefined,
				alergias: emLista(form.alergias).length > 0 ? emLista(form.alergias) : undefined,
				condicoes: emLista(form.condicoes).length > 0 ? emLista(form.condicoes) : undefined,
				observacoes: form.observacoes.trim() || undefined
			};
			const salvo = inicial
				? await services.patients.atualizar(inicial.id, dados)
				: await services.patients.criar(dados);
			await goto(`/pacientes/${salvo.id}`, { invalidateAll: true });
		} catch (falha) {
			erro = falha instanceof Error ? falha.message : 'Não foi possível salvar';
			ocupado = false;
		}
	}
</script>

<form onsubmit={salvar} class="flex flex-col gap-4">
	<div class="flex items-center gap-4">
		{#if form.fotoUrl}
			<img src={form.fotoUrl} alt="Foto do paciente" class="size-16 rounded-full object-cover" />
		{:else}
			<div class="flex size-16 items-center justify-center rounded-full bg-navy-50 text-2xl">🙂</div>
		{/if}
		<label class="text-sm">
			<span class="mb-1 block font-medium text-ink/80">Foto</span>
			<input type="file" accept="image/*" onchange={escolherFoto} />
		</label>
	</div>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-ink/80">Nome *</span>
		<input
			type="text"
			required
			bind:value={form.nome}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
		/>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-ink/80">Data de nascimento *</span>
		<input
			type="date"
			required
			bind:value={form.dataNascimento}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
		/>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-ink/80">Localização</span>
		<input
			type="text"
			placeholder="ex.: Quarto 102"
			bind:value={form.localizacao}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
		/>
	</label>

	<fieldset class="rounded-(--radius-card-lg) border border-ink/10 p-3">
		<legend class="px-1 text-sm font-semibold text-marca">Responsável / família</legend>
		<div class="flex flex-col gap-3">
			<input
				type="text"
				placeholder="Nome"
				bind:value={form.respNome}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
			/>
			<div class="grid grid-cols-2 gap-3">
				<input
					type="text"
					placeholder="Parentesco"
					bind:value={form.respParentesco}
					class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
				/>
				<input
					type="tel"
					placeholder="Telefone"
					bind:value={form.respTelefone}
					class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
				/>
			</div>
		</div>
	</fieldset>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-ink/80">
			Alergias <small class="text-ink/50">(separe por vírgula)</small>
		</span>
		<input
			type="text"
			placeholder="ex.: Penicilina, Dipirona"
			bind:value={form.alergias}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
		/>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-ink/80">
			Condições <small class="text-ink/50">(separe por vírgula)</small>
		</span>
		<input
			type="text"
			placeholder="ex.: Alzheimer, Diabetes tipo 2"
			bind:value={form.condicoes}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
		/>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-ink/80">Observações</span>
		<textarea
			rows="3"
			bind:value={form.observacoes}
			class="rounded-(--radius-card) border border-ink/20 p-4 text-base outline-marca"
		></textarea>
	</label>

	{#if erro}
		<p role="alert" class="rounded-(--radius-card) bg-critico/10 px-4 py-3 text-sm font-medium text-critico">
			{erro}
		</p>
	{/if}

	<button
		type="submit"
		disabled={ocupado}
		class="touch-target rounded-(--radius-card) bg-navy text-base font-semibold text-white disabled:opacity-60"
	>
		{ocupado ? 'Salvando…' : inicial ? 'Salvar alterações' : 'Cadastrar paciente'}
	</button>
</form>
