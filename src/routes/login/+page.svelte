<script lang="ts">
	import { goto } from '$app/navigation';
	import { services } from '$lib/services';

	let email = $state('');
	let senha = $state('');
	let erro = $state('');
	let ocupado = $state(false);

	async function entrar(e: SubmitEvent) {
		e.preventDefault();
		ocupado = true;
		erro = '';
		try {
			const cuidador = await services.auth.login(email, senha);
			if (!cuidador) {
				erro = 'E-mail ou senha inválidos';
				return;
			}
			await goto('/', { invalidateAll: true });
		} catch (falha) {
			erro = falha instanceof Error ? falha.message : 'Não foi possível entrar';
		} finally {
			ocupado = false;
		}
	}
</script>

<svelte:head>
	<title>Entrar · Cuida+</title>
</svelte:head>

<main class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 p-6">
	<header class="text-center">
		<div class="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-navy text-3xl">
			🤍
		</div>
		<h1 class="text-3xl font-bold text-marca">Cuida+</h1>
		<p class="mt-1 text-sm text-ink/60">Registro diário de cuidados</p>
	</header>

	<form onsubmit={entrar} class="flex flex-col gap-4">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">E-mail</span>
			<input
				type="email"
				required
				autocomplete="email"
				bind:value={email}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-ink/80">Senha</span>
			<input
				type="password"
				required
				autocomplete="current-password"
				bind:value={senha}
				class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-marca"
			/>
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
			{ocupado ? 'Entrando…' : 'Entrar'}
		</button>
	</form>

	<footer class="text-center text-sm text-ink/60">
		<p>
			Não tem conta?
			<a href="/cadastro" class="font-semibold text-cuidado underline">Criar conta</a>
		</p>
		<p class="mt-4 rounded-(--radius-card) bg-navy-50 px-4 py-3">
			Demo: <strong>joao@demo.com</strong> · senha <strong>123456</strong>
		</p>
	</footer>
</main>
