import { formatISO } from 'date-fns';
import type { Alert } from '$lib/domain/types';
import type { AlertService } from '../types';
import { db } from './db';
import { novoId } from './ids';

export const alertsMock: AlertService = {
	async listar(filtro = {}) {
		const { patientId, somenteNaoReconhecidos = true } = filtro;
		let lista = patientId
			? await db.alerts.where('patientId').equals(patientId).toArray()
			: await db.alerts.toArray();
		if (somenteNaoReconhecidos) lista = lista.filter((a) => !a.reconhecidoEm);
		// críticos primeiro; dentro da severidade, mais recentes primeiro
		return lista.sort((a, b) =>
			a.severidade === b.severidade
				? b.criadoEm.localeCompare(a.criadoEm)
				: a.severidade === 'critico'
					? -1
					: 1
		);
	},

	async criarSeNovo(dados) {
		if (dados.referenciaId) {
			// §4.5, escopado por paciente: a mesma referência (ex.: um MeasurementType)
			// pode alertar em pacientes diferentes ao mesmo tempo
			const duplicado = await db.alerts
				.where('[tipo+referenciaId]')
				.equals([dados.tipo, dados.referenciaId])
				.filter((a) => !a.reconhecidoEm && a.patientId === dados.patientId)
				.first();
			if (duplicado) return null;
		}
		const alerta: Alert = { ...dados, id: novoId(), criadoEm: formatISO(new Date()) };
		await db.alerts.add(alerta);
		return alerta;
	},

	async reconhecer(id, caregiverId) {
		await db.alerts.update(id, {
			reconhecidoEm: formatISO(new Date()),
			reconhecidoPor: caregiverId
		});
	},

	async resolverPorReferencia(tipo, referenciaId, patientId) {
		await db.alerts
			.where('[tipo+referenciaId]')
			.equals([tipo, referenciaId])
			.filter((a) => !a.reconhecidoEm && (!patientId || a.patientId === patientId))
			.delete();
	}
};
