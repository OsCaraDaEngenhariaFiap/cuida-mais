import type { CareEvent } from './types';

export function selecionarUltimoCuidado(eventos: CareEvent[]): CareEvent | undefined {
	let ultimo: CareEvent | undefined;
	let instanteMaisRecente = Number.NEGATIVE_INFINITY;

	for (const evento of eventos) {
		if (evento.status === 'pulado') continue;
		const instante = Date.parse(evento.ocorridoEm);
		if (!Number.isFinite(instante) || instante <= instanteMaisRecente) continue;
		ultimo = evento;
		instanteMaisRecente = instante;
	}

	return ultimo;
}
