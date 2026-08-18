// §4.2 — Aferição fora do padrão. O motor NÃO conhece métrica por nome: decide
// pelo FORMATO do campo. Métrica criada em runtime entra no mesmo caminho.
//
// | formato          | camadas |
// | numero, escala   | a + b   |
// | booleano, opcoes | c       |
// | texto            | nenhuma |
import { menorIncremento } from '../measurements/form';
import type { MeasurementField, SeveridadeAlerta } from '../types';

export interface LeituraParaAvaliar {
	valorNum?: number;
	valorTexto?: string;
}

export interface ResultadoAvaliacao {
	foraDoPadrao: boolean;
	motivo?: 'faixa' | 'baseline' | 'esperado';
	severidade?: SeveridadeAlerta;
	/** dados para a mensagem do alerta (§3.2: "FC 140 bpm — média habitual 88 bpm") */
	media?: number;
	sigmaEfetivo?: number;
	amostras?: number;
}

const DENTRO: ResultadoAvaliacao = { foraDoPadrao: false };

/** Camada a — faixa absoluta: só roda se o campo tiver faixaNormal. */
function avaliarFaixa(campo: MeasurementField, valor: number): ResultadoAvaliacao | null {
	const faixa = campo.faixaNormal;
	if (!faixa) return null;
	const fora =
		(faixa.min !== undefined && valor < faixa.min) ||
		(faixa.max !== undefined && valor > faixa.max);
	if (!fora) return null;
	return { foraDoPadrao: true, motivo: 'faixa', severidade: faixa.severidade ?? 'atencao' };
}

/**
 * Camada b — desvio da linha de base do paciente (§4.2b, contrato):
 * 1. até 10 leituras anteriores da MESMA série (paciente+tipo+campo);
 * 2. menos de 4 → pular;
 * 3. média e desvio-padrão σ;
 * 4. piso de σ: pisoDesvio do campo, senão max(8% da média, menor incremento);
 *    σ_efetivo = max(σ, piso) — é o que faz aferição nova funcionar sem ajuste;
 * 5. |valor − média| > 2σ_efetivo → atenção; > 3σ_efetivo → crítico.
 */
function avaliarBaseline(
	campo: MeasurementField,
	valor: number,
	historico: number[]
): ResultadoAvaliacao | null {
	const amostra = historico.slice(0, 10);
	if (amostra.length < 4) return null;
	const media = amostra.reduce((s, x) => s + x, 0) / amostra.length;
	const variancia = amostra.reduce((s, x) => s + (x - media) ** 2, 0) / amostra.length;
	const sigma = Math.sqrt(variancia);
	const piso = campo.pisoDesvio ?? Math.max(0.08 * Math.abs(media), menorIncremento(campo));
	const sigmaEfetivo = Math.max(sigma, piso);
	const desvio = Math.abs(valor - media);
	if (desvio <= 2 * sigmaEfetivo) return null;
	return {
		foraDoPadrao: true,
		motivo: 'baseline',
		severidade: desvio > 3 * sigmaEfetivo ? 'critico' : 'atencao',
		media,
		sigmaEfetivo,
		amostras: amostra.length
	};
}

/** Camada c — valor esperado em booleano/opcoes: diferente do esperado → atenção. */
function avaliarEsperado(
	campo: MeasurementField,
	leitura: LeituraParaAvaliar
): ResultadoAvaliacao | null {
	if (campo.valorEsperado === undefined) return null;
	const registrado =
		campo.formato === 'booleano' ? leitura.valorNum === 1 : leitura.valorTexto;
	const esperado = campo.valorEsperado;
	if (registrado === esperado) return null;
	return { foraDoPadrao: true, motivo: 'esperado', severidade: 'atencao' };
}

export function avaliarLeitura(
	campo: MeasurementField,
	leitura: LeituraParaAvaliar,
	historico: number[] = []
): ResultadoAvaliacao {
	switch (campo.formato) {
		case 'numero':
		case 'escala': {
			if (leitura.valorNum === undefined) return DENTRO;
			return (
				avaliarFaixa(campo, leitura.valorNum) ??
				avaliarBaseline(campo, leitura.valorNum, historico) ??
				DENTRO
			);
		}
		case 'booleano':
		case 'opcoes':
			return avaliarEsperado(campo, leitura) ?? DENTRO;
		case 'texto':
			return DENTRO; // nunca gera alerta
	}
}
