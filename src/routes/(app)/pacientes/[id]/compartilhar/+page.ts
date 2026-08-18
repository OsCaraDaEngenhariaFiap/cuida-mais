import { error } from '@sveltejs/kit';
import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const paciente = await services.patients.obter(params.id);
	if (!paciente) error(404, 'Paciente não encontrado');
	return { paciente, link: await services.share.ativo(params.id) };
};
