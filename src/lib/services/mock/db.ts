import Dexie, { type Table } from 'dexie';
import type {
	Alert,
	CareEvent,
	CareTask,
	Caregiver,
	MeasurementType,
	Patient,
	Reading,
	ShareLink,
	UUID
} from '$lib/domain/types';
import { seedDemo } from './seed';

// Índices: só campos consultados por igualdade/faixa. Booleanos (ativo, sistema,
// revogado) não são indexáveis em IndexedDB — filtram-se em memória.
export class CuidaMaisDB extends Dexie {
	caregivers!: Table<Caregiver, UUID>;
	patients!: Table<Patient, UUID>;
	tasks!: Table<CareTask, UUID>;
	events!: Table<CareEvent, UUID>;
	readings!: Table<Reading, UUID>;
	measurementTypes!: Table<MeasurementType, UUID>;
	alerts!: Table<Alert, UUID>;
	shareLinks!: Table<ShareLink, string>;

	constructor() {
		super('cuida-mais');
		this.version(1).stores({
			caregivers: 'id, &email',
			patients: 'id, caregiverId',
			tasks: 'id, patientId',
			events: 'id, taskId, [patientId+ocorridoEm]',
			readings: 'id, eventId, [patientId+measurementTypeId+campo+aferidoEm], [patientId+measurementTypeId+aferidoEm]',
			measurementTypes: 'id, &slug',
			alerts: 'id, patientId, [tipo+referenciaId]',
			shareLinks: 'token, patientId'
		});
		// Roda uma única vez, na criação do banco (primeiro boot) — e de novo após
		// o reset de demonstração (delete + open).
		this.on('populate', () => seedDemo(this));
	}
}

export const db = new CuidaMaisDB();
