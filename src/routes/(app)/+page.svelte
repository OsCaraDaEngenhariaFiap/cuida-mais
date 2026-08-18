<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { TIPOS_CUIDADO } from '$lib/ui/tipos-cuidado';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const hoje = new Date().toLocaleDateString('pt-BR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
</script>

<svelte:head>
	<title>Dashboard · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<header class="mb-4">
		<h1 class="text-2xl font-bold text-marca">Olá, {data.cuidador.nome}</h1>
		<p class="text-sm text-ink/60 first-letter:uppercase">{hoje}</p>
	</header>

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
	{:else}
		<section class="mb-6 grid grid-cols-3 gap-3">
			<div class="rounded-(--radius-card-lg) border border-ink/10 p-3 text-center" data-contador="pendencias">
				<p class="text-2xl font-bold {data.pendencias > 0 ? 'text-atencao' : 'text-realizado'}">
					{data.pendencias}
				</p>
				<p class="text-xs text-ink/60">pendências</p>
			</div>
			<a href="/alertas" class="rounded-(--radius-card-lg) border border-ink/10 p-3 text-center" data-contador="criticos">
				<p class="text-2xl font-bold {data.criticos.length > 0 ? 'text-critico' : 'text-realizado'}">
					{data.criticos.length}
				</p>
				<p class="text-xs text-ink/60">críticos</p>
			</a>
			<div class="rounded-(--radius-card-lg) border border-ink/10 p-3 text-center" data-contador="realizados">
				<p class="text-2xl font-bold text-realizado">{data.realizadosHoje}</p>
				<p class="text-xs text-ink/60">registros hoje</p>
			</div>
		</section>

		{#if data.criticos.length > 0}
			<section class="mb-6">
				<h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-critico">Alertas críticos</h2>
				<ul class="flex flex-col gap-2">
					{#each data.criticos.slice(0, 3) as alerta (alerta.id)}
						<li>
							<a
								href="/alertas"
								class="block rounded-(--radius-card-lg) border-l-4 border-critico bg-critico/5 p-3"
							>
								<p class="text-sm font-bold text-critico">{alerta.titulo}</p>
								<p class="text-sm text-ink/80">{alerta.detalhe}</p>
								<p class="mt-0.5 text-xs text-ink/50">
									{data.nomesPacientes.get(alerta.patientId) ?? ''}
								</p>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="mb-6">
			<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">Seus pacientes</h2>
			<div class="flex gap-3 overflow-x-auto pb-1">
				{#each data.pacientes as paciente (paciente.id)}
					<a href="/pacientes/{paciente.id}" class="flex w-16 shrink-0 flex-col items-center gap-1">
						<Avatar nome={paciente.nome} fotoUrl={paciente.fotoUrl} />
						<span class="w-full truncate text-center text-xs text-ink/70">
							{paciente.nome.split(' ')[0]}
						</span>
					</a>
				{/each}
			</div>
		</section>

		<section class="mb-6">
			<h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
				Próximos horários de hoje
			</h2>
			{#if data.proximos.length === 0}
				<p class="rounded-(--radius-card-lg) border border-ink/10 p-4 text-sm text-ink/60">
					Nada mais agendado para hoje. 🎉
				</p>
			{:else}
				<ul class="flex flex-col overflow-hidden rounded-(--radius-card-lg) border border-ink/10">
					{#each data.proximos as ocorrencia (ocorrencia.taskId + ocorrencia.horario)}
						<li class="flex items-center gap-3 border-b border-ink/5 px-4 py-3 last:border-b-0">
							<span class="w-12 shrink-0 font-mono text-sm font-bold text-marca">
								{ocorrencia.horario}
							</span>
							<span aria-hidden="true">{TIPOS_CUIDADO[ocorrencia.tipo].icone}</span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{ocorrencia.titulo}</p>
								<p class="truncate text-xs text-ink/50">{ocorrencia.paciente}</p>
							</div>
							<a
								href="/pacientes/{ocorrencia.patientId}/registrar?tarefa={ocorrencia.taskId}"
								class="touch-target flex items-center rounded-(--radius-card) bg-navy-50 px-3 text-xs font-semibold text-marca"
							>
								Registrar
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>
