<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { calcularIdade } from '$lib/domain/idade';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let busca = $state('');

	const filtrados = $derived(
		data.pacientes.filter((p) =>
			`${p.nome} ${p.localizacao ?? ''}`.toLowerCase().includes(busca.trim().toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Pacientes · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<header class="mb-4 flex items-center justify-between gap-3">
		<h1 class="text-2xl font-bold text-marca">Pacientes</h1>
		<a
			href="/pacientes/novo"
			class="touch-target flex items-center rounded-(--radius-card) bg-navy px-4 text-sm font-semibold text-white"
		>
			+ Novo
		</a>
	</header>

	{#if data.pacientes.length > 0}
		<input
			type="search"
			placeholder="Buscar por nome ou local…"
			bind:value={busca}
			class="touch-target mb-4 w-full rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
		/>
	{/if}

	{#if data.pacientes.length === 0}
		<div class="flex flex-col items-center gap-4 rounded-(--radius-card-lg) border border-dashed border-ink/20 p-8 text-center">
			<p class="text-ink/60">Nenhum paciente ainda.</p>
			<a
				href="/pacientes/novo"
				class="touch-target flex items-center rounded-(--radius-card) bg-navy px-5 text-sm font-semibold text-white"
			>
				Cadastrar o primeiro
			</a>
		</div>
	{:else if filtrados.length === 0}
		<p class="p-8 text-center text-ink/60">Nada encontrado para “{busca}”.</p>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each filtrados as paciente (paciente.id)}
				{@const badges = data.alertasPorPaciente.get(paciente.id)}
				<li>
					<a
						href="/pacientes/{paciente.id}"
						class="flex items-center gap-3 rounded-(--radius-card-lg) border border-ink/10 p-4 transition-colors hover:bg-navy-50"
					>
						<Avatar nome={paciente.nome} fotoUrl={paciente.fotoUrl} />
						<div class="min-w-0 flex-1">
							<p class="truncate font-semibold">{paciente.nome}</p>
							<p class="truncate text-sm text-ink/60">
								{calcularIdade(paciente.dataNascimento)} anos
								{#if paciente.localizacao}
									· {paciente.localizacao}
								{/if}
							</p>
						</div>
						{#if badges && badges.total > 0}
							<span
								class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white {badges.criticos > 0 ? 'bg-critico' : 'bg-atencao'}"
								title="{badges.total} alerta(s)"
							>
								{badges.total}
							</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
