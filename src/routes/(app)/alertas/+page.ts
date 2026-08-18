import { services } from '$lib/services';
import { reavaliarAlertas } from '$lib/services/alertas-engine';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { cuidador } = await parent();
	await reavaliarAlertas();
	const [alertas, pacientes] = await Promise.all([
		services.alerts.listar(),
		services.patients.listar(cuidador.id)
	]);
	return {
		alertas,
		nomesPacientes: new Map(pacientes.map((p) => [p.id, p.nome]))
	};
};
