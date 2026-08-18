import { format } from 'date-fns';
import { error } from '@sveltejs/kit';
import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const paciente = await services.patients.obter(params.id);
	if (!paciente) error(404, 'Paciente não encontrado');
	const agora = new Date();
	const hoje = format(agora, 'yyyy-MM-dd'); // aferidoEm é ISO com offset local
	const [eventos, flagged] = await Promise.all([
		services.events.listarPorDia(params.id, agora),
		services.measurements.leiturasForaDoPadrao(params.id)
	]);
	return {
		paciente,
		eventos,
		foraDoPadraoHoje: flagged.filter((r) => r.aferidoEm.slice(0, 10) === hoje)
	};
};
