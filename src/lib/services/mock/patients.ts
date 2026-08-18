import { formatISO } from 'date-fns';
import type { Patient } from '$lib/domain/types';
import type { PatientService } from '../types';
import { db } from './db';
import { novoId } from './ids';

export const patientsMock: PatientService = {
	async listar(caregiverId) {
		const lista = await db.patients.where('caregiverId').equals(caregiverId).toArray();
		return lista.filter((p) => p.ativo).sort((a, b) => a.nome.localeCompare(b.nome));
	},

	obter: (id) => db.patients.get(id),

	async criar(dados) {
		const paciente: Patient = { ...dados, id: novoId(), ativo: true, criadoEm: formatISO(new Date()) };
		await db.patients.add(paciente);
		return paciente;
	},

	async atualizar(id, mudancas) {
		await db.patients.update(id, mudancas);
		const paciente = await db.patients.get(id);
		if (!paciente) throw new Error('Paciente não encontrado');
		return paciente;
	},

	async arquivar(id) {
		await db.patients.update(id, { ativo: false });
	}
};
