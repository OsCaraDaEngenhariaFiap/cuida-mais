<script lang="ts">
	let {
		nome,
		fotoUrl,
		tamanho = 'md'
	}: { nome: string; fotoUrl?: string; tamanho?: 'sm' | 'md' | 'lg' } = $props();

	const classes = { sm: 'size-10 text-base', md: 'size-12 text-lg', lg: 'size-16 text-2xl' };
</script>

{#if fotoUrl}
	<img src={fotoUrl} alt="Foto de {nome}" class="{classes[tamanho]} shrink-0 rounded-full object-cover" />
{:else}
	<div
		aria-hidden="true"
		class="{classes[tamanho]} flex shrink-0 items-center justify-center rounded-full bg-navy-50 font-bold text-navy"
	>
		{nome.trim().slice(0, 1).toUpperCase()}
	</div>
{/if}
