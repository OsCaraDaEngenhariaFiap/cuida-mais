<script lang="ts">
	import { goto } from '$app/navigation';
	import PacienteForm from '$lib/components/PacienteForm.svelte';
	import { services } from '$lib/services';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	async function arquivar() {
		if (!confirm(`Arquivar ${data.paciente.nome}? O histórico é mantido, mas o paciente sai da lista.`)) return;
		await services.patients.arquivar(data.paciente.id);
		await goto('/pacientes', { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>Editar {data.paciente.nome} · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<h1 class="mb-4 text-2xl font-bold text-marca">Editar paciente</h1>
	<PacienteForm caregiverId={data.paciente.caregiverId} inicial={data.paciente} />

	<button
		onclick={arquivar}
		class="touch-target mt-6 w-full rounded-(--radius-card) border border-critico text-sm font-semibold text-critico"
	>
		Arquivar paciente
	</button>
</div>
