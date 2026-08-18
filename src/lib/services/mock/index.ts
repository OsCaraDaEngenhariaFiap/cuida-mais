import type { Services } from '../types';
import { alertsMock } from './alerts';
import { authMock } from './auth';
import { db } from './db';
import { eventsMock } from './events';
import { measurementsMock } from './measurements';
import { patientsMock } from './patients';
import { shareMock } from './share';
import { tasksMock } from './tasks';

export const mockServices: Services = {
	// Abrir o banco no primeiro boot dispara o populate (seed)
	async inicializar() {
		await db.open();
	},
	auth: authMock,
	patients: patientsMock,
	tasks: tasksMock,
	events: eventsMock,
	measurements: measurementsMock,
	alerts: alertsMock,
	share: shareMock,
	demo: {
		async resetar() {
			await db.delete();
			await db.open();
		}
	}
};
