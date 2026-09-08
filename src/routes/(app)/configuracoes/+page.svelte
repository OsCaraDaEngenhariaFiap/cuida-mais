<script lang="ts">
	import { goto } from '$app/navigation';
	import { services } from '$lib/services';
	import {
		agendarNotificacoes,
		mostrarNotificacao,
		pedirPermissaoNotificacao,
		permissaoNotificacao
	} from '$lib/services/notificacoes';
	import { instalacao, instalarApp } from '$lib/stores/instalacao.svelte';
	import { preferencias, salvarPreferencias } from '$lib/stores/preferencias.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let resetando = $state(false);
	let permissao = $state(permissaoNotificacao());

	async function sair() {
		await services.auth.logout();
		await goto('/login');
	}

	async function resetarDemo() {
		if (!confirm('Apagar todos os dados e recarregar a demonstração?')) return;
		resetando = true;
		await services.demo.resetar();
		await services.auth.logout(); // a sessão aponta para um cuidador que não existe mais
		resetando = false;
		await goto('/login');
	}

	async function ativarNotificacoes() {
		permissao = await pedirPermissaoNotificacao();
		if (permissao === 'granted') await agendarNotificacoes();
	}

	async function testarNotificacao() {
		await mostrarNotificacao('Cuida+ funcionando 🎉', 'As notificações estão ativas.', 'teste');
	}

	const rotuloPermissao = $derived(
		permissao === 'granted'
			? 'ativas'
			: permissao === 'denied'
				? 'bloqueadas no navegador'
				: permissao === 'indisponivel'
					? 'indisponíveis neste navegador'
					: 'não ativadas'
	);
</script>

<svelte:head>
	<title>Configurações · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<h1 class="mb-4 text-2xl font-bold text-marca">Configurações</h1>

	<section class="mb-4 flex items-center gap-3 rounded-(--radius-card-lg) border border-ink/10 p-4">
		{#if data.cuidador.fotoUrl}
			<img src={data.cuidador.fotoUrl} alt="" class="size-12 rounded-full object-cover" />
		{:else}
			<div class="flex size-12 items-center justify-center rounded-full bg-navy-50 text-lg font-bold text-marca">
				{data.cuidador.nome.slice(0, 1)}
			</div>
		{/if}
		<div>
			<p class="font-semibold">{data.cuidador.nome}</p>
			<p class="text-sm text-ink/60">{data.cuidador.email}</p>
		</div>
	</section>

	<section class="mb-4 flex flex-col gap-3 rounded-(--radius-card-lg) border border-ink/10 p-4">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-ink/50">Registro</h2>
		<label class="flex items-center justify-between gap-3">
			<span class="text-sm">Foto obrigatória na medicação</span>
			<input
				type="checkbox"
				checked={preferencias.fotoObrigatoriaMedicacao}
				onchange={(e) => {
					preferencias.fotoObrigatoriaMedicacao = e.currentTarget.checked;
					salvarPreferencias();
				}}
				class="size-6 accent-marca"
			/>
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label class="flex flex-col gap-1">
				<span class="text-sm text-ink/70">Tolerância padrão (min)</span>
				<input
					type="number"
					min="0"
					value={preferencias.toleranciaPadraoMin}
					onchange={(e) => {
						preferencias.toleranciaPadraoMin = Number(e.currentTarget.value) || 30;
						salvarPreferencias();
					}}
					class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-sm text-ink/70">Lembrete padrão (min)</span>
				<input
					type="number"
					min="0"
					value={preferencias.lembretePadraoMin}
					onchange={(e) => {
						preferencias.lembretePadraoMin = Number(e.currentTarget.value) || 15;
						salvarPreferencias();
					}}
					class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
				/>
			</label>
		</div>
		<label class="flex flex-col gap-1">
			<span class="text-sm text-ink/70">Tema</span>
			<select
				value={preferencias.tema}
				onchange={(e) => {
					preferencias.tema = e.currentTarget.value as typeof preferencias.tema;
					salvarPreferencias();
				}}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
			>
				<option value="claro">Claro</option>
				<option value="escuro">Escuro</option>
				<option value="auto">Automático (sistema)</option>
			</select>
		</label>
	</section>

	<section class="mb-4 flex flex-col gap-2 rounded-(--radius-card-lg) border border-ink/10 p-4">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-ink/50">Notificações</h2>
		<p class="text-sm text-ink/70">
			Lembrete antes do horário + aviso no horário exato. Estado: <strong>{rotuloPermissao}</strong>.
		</p>
		{#if permissao === 'default'}
			<button
				onclick={ativarNotificacoes}
				class="touch-target rounded-(--radius-card) bg-navy text-sm font-semibold text-white"
			>
				Ativar notificações
			</button>
		{:else if permissao === 'granted'}
			<button
				onclick={testarNotificacao}
				class="touch-target rounded-(--radius-card) border border-marca text-sm font-semibold text-marca"
			>
				Testar notificação
			</button>
		{/if}
	</section>

	<nav class="flex flex-col overflow-hidden rounded-(--radius-card-lg) border border-ink/10">
		<a href="/configuracoes/afericoes" class="touch-target flex items-center justify-between px-4 hover:bg-navy-50">
			<span>Catálogo de aferições</span>
			<span aria-hidden="true" class="text-ink/40">›</span>
		</a>
		{#if instalacao.disponivel}
			<button
				onclick={instalarApp}
				class="touch-target flex items-center justify-between border-t border-ink/10 px-4 text-left text-marca hover:bg-navy-50"
			>
				<span>📲 Instalar aplicativo</span>
			</button>
		{/if}
		{#if import.meta.env.DEV}
			<button
				onclick={resetarDemo}
				disabled={resetando}
				class="touch-target flex items-center justify-between border-t border-ink/10 px-4 text-left text-atencao hover:bg-navy-50"
			>
				<span>{resetando ? 'Resetando…' : 'Resetar dados de demonstração'}</span>
			</button>
		{/if}
		<button
			onclick={sair}
			class="touch-target flex items-center justify-between border-t border-ink/10 px-4 text-left text-critico hover:bg-navy-50"
		>
			<span>Sair</span>
		</button>
	</nav>
</div>
