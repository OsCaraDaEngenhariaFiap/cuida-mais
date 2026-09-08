import { services } from '$lib/services';

// App client-side (SPA): sem SSR e sem prerender de páginas — o adapter-static
// gera o fallback index.html para as rotas do frontend.
export const ssr = false;
export const prerender = false;

// Inicialização da camada de serviços; apiServices não executa seed em produção.
export const load = async () => {
	await services.inicializar();
};
