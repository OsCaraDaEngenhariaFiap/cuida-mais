import { redirect } from '@sveltejs/kit';
import { services } from '$lib/services';

// Já logado → direto para o dashboard
export const load = async () => {
	if (await services.auth.sessaoAtual()) redirect(307, '/');
};
