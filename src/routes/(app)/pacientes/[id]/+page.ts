import { error } from '@sveltejs/kit';
import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const paciente = await services.patients.obter(params.id);
	if (!paciente) error(404, 'Paciente não encontrado');
	const [tarefas, tipos] = await Promise.all([
		services.tasks.listarPorPaciente(params.id, true),
		services.measurements.listarTipos()
	]);
	return { paciente, tarefas, tipos };
};
