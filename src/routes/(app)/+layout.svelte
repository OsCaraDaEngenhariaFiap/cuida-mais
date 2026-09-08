<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { reavaliarAlertas } from '$lib/services/alertas-engine';
	import { agendarNotificacoes } from '$lib/services/notificacoes';
	import { atualizarContagemAlertas, contagemAlertas } from '$lib/stores/alertas.svelte';

	let { children } = $props();

	// §4: atualiza alertas e notificações uma vez ao abrir o app (§7)
	onMount(() => {
		const rodar = async () => {
			await reavaliarAlertas();
			await atualizarContagemAlertas();
			await agendarNotificacoes();
		};
		void rodar();
	});

	const tabs = [
		{
			href: '/',
			rotulo: 'Dashboard',
			// house
			icone:
				'M3 10.5 12 3l9 7.5M5 9.75V21h14V9.75M9.75 21v-6h4.5v6'
		},
		{
			href: '/pacientes',
			rotulo: 'Pacientes',
			// users
			icone:
				'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1m14-14.87a4 4 0 0 1 0 7.75M22 19v-1a4 4 0 0 0-3-3.85M12.5 7A3.5 3.5 0 1 1 5.5 7a3.5 3.5 0 0 1 7 0Z'
		},
		{
			href: '/alertas',
			rotulo: 'Alertas',
			// bell
			icone:
				'M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8m-4.73 12a2 2 0 0 1-3.46 0'
		},
		{
			href: '/configuracoes',
			rotulo: 'Config',
			// sliders
			icone:
				'M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6'
		}
	];

	const ativo = $derived((href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href)
	);
</script>

<div class="flex min-h-dvh flex-col">
	<main class="flex-1 pb-20">
		{@render children()}
	</main>

	<nav
		aria-label="Navegação principal"
		class="fixed inset-x-0 bottom-0 bg-navy pb-[env(safe-area-inset-bottom)]"
	>
		<ul class="mx-auto flex max-w-lg items-stretch">
			{#each tabs as tab (tab.href)}
				<li class="flex-1">
					<a
						href={tab.href}
						aria-current={ativo(tab.href) ? 'page' : undefined}
						class="touch-target flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors
							{ativo(tab.href) ? 'text-white' : 'text-white/50'}"
					>
						<span class="relative">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="size-6"
								aria-hidden="true"
							>
								<path d={tab.icone} />
							</svg>
							{#if tab.href === '/alertas' && contagemAlertas.total > 0}
								<span
									class="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white {contagemAlertas.criticos > 0 ? 'bg-critico' : 'bg-atencao'}"
								>
									{contagemAlertas.total}
								</span>
							{/if}
						</span>
						{tab.rotulo}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>
