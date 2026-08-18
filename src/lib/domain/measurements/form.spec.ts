import { describe, expect, it } from 'vitest';
import type { MeasurementField, MeasurementType } from '../types';
import { gerarSlug, menorIncremento, prepararLeituras, prepararValor } from './form';

const campoNumero: MeasurementField = {
	chave: 'valor',
	rotulo: 'Temperatura',
	formato: 'numero',
	unidade: '°C',
	casasDecimais: 1
};

describe('prepararValor por formato (sem métrica hardcoded)', () => {
	it('numero: aceita vírgula decimal e arredonda pelas casas', () => {
		expect(prepararValor(campoNumero, '36,68')).toEqual({
			ok: true,
			valor: { campo: 'valor', valorNum: 36.7 }
		});
		expect(prepararValor({ ...campoNumero, casasDecimais: 0 }, 88.6)).toEqual({
			ok: true,
			valor: { campo: 'valor', valorNum: 89 }
		});
	});

	it('numero: entrada vazia ou não numérica é erro', () => {
		expect(prepararValor(campoNumero, '').ok).toBe(false);
		expect(prepararValor(campoNumero, 'abc').ok).toBe(false);
		expect(prepararValor(campoNumero, undefined).ok).toBe(false);
	});

	it('escala: respeita os limites e arredonda para inteiro', () => {
		const dor: MeasurementField = {
			chave: 'valor',
			rotulo: 'Dor',
			formato: 'escala',
			escala: { min: 0, max: 10 }
		};
		expect(prepararValor(dor, 7)).toEqual({ ok: true, valor: { campo: 'valor', valorNum: 7 } });
		expect(prepararValor(dor, 11).ok).toBe(false);
		expect(prepararValor(dor, -1).ok).toBe(false);
	});

	it('booleano: vira 0/1 e exige booleano de verdade', () => {
		const campo: MeasurementField = { chave: 'ocorreu', rotulo: 'Ocorreu', formato: 'booleano' };
		expect(prepararValor(campo, true)).toEqual({
			ok: true,
			valor: { campo: 'ocorreu', valorNum: 1 }
		});
		expect(prepararValor(campo, false)).toEqual({
			ok: true,
			valor: { campo: 'ocorreu', valorNum: 0 }
		});
		expect(prepararValor(campo, 'sim').ok).toBe(false);
	});

	it('opcoes: só aceita valores da lista', () => {
		const campo: MeasurementField = {
			chave: 'consistencia',
			rotulo: 'Consistência',
			formato: 'opcoes',
			opcoes: ['Tipo 1', 'Tipo 2']
		};
		expect(prepararValor(campo, 'Tipo 2')).toEqual({
			ok: true,
			valor: { campo: 'consistencia', valorTexto: 'Tipo 2' }
		});
		expect(prepararValor(campo, 'Tipo 9').ok).toBe(false);
	});

	it('texto: apara espaços e recusa vazio', () => {
		const campo: MeasurementField = { chave: 'nota', rotulo: 'Nota', formato: 'texto' };
		expect(prepararValor(campo, '  tudo bem  ')).toEqual({
			ok: true,
			valor: { campo: 'nota', valorTexto: 'tudo bem' }
		});
		expect(prepararValor(campo, '   ').ok).toBe(false);
	});
});

describe('prepararLeituras (tipo criado em runtime)', () => {
	// Métrica inventada agora, nunca vista pelo código — precisa funcionar igual
	const tipoRuntime: MeasurementType = {
		id: 'x',
		slug: 'drenagem',
		nome: 'Drenagem do dreno',
		icone: '🧪',
		sistema: false,
		ativo: true,
		campos: [
			{ chave: 'volume', rotulo: 'Volume', formato: 'numero', unidade: 'mL', casasDecimais: 0 },
			{ chave: 'aspecto', rotulo: 'Aspecto', formato: 'opcoes', opcoes: ['Claro', 'Turvo'] }
		]
	};

	it('composto gera uma leitura por campo', () => {
		const resultado = prepararLeituras(tipoRuntime, { volume: '350', aspecto: 'Claro' });
		expect(resultado).toEqual({
			ok: true,
			valores: [
				{ campo: 'volume', valorNum: 350 },
				{ campo: 'aspecto', valorTexto: 'Claro' }
			]
		});
	});

	it('acumula os erros de todos os campos', () => {
		const resultado = prepararLeituras(tipoRuntime, { volume: '', aspecto: 'Roxo' });
		expect(resultado.ok).toBe(false);
		if (!resultado.ok) expect(resultado.erros).toHaveLength(2);
	});
});

describe('utilitários', () => {
	it('gerarSlug normaliza acentos e espaços', () => {
		expect(gerarSlug('Pressão Arterial')).toBe('pressao-arterial');
		expect(gerarSlug('  Diurese (mL)  ')).toBe('diurese-ml');
	});

	it('menorIncremento deriva das casas decimais; escala é 1', () => {
		expect(menorIncremento(campoNumero)).toBe(0.1);
		expect(menorIncremento({ ...campoNumero, casasDecimais: undefined })).toBe(1);
		expect(
			menorIncremento({ chave: 'v', rotulo: 'v', formato: 'escala', escala: { min: 0, max: 10 } })
		).toBe(1);
	});
});
