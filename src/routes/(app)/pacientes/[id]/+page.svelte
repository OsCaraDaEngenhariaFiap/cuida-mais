<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { calcularIdade } from '$lib/domain/idade';
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
</script>

<svelte:head>
	<title>{data.paciente.nome} · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg">
	<header class="flex items-center gap-4 bg-navy p-4 text-white">
		<Avatar nome={data.paciente.nome} fotoUrl={data.paciente.fotoUrl} tamanho="lg" />
		<div class="min-w-0">
			<h1 class="truncate text-xl font-bold">{data.paciente.nome}</h1>
			<p class="text-sm text-white/70">
				{calcularIdade(data.paciente.dataNascimento)} anos
				{#if data.paciente.localizacao}
					· {data.paciente.localizacao}
				{/if}
			</p>
		</div>
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
			<p class="p-6 text-center text-sm text-ink/50">Linha do tempo chega na Fase 6.</p>
		{:else if aba === 'rotinas'}
			<p class="p-6 text-center text-sm text-ink/50">Rotinas chegam na Fase 5.</p>
		{:else if aba === 'afericoes'}
			<p class="p-6 text-center text-sm text-ink/50">Aferições chegam na Fase 8.</p>
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
