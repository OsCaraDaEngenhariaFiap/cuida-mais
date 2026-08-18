import { redirect } from '@sveltejs/kit';
import { services } from '$lib/services';

// Guarda de sessão do grupo protegido (Fase 2)
export const load = async () => {
	const cuidador = await services.auth.sessaoAtual();
	if (!cuidador) redirect(307, '/login');
	return { cuidador };
};
