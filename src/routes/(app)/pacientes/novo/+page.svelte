<script lang="ts">
	import PacienteForm from '$lib/components/PacienteForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Novo paciente · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<h1 class="mb-4 text-2xl font-bold text-navy">Novo paciente</h1>
	<PacienteForm caregiverId={data.cuidador.id} />
</div>
