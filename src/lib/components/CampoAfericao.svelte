<script lang="ts">
	import type { EntradaCampo } from '$lib/domain/measurements/form';
	import type { MeasurementField } from '$lib/domain/types';

	let { campo, valor = $bindable() }: { campo: MeasurementField; valor: EntradaCampo } = $props();
</script>

<div class="flex flex-col gap-1">
	<span class="text-sm font-medium text-ink/80">
		{campo.rotulo}
		{#if campo.unidade}<small class="text-ink/50">({campo.unidade})</small>{/if}
	</span>

	{#if campo.formato === 'numero'}
		<input
			type="number"
			inputmode="decimal"
			step={10 ** -(campo.casasDecimais ?? 0)}
			bind:value={valor}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
		/>
	{:else if campo.formato === 'escala'}
		{@const min = campo.escala?.min ?? 0}
		{@const max = campo.escala?.max ?? 10}
		<div class="flex items-center gap-3">
			<input type="range" {min} {max} step="1" bind:value={valor} class="h-12 flex-1 accent-navy" />
			<output class="w-10 text-center text-xl font-bold text-navy">
				{typeof valor === 'number' ? valor : '–'}
			</output>
		</div>
	{:else if campo.formato === 'booleano'}
		<div class="grid grid-cols-2 gap-2" role="group" aria-label={campo.rotulo}>
			<button
				type="button"
				onclick={() => (valor = true)}
				class="touch-target rounded-(--radius-card) border text-sm font-semibold
					{valor === true ? 'border-navy bg-navy text-white' : 'border-ink/20 text-ink/70'}"
			>
				Sim
			</button>
			<button
				type="button"
				onclick={() => (valor = false)}
				class="touch-target rounded-(--radius-card) border text-sm font-semibold
					{valor === false ? 'border-navy bg-navy text-white' : 'border-ink/20 text-ink/70'}"
			>
				Não
			</button>
		</div>
	{:else if campo.formato === 'opcoes'}
		<select
			bind:value={valor}
			class="touch-target rounded-(--radius-card) border border-ink/20 px-4 text-base outline-navy"
		>
			<option value={undefined} disabled selected>Escolha…</option>
			{#each campo.opcoes ?? [] as opcao (opcao)}
				<option value={opcao}>{opcao}</option>
			{/each}
		</select>
	{:else}
		<textarea
			rows="2"
			bind:value={valor}
			class="rounded-(--radius-card) border border-ink/20 p-4 text-base outline-navy"
		></textarea>
	{/if}
</div>
