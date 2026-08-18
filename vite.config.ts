import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
// import fs from 'node:fs'; // usado só pela opção HTTPS com mkcert (ver README)

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// SPA pura: adapter-static com fallback para rotas dinâmicas ([id], [token]).
			adapter: adapter({ fallback: 'index.html' }),

			// O registro do service worker é feito pelo vite-plugin-pwa (virtual:pwa-register),
			// não pelo mecanismo nativo do Kit.
			serviceWorker: { register: false }
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			// registerSW.js injetado não funciona no SvelteKit; registro manual no +layout.svelte
			injectRegister: false,
			manifest: {
				name: 'Cuida+ — Registro de Cuidados',
				short_name: 'Cuida+',
				description: 'Registro diário de cuidados de pacientes para cuidadores',
				lang: 'pt-BR',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				orientation: 'portrait',
				theme_color: '#152A47',
				background_color: '#FFFFFF',
				// purpose 'any' e 'maskable' em entries separados: o ícone maskable precisa de
				// safe zone própria; combinar os dois faria o Android recortar o ícone comum.
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
					{ src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			// O adapter-static grava o fallback direto em build/ DEPOIS do sw.js ser gerado,
			// então o glob do workbox nunca o vê; `spa: true` injeta a entry 'index.html' no
			// precache manualmente (revision = hash do _app/version.json). O navigateFallback
			// precisa apontar exatamente para essa entry, senão o app funciona online e
			// quebra offline em rota profunda.
			kit: { adapterFallback: 'index.html', spa: true },
			// skipWaiting/clientsClaim: com injectRegister:false o plugin NÃO aplica o par
			// automático do autoUpdate — sem eles o SW novo não assume as abas abertas.
			workbox: { navigateFallback: 'index.html', skipWaiting: true, clientsClaim: true },
			devOptions: {
				// SW registrável no `vite dev` (útil para testar via túnel). Efeito colateral:
				// um SW ativo pode fazer o HMR parecer travado — ver Troubleshooting no README.
				enabled: true,
				suppressWarnings: true,
				navigateFallbackAllowlist: [/^\/$/]
			}
		})
	],
	server: {
		host: true,
		port: 5173,
		// Vite bloqueia Host desconhecido (proteção contra DNS rebinding); sem isso o
		// túnel do cloudflared (README) e o acesso via host.docker.internal levam 403.
		// IPs de LAN não precisam constar — Host numérico é sempre aceito.
		allowedHosts: ['.trycloudflare.com', 'host.docker.internal'],
		// Eventos de filesystem não atravessam o bind mount do Docker no macOS/Windows
		watch: { usePolling: true, interval: 300 },
		hmr: { clientPort: 5173 }
		// HTTPS local com mkcert (opção 2 do README): gere os certs, monte ./certs no
		// docker-compose.yml e descomente (junto com o import de node:fs no topo):
		// https: {
		// 	key: fs.readFileSync('./certs/key.pem'),
		// 	cert: fs.readFileSync('./certs/cert.pem')
		// }
	},
	test: {
		expect: { requireAssertions: true },
		// Sem testes até a Fase 1 (domínio); não falhar por ausência de arquivos
		passWithNoTests: true,
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
