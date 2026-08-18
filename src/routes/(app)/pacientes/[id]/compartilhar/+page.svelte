<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { invalidateAll } from '$app/navigation';
	import { services } from '$lib/services';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let copiado = $state(false);

	const url = $derived(data.link ? `${location.origin}/r/${data.link.token}` : '');

	async function gerar() {
		await services.share.gerar(data.paciente.id, data.cuidador.id);
		await invalidateAll();
	}

	async function revogar() {
		if (!data.link) return;
		if (!confirm('Revogar o link? Quem tiver o endereço perde o acesso na hora.')) return;
		await services.share.revogar(data.link.token);
		await invalidateAll();
	}

	async function compartilhar() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: `Acompanhe ${data.paciente.nome} no Cuida+`,
					text: `Acompanhe o dia de ${data.paciente.nome} — acesso somente leitura:`,
					url
				});
				return;
			} catch {
				// cancelado — cai no clipboard
			}
		}
		await navigator.clipboard.writeText(url);
		copiado = true;
		setTimeout(() => (copiado = false), 2500);
	}
</script>

<svelte:head>
	<title>Compartilhar · {data.paciente.nome} · Cuida+</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg p-4">
	<h1 class="mb-1 text-2xl font-bold text-navy">Compartilhar com a família</h1>
	<p class="mb-4 text-sm text-ink/60">
		O responsável acompanha o dia de {data.paciente.nome} por um link — somente leitura, sem conta
		e sem login. Só o dia atual fica visível.
	</p>

	{#if data.link}
		<section class="mb-4 rounded-(--radius-card-lg) border border-comunicacao/30 bg-comunicacao/5 p-4">
			<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-comunicacao">Link ativo</p>
			<p class="break-all font-mono text-sm" data-testid="url-link">{url}</p>
			<p class="mt-2 text-xs text-ink/60">
				Válido até {format(parseISO(data.link.expiraEm), 'dd/MM/yyyy HH:mm')}
				{#if data.link.ultimoAcessoEm}
					· último acesso {format(parseISO(data.link.ultimoAcessoEm), 'dd/MM HH:mm')}
				{:else}
					· ainda não acessado
				{/if}
			</p>
		</section>

		<div class="flex flex-col gap-2">
			<button
				onclick={compartilhar}
				class="touch-target rounded-(--radius-card) bg-comunicacao text-sm font-semibold text-white"
			>
				{copiado ? 'Link copiado! ✓' : 'Compartilhar (WhatsApp, e-mail…)'}
			</button>
			<button
				onclick={gerar}
				class="touch-target rounded-(--radius-card) border border-ink/20 text-sm font-semibold text-ink/70"
			>
				Gerar link novo (invalida o atual)
			</button>
			<button
				onclick={revogar}
				class="touch-target rounded-(--radius-card) border border-critico text-sm font-semibold text-critico"
			>
				Revogar acesso
			</button>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-4 rounded-(--radius-card-lg) border border-dashed border-ink/20 p-8 text-center">
			<p class="text-ink/60">Nenhum link ativo para {data.paciente.nome}.</p>
			<button
				onclick={gerar}
				class="touch-target rounded-(--radius-card) bg-comunicacao px-5 text-sm font-semibold text-white"
			>
				Gerar link (válido por 7 dias)
			</button>
		</div>
	{/if}
</div>
