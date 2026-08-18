import Dexie from 'dexie';
import type { MeasurementType } from '$lib/domain/types';
import type { MeasurementService } from '../types';
import { db } from './db';
import { novoId } from './ids';

export const measurementsMock: MeasurementService = {
	async listarTipos(incluirInativos = false) {
		const tipos = await db.measurementTypes.toArray();
		return (incluirInativos ? tipos : tipos.filter((t) => t.ativo)).sort((a, b) =>
			a.nome.localeCompare(b.nome)
		);
	},

	obterTipo: (id) => db.measurementTypes.get(id),

	async criarTipo(dados) {
		const tipo: MeasurementType = { ...dados, id: novoId(), sistema: false, ativo: true };
		await db.measurementTypes.add(tipo);
		return tipo;
	},

	async atualizarTipo(id, mudancas) {
		await db.measurementTypes.update(id, mudancas);
		const tipo = await db.measurementTypes.get(id);
		if (!tipo) throw new Error('Tipo de aferição não encontrado');
		return tipo;
	},

	async alternarAtivo(id, ativo) {
		await db.measurementTypes.update(id, { ativo });
	},

	async leituras(patientId, measurementTypeId, campo, limite) {
		let consulta = db.readings
			.where('[patientId+measurementTypeId+campo+aferidoEm]')
			.between(
				[patientId, measurementTypeId, campo, Dexie.minKey],
				[patientId, measurementTypeId, campo, Dexie.maxKey]
			)
			.reverse();
		if (limite !== undefined) consulta = consulta.limit(limite);
		return consulta.toArray();
	},

	async ultimaLeituraDoTipo(patientId, measurementTypeId) {
		return db.readings
			.where('[patientId+measurementTypeId+aferidoEm]')
			.between(
				[patientId, measurementTypeId, Dexie.minKey],
				[patientId, measurementTypeId, Dexie.maxKey]
			)
			.reverse()
			.first();
	},

	async leiturasForaDoPadrao(patientId) {
		return db.readings
			.where('patientId')
			.equals(patientId)
			.filter((r) => r.foraDoPadrao)
			.toArray();
	},

	async camposRegistrados(patientId) {
		const lidas = await db.readings.where('patientId').equals(patientId).toArray();
		const vistos = new Map<string, { measurementTypeId: string; campo: string }>();
		for (const r of lidas) {
			vistos.set(`${r.measurementTypeId}|${r.campo}`, {
				measurementTypeId: r.measurementTypeId,
				campo: r.campo
			});
		}
		return [...vistos.values()];
	}
};
