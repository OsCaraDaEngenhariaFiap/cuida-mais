import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { cuidador } = await parent();
	const [pacientes, alertas] = await Promise.all([
		services.patients.listar(cuidador.id),
		services.alerts.listar()
	]);
	const alertasPorPaciente = new Map<string, { criticos: number; total: number }>();
	for (const alerta of alertas) {
		const atual = alertasPorPaciente.get(alerta.patientId) ?? { criticos: 0, total: 0 };
		atual.total += 1;
		if (alerta.severidade === 'critico') atual.criticos += 1;
		alertasPorPaciente.set(alerta.patientId, atual);
	}
	return { pacientes, alertasPorPaciente };
};
