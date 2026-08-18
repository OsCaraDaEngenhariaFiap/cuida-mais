<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import favicon from '$lib/assets/favicon.svg';
	import { capturarPromptDeInstalacao } from '$lib/stores/instalacao.svelte';
	import { carregarPreferencias, preferencias } from '$lib/stores/preferencias.svelte';

	let { children } = $props();

	// Registro manual do service worker (injectRegister: false no vite.config.ts)
	onMount(async () => {
		carregarPreferencias();
		capturarPromptDeInstalacao();
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});

	// Tema (§10, fase 10): claro | escuro | auto (segue o sistema)
	$effect(() => {
		document.documentElement.dataset.tema = preferencias.tema;
	});

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html webManifestLink}
</svelte:head>

{@render children()}
