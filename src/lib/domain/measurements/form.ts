// Preparo de leituras dirigido pelo FORMATO do campo — o código não conhece
// nenhuma métrica por nome: uma aferição criada em runtime entra no mesmo caminho.
import type { MeasurementField, MeasurementType } from '../types';

export type EntradaCampo = string | number | boolean | null | undefined;

export interface ValorLeitura {
	campo: string;
	valorNum?: number;
	valorTexto?: string;
}

export type ResultadoPreparo =
	| { ok: true; valor: ValorLeitura }
	| { ok: false; erro: string };

export function gerarSlug(nome: string): string {
	return nome
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Menor passo representável do campo (usado também como piso de σ, §4.2b). */
export function menorIncremento(campo: MeasurementField): number {
	if (campo.formato === 'numero') return 10 ** -(campo.casasDecimais ?? 0);
	return 1; // escala é inteira
}

function numerico(entrada: EntradaCampo): number | null {
	if (typeof entrada === 'number') return Number.isFinite(entrada) ? entrada : null;
	if (typeof entrada === 'string' && entrada.trim() !== '') {
		const n = Number(entrada.replace(',', '.'));
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

export function prepararValor(campo: MeasurementField, entrada: EntradaCampo): ResultadoPreparo {
	switch (campo.formato) {
		case 'numero': {
			const n = numerico(entrada);
			if (n === null) return { ok: false, erro: `Informe um número em “${campo.rotulo}”` };
			const fator = 10 ** (campo.casasDecimais ?? 0);
			return { ok: true, valor: { campo: campo.chave, valorNum: Math.round(n * fator) / fator } };
		}
		case 'escala': {
			const n = numerico(entrada);
			if (n === null) return { ok: false, erro: `Informe um valor em “${campo.rotulo}”` };
			const { min, max } = campo.escala ?? { min: 0, max: 10 };
			if (n < min || n > max) {
				return { ok: false, erro: `“${campo.rotulo}” deve estar entre ${min} e ${max}` };
			}
			return { ok: true, valor: { campo: campo.chave, valorNum: Math.round(n) } };
		}
		case 'booleano': {
			if (typeof entrada !== 'boolean') {
				return { ok: false, erro: `Responda sim ou não em “${campo.rotulo}”` };
			}
			return { ok: true, valor: { campo: campo.chave, valorNum: entrada ? 1 : 0 } };
		}
		case 'opcoes': {
			if (typeof entrada !== 'string' || !campo.opcoes?.includes(entrada)) {
				return { ok: false, erro: `Escolha uma opção em “${campo.rotulo}”` };
			}
			return { ok: true, valor: { campo: campo.chave, valorTexto: entrada } };
		}
		case 'texto': {
			const texto = typeof entrada === 'string' ? entrada.trim() : '';
			if (texto === '') return { ok: false, erro: `Escreva algo em “${campo.rotulo}”` };
			return { ok: true, valor: { campo: campo.chave, valorTexto: texto } };
		}
	}
}

/** Uma aferição = 1 evento + N leituras: prepara todas as leituras do tipo de uma vez. */
export function prepararLeituras(
	tipo: MeasurementType,
	entradas: Record<string, EntradaCampo>
): { ok: true; valores: ValorLeitura[] } | { ok: false; erros: string[] } {
	const valores: ValorLeitura[] = [];
	const erros: string[] = [];
	for (const campo of tipo.campos) {
		const resultado = prepararValor(campo, entradas[campo.chave]);
		if (resultado.ok) valores.push(resultado.valor);
		else erros.push(resultado.erro);
	}
	return erros.length > 0 ? { ok: false, erros } : { ok: true, valores };
}
