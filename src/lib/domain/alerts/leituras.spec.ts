import { describe, expect, it } from 'vitest';
import type { MeasurementField } from '../types';
import { avaliarLeitura } from './leituras';

describe('camada a — faixa absoluta (§4.2a)', () => {
	const fc: MeasurementField = {
		chave: 'valor',
		rotulo: 'FC',
		formato: 'numero',
		casasDecimais: 0,
		faixaNormal: { min: 50, max: 110, severidade: 'critico' }
	};

	it('fora da faixa dispara com a severidade DO DADO (fc → crítico)', () => {
		const r = avaliarLeitura(fc, { valorNum: 140 });
		expect(r).toMatchObject({ foraDoPadrao: true, motivo: 'faixa', severidade: 'critico' });
		expect(avaliarLeitura(fc, { valorNum: 45 }).motivo).toBe('faixa');
	});

	it('severidade ausente vira atenção; faixa só de mínimo funciona (spo2 ≥ 92)', () => {
		const spo2: MeasurementField = {
			chave: 'valor',
			rotulo: 'SpO2',
			formato: 'numero',
			faixaNormal: { min: 92 }
		};
		expect(avaliarLeitura(spo2, { valorNum: 90 }).severidade).toBe('atencao');
		expect(avaliarLeitura(spo2, { valorNum: 97 }).foraDoPadrao).toBe(false);
	});

	it('campo sem faixaNormal não roda a camada a (cai só na b)', () => {
		const semFaixa: MeasurementField = { chave: 'v', rotulo: 'v', formato: 'numero' };
		expect(avaliarLeitura(semFaixa, { valorNum: 99999 }, []).foraDoPadrao).toBe(false);
	});
});

describe('camada b — baseline com piso de σ derivado (§4.2b, contrato)', () => {
	const campo: MeasurementField = { chave: 'valor', rotulo: 'FC', formato: 'numero', casasDecimais: 0 };

	it('exemplo da spec: 88/90/91/89 e agora 140 → crítico', () => {
		const r = avaliarLeitura(campo, { valorNum: 140 }, [89, 91, 90, 88]);
		expect(r.foraDoPadrao).toBe(true);
		expect(r.motivo).toBe('baseline');
		expect(r.severidade).toBe('critico'); // 50.5 de desvio > 3 × piso(7.16)
		expect(r.media).toBeCloseTo(89.5);
		expect(r.amostras).toBe(4);
	});

	it('piso evita alarme falso em paciente muito estável (σ≈0)', () => {
		// média 90, σ=0 → piso 8% = 7.2 → limite 2σef = 14.4 → 91 NÃO dispara
		expect(avaliarLeitura(campo, { valorNum: 91 }, [90, 90, 90, 90]).foraDoPadrao).toBe(false);
		// mas 106 (desvio 16 > 14.4) dispara atenção
		const r = avaliarLeitura(campo, { valorNum: 106 }, [90, 90, 90, 90]);
		expect(r).toMatchObject({ foraDoPadrao: true, severidade: 'atencao' });
	});

	it('menos de 4 amostras → pular a camada', () => {
		expect(avaliarLeitura(campo, { valorNum: 500 }, [90, 91, 89]).foraDoPadrao).toBe(false);
	});

	it('pisoDesvio configurado no campo tem precedência sobre o derivado', () => {
		const comPiso: MeasurementField = { ...campo, pisoDesvio: 50 };
		// desvio 50.5 < 2 × 50 → não dispara
		expect(avaliarLeitura(comPiso, { valorNum: 140 }, [89, 91, 90, 88]).foraDoPadrao).toBe(false);
	});

	it('usa no máximo as 10 leituras mais recentes', () => {
		const historico = [90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 5000, 5000, 5000];
		const r = avaliarLeitura(campo, { valorNum: 140 }, historico);
		expect(r.amostras).toBe(10);
		expect(r.media).toBeCloseTo(90);
	});
});

describe('camada c — valor esperado (§4.2c)', () => {
	it('booleano diferente do esperado → atenção', () => {
		const campo: MeasurementField = {
			chave: 'ocorreu',
			rotulo: 'Ocorreu',
			formato: 'booleano',
			valorEsperado: true
		};
		expect(avaliarLeitura(campo, { valorNum: 0 })).toMatchObject({
			foraDoPadrao: true,
			motivo: 'esperado',
			severidade: 'atencao'
		});
		expect(avaliarLeitura(campo, { valorNum: 1 }).foraDoPadrao).toBe(false);
	});

	it('opcoes diferente do esperado → atenção; sem valorEsperado nunca alerta', () => {
		const campo: MeasurementField = {
			chave: 'humor',
			rotulo: 'Humor',
			formato: 'opcoes',
			opcoes: ['Bom', 'Abatido'],
			valorEsperado: 'Bom'
		};
		expect(avaliarLeitura(campo, { valorTexto: 'Abatido' }).foraDoPadrao).toBe(true);
		const semEsperado: MeasurementField = { ...campo, valorEsperado: undefined };
		expect(avaliarLeitura(semEsperado, { valorTexto: 'Abatido' }).foraDoPadrao).toBe(false);
	});
});

describe('formato texto e métrica criada em runtime', () => {
	it('texto nunca gera alerta', () => {
		const campo: MeasurementField = { chave: 'nota', rotulo: 'Nota', formato: 'texto' };
		expect(avaliarLeitura(campo, { valorTexto: 'péssimo dia' }).foraDoPadrao).toBe(false);
	});

	it('métrica inventada agora, sem faixa nem piso, funciona só com o formato', () => {
		// "Drenagem (mL)" criada em runtime: o motor nunca a viu antes
		const drenagem: MeasurementField = {
			chave: 'volume',
			rotulo: 'Drenagem',
			formato: 'numero',
			unidade: 'mL',
			casasDecimais: 0
		};
		// série estável ~400; piso derivado = 8% de 398 ≈ 31.8 → 2σef ≈ 63.7
		const historico = [390, 420, 380, 400, 400];
		expect(avaliarLeitura(drenagem, { valorNum: 430 }, historico).foraDoPadrao).toBe(false);
		const discrepante = avaliarLeitura(drenagem, { valorNum: 120 }, historico);
		expect(discrepante.foraDoPadrao).toBe(true);
		expect(discrepante.motivo).toBe('baseline');
		expect(discrepante.severidade).toBe('critico');
	});
});
