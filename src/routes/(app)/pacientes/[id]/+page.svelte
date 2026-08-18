<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import AfericoesTab from '$lib/components/AfericoesTab.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import TarefaForm from '$lib/components/TarefaForm.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import { calcularIdade } from '$lib/domain/idade';
	import type { CareTask } from '$lib/domain/types';
	import { services } from '$lib/services';
	import { DIAS_SEMANA, TIPOS_CUIDADO } from '$lib/ui/tipos-cuidado';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Aba = 'timeline' | 'rotinas' | 'afericoes' | 'perfil';
	let aba = $state<Aba>('timeline');
	const abas: { id: Aba; rotulo: string }[] = [
		{ id: 'timeline', rotulo: 'Linha do Tempo' },
		{ id: 'rotinas', rotulo: 'Rotinas' },
		{ id: 'afericoes', rotulo: 'Aferições' },
		{ id: 'perfil', rotulo: 'Perfil' }
	];

	let editandoTarefa = $state<CareTask | 'nova' | null>(null);

	async function fecharTarefa(salvou: boolean) {
		editandoTarefa = null;
		if (salvou) await invalidateAll();
	}

	async function alternarTarefa(tarefa: CareTask) {
		await services.tasks.alternarAtivo(tarefa.id, !tarefa.ativo);
		await invalidateAll();
	}

	const resumoDias = (dias: number[]) =>
		dias.length === 7 ? 'Todos os dias' : dias.map((d) => DIAS_SEMANA[d]).join(' · ');
</script>

