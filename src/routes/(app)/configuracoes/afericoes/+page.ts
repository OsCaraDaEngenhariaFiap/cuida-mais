import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return { tipos: await services.measurements.listarTipos(true) };
};
