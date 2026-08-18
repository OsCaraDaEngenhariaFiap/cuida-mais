import { error } from '@sveltejs/kit';
import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent, url }) => {
	const { cuidador } = await parent();
	const paciente = await services.patients.obter(params.id);
	if (!paciente) error(404, 'Paciente não encontrado');
	const tipos = await services.measurements.listarTipos();
	const tarefaId = url.searchParams.get('tarefa');
	const tarefa = tarefaId ? await services.tasks.obter(tarefaId) : undefined;
	return { cuidador, paciente, tipos, tarefa };
};
