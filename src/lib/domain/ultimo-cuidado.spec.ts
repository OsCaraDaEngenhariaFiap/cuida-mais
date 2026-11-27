import { describe, expect, it } from 'vitest';
import type { CareEvent } from './types';
import { selecionarUltimoCuidado } from './ultimo-cuidado';

function evento(id: string, ocorridoEm: string, status: CareEvent['status']): CareEvent {
	return {
		id,
		patientId: 'p1',
		tipo: 'outro',
		titulo: id,
		ocorridoEm,
		registradoEm: ocorridoEm,
		registradoPor: 'c1',
		status,
		sincronizado: true
	};
}

describe('selecionarUltimoCuidado', () => {
	it('retorna undefined sem histórico', () => {
		expect(selecionarUltimoCuidado([])).toBeUndefined();
	});

	it('considera atrasado como cuidado feito e ignora um pulado posterior', () => {
		const realizado = evento('realizado', '2026-11-20T08:00:00-03:00', 'realizado');
		const atrasado = evento('atrasado', '2026-11-21T09:00:00-03:00', 'atrasado');
		const pulado = evento('pulado', '2026-11-22T10:00:00-03:00', 'pulado');

		expect(selecionarUltimoCuidado([realizado, atrasado, pulado])).toBe(atrasado);
	});
});