<svelte:head>
	<title>{data.paciente.nome} · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg">
	<header class="flex items-center gap-4 bg-navy p-4 text-white">
		<Avatar nome={data.paciente.nome} fotoUrl={data.paciente.fotoUrl} tamanho="lg" />
		<div class="min-w-0 flex-1">
			<h1 class="truncate text-xl font-bold">{data.paciente.nome}</h1>
			<p class="text-sm text-white/70">
				{calcularIdade(data.paciente.dataNascimento)} anos
				{#if data.paciente.localizacao}
					· {data.paciente.localizacao}
				{/if}
			</p>
		</div>
		<a
			href="/relatorio/{data.paciente.id}"
			aria-label="Relatório do dia"
			title="Relatório do dia"
			class="touch-target flex items-center justify-center rounded-(--radius-card) bg-white/10 px-3 text-xl"
		>
			📄
		</a>
	</header>

	<nav class="sticky top-0 z-10 flex overflow-x-auto border-b border-ink/10 bg-white" aria-label="Seções do paciente">
		{#each abas as { id, rotulo } (id)}
			<button
				onclick={() => (aba = id)}
				aria-current={aba === id}
				class="touch-target shrink-0 border-b-2 px-4 text-sm font-medium whitespace-nowrap transition-colors
					{aba === id ? 'border-navy text-navy' : 'border-transparent text-ink/50'}"
			>
				{rotulo}
			</button>
		{/each}
	</nav>

	<section class="p-4">
		{#if aba === 'timeline'}
			<Timeline patientId={data.paciente.id} nomeCuidador={data.cuidador.nome} />
		{:else if aba === 'rotinas'}
			{#if editandoTarefa}
				<h2 class="mb-3 text-lg font-bold text-navy">
					{editandoTarefa === 'nova' ? 'Nova rotina' : 'Editar rotina'}
				</h2>
				<TarefaForm
					patientId={data.paciente.id}
					tipos={data.tipos}
					inicial={editandoTarefa === 'nova' ? undefined : editandoTarefa}
					aoFechar={fecharTarefa}
				/>
			{:else}
				<div class="mb-3 flex justify-end">
					<button
						onclick={() => (editandoTarefa = 'nova')}
						class="touch-target rounded-(--radius-card) bg-navy px-4 text-sm font-semibold text-white"
					>
						+ Nova rotina
					</button>
				</div>
				{#if data.tarefas.length === 0}
					<div class="flex flex-col items-center gap-3 rounded-(--radius-card-lg) border border-dashed border-ink/20 p-8 text-center">
						<p class="text-ink/60">Nenhuma rotina ainda.</p>
						<button
							onclick={() => (editandoTarefa = 'nova')}
							class="touch-target rounded-(--radius-card) bg-navy px-5 text-sm font-semibold text-white"
						>
							Criar a primeira rotina
						</button>
					</div>
				{:else}
					<ul class="flex flex-col gap-3">
						{#each data.tarefas as tarefa (tarefa.id)}
							<li class="rounded-(--radius-card-lg) border border-ink/10 p-4 {tarefa.ativo ? '' : 'opacity-50'}">
								<div class="flex items-start gap-3">
									<span class="text-2xl" aria-hidden="true">{TIPOS_CUIDADO[tarefa.tipo].icone}</span>
									<div class="min-w-0 flex-1">
										<p class="font-semibold">{tarefa.titulo}</p>
										<p class="text-sm text-ink/60">
											{tarefa.horarios.join(' · ')} — {resumoDias(tarefa.diasSemana)}
										</p>
										{#if tarefa.medicacao}
											<p class="text-sm text-ink/60">
												{tarefa.medicacao.dose} · via {tarefa.medicacao.via}
												{#if tarefa.medicacao.estoque}
													· estoque: {tarefa.medicacao.estoque.quantidadeAtual}
													{tarefa.medicacao.estoque.unidade}
												{/if}
											</p>
										{/if}
									</div>
								</div>
								<div class="mt-2 flex justify-end gap-1">
									<button
										onclick={() => (editandoTarefa = tarefa)}
										class="touch-target px-3 text-sm font-medium text-cuidado"
									>
										Editar
									</button>
									<button
										onclick={() => alternarTarefa(tarefa)}
										class="touch-target px-3 text-sm font-medium {tarefa.ativo ? 'text-ink/50' : 'text-realizado'}"
									>
										{tarefa.ativo ? 'Desativar' : 'Ativar'}
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			{/if}
		{:else if aba === 'afericoes'}
			<AfericoesTab patientId={data.paciente.id} />
		{:else}
			<dl class="flex flex-col gap-4">
				<div>
					<dt class="text-xs font-semibold uppercase tracking-wide text-ink/50">Nascimento</dt>
					<dd>{new Date(data.paciente.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')} ({calcularIdade(data.paciente.dataNascimento)} anos)</dd>
				</div>
				{#if data.paciente.responsavel}
					<div>
						<dt class="text-xs font-semibold uppercase tracking-wide text-ink/50">Responsável</dt>
						<dd>
							{data.paciente.responsavel.nome}
							{#if data.paciente.responsavel.parentesco}({data.paciente.responsavel.parentesco}){/if}
							{#if data.paciente.responsavel.telefone}
								· <a href="tel:{data.paciente.responsavel.telefone}" class="text-cuidado underline">{data.paciente.responsavel.telefone}</a>
							{/if}
						</dd>
					</div>
				{/if}
				{#if data.paciente.alergias?.length}
					<div>
						<dt class="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">Alergias</dt>
						<dd class="flex flex-wrap gap-1">
							{#each data.paciente.alergias as alergia (alergia)}
								<span class="rounded-full bg-critico/10 px-3 py-1 text-sm font-medium text-critico">{alergia}</span>
							{/each}
						</dd>
					</div>
				{/if}
				{#if data.paciente.condicoes?.length}
					<div>
						<dt class="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">Condições</dt>
						<dd class="flex flex-wrap gap-1">
							{#each data.paciente.condicoes as condicao (condicao)}
								<span class="rounded-full bg-navy-50 px-3 py-1 text-sm font-medium text-navy">{condicao}</span>
							{/each}
						</dd>
					</div>
				{/if}
				{#if data.paciente.observacoes}
					<div>
						<dt class="text-xs font-semibold uppercase tracking-wide text-ink/50">Observações</dt>
						<dd class="whitespace-pre-wrap">{data.paciente.observacoes}</dd>
					</div>
				{/if}
				<a
					href="/pacientes/{data.paciente.id}/editar"
					class="touch-target mt-2 flex items-center justify-center rounded-(--radius-card) border border-navy text-sm font-semibold text-navy"
				>
					Editar perfil
				</a>
			</dl>
		{/if}
	</section>

	<!-- FAB de registro rápido (§5) -->
	<a
		href="/pacientes/{data.paciente.id}/registrar"
		aria-label="Registro rápido"
		class="fixed right-4 bottom-24 flex size-14 items-center justify-center rounded-full bg-cuidado text-3xl font-light text-white shadow-lg"
	>
		+
	</a>
</div>
