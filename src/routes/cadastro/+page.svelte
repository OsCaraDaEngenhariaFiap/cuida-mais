<script lang="ts">
	import { goto } from '$app/navigation';
	import { services } from '$lib/services';
	import { comprimirImagem } from '$lib/utils/imagem';

	let nome = $state('');
	let email = $state('');
	let senha = $state('');
	let fotoUrl = $state<string | undefined>(undefined);
	let erro = $state('');
	let ocupado = $state(false);

	async function escolherFoto(e: Event) {
		const arquivo = (e.currentTarget as HTMLInputElement).files?.[0];
		if (arquivo) fotoUrl = await comprimirImagem(arquivo);
	}

	async function cadastrar(e: SubmitEvent) {
		e.preventDefault();
		ocupado = true;
		erro = '';
		try {
			await services.auth.cadastrar({ nome, email, senha, fotoUrl });
			await goto('/', { invalidateAll: true });
		} catch (falha) {
			erro = falha instanceof Error ? falha.message : 'Não foi possível criar a conta';
		} finally {
			ocupado = false;
		}
	}
</script>

<svelte:head>
	<title>Criar conta · Cuida+</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 p-6">
	<header class="text-center">
		<h1 class="text-2xl font-bold text-navy">Criar conta</h1>
		<p class="mt-1 text-sm text-ink/60">Para o cuidador — a família acessa por link, sem conta</p>
	</header>

	<form onsubmit={cadastrar} class="flex flex-col gap-4">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">Nome</span>
			<input
				type="text"
				required
				autocomplete="name"
				bind:value={nome}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">E-mail</span>
			<input
				type="email"
				required
				autocomplete="email"
				bind:value={email}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">Senha</span>
			<input
				type="password"
				required
				minlength="6"
				autocomplete="new-password"
				bind:value={senha}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">Foto (opcional)</span>
			<div class="flex items-center gap-3">
				{#if fotoUrl}
					<img src={fotoUrl} alt="Sua foto" class="size-12 rounded-full object-cover" />
				{/if}
				<input type="file" accept="image/*" onchange={escolherFoto} class="text-sm" />
			</div>
		</label>

		{#if erro}
			<p role="alert" class="rounded-(--radius-card) bg-critico/10 px-4 py-3 text-sm font-medium text-critico">
				{erro}
			</p>
		{/if}

		<button
			type="submit"
			disabled={ocupado}
			class="touch-target rounded-(--radius-card) bg-navy text-base font-semibold text-white transition-opacity disabled:opacity-60"
		>
			{ocupado ? 'Criando…' : 'Criar conta'}
		</button>
	</form>

	<footer class="text-center text-sm text-ink/60">
		Já tem conta? <a href="/login" class="font-semibold text-cuidado underline">Entrar</a>
	</footer>
</main>
