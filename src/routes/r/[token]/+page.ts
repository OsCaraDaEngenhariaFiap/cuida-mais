import { services } from '$lib/services';
import type { PageLoad } from './$types';

// Página pública (§6): sem login, sem escrita. Token inválido/expirado/revogado
// → página neutra, sem vazar a existência do paciente.
export const load: PageLoad = async ({ params }) => {
	const link = await services.share.resolverToken(params.token);
	if (!link) return { valido: false as const };

	const paciente = await services.patients.obter(link.patientId);
	if (!paciente) return { valido: false as const };

	const [eventos, alertas] = await Promise.all([
		services.events.listarPorDia(paciente.id, new Date()), // escopo: só o dia atual
		services.alerts.listar({ patientId: paciente.id })
	]);
	return {
		valido: true as const,
		paciente,
		eventos,
		temAlertaCritico: alertas.some((a) => a.severidade === 'critico')
	};
};
