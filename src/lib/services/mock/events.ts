import { endOfDay, formatISO, startOfDay } from 'date-fns';
import type { CareEvent, Reading } from '$lib/domain/types';
import type { EventService } from '../types';
import { db } from './db';
import { novoId } from './ids';

export const eventsMock: EventService = {
	// ISO com offset local ordena lexicograficamente dentro do mesmo dia
	async listarPorDia(patientId, dia) {
		return db.events
			.where('[patientId+ocorridoEm]')
			.between(
				[patientId, formatISO(startOfDay(dia))],
				[patientId, formatISO(endOfDay(dia))],
				true,
				true
			)
			.toArray();
	},

	obter: (id) => db.events.get(id),

	async criar(dados, leituras = []) {
		const evento: CareEvent = {
			...dados,
			id: novoId(),
			registradoEm: formatISO(new Date()),
			sincronizado: false
		};
		// foraDoPadrao é calculado na gravação pelo motor de alertas (Fase 7);
		// até lá, toda leitura nova entra como dentro do padrão.
		const readings: Reading[] = leituras.map((l) => ({
			...l,
			id: novoId(),
			eventId: evento.id,
			patientId: evento.patientId,
			foraDoPadrao: false,
			sincronizado: false
		}));
		await db.transaction('rw', db.events, db.readings, async () => {
			await db.events.add(evento);
			if (readings.length > 0) await db.readings.bulkAdd(readings);
		});
		return evento;
	},

	async editar(id, mudancas, motivoEdicao) {
		await db.events.update(id, { ...mudancas, editadoEm: formatISO(new Date()), motivoEdicao });
		const evento = await db.events.get(id);
		if (!evento) throw new Error('Evento não encontrado');
		return evento;
	},

	async marcarPulado(id, motivo) {
		await db.events.update(id, { status: 'pulado', motivoPulo: motivo });
		const evento = await db.events.get(id);
		if (!evento) throw new Error('Evento não encontrado');
		return evento;
	}
};
