import { services } from '$lib/services';

// App 100% client-side (SPA): sem SSR e sem prerender de páginas — o adapter-static
// gera só o fallback index.html (não usar `prerender = true` aqui: salvaria shells vazios).
export const ssr = false;
export const prerender = false;

// Primeiro boot: abrir o storage dispara o seed de demonstração (§8)
export const load = async () => {
	await services.inicializar();
};
