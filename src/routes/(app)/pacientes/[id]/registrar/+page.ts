import { error } from '@sveltejs/kit';
import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const { cuidador } = await parent();
	const paciente = await services.patients.obter(params.id);
	if (!paciente) error(404, 'Paciente não encontrado');
	const tipos = await services.measurements.listarTipos();
	return { cuidador, paciente, tipos };
};
