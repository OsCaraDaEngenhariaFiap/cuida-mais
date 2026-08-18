# Cuida+ — PWA de Registro de Cuidados

PWA mobile-first para cuidadores registrarem os cuidados diários de seus pacientes:
rotinas agendadas, linha do tempo do que foi feito e alertas automáticos de esquecimento
ou de aferição fora do padrão. Especificação completa em [SPEC-cuidador-pwa.md](./SPEC-cuidador-pwa.md).

**Stack**: SvelteKit 2 · Svelte 5 (runes) · TypeScript strict · Tailwind CSS 4 · Dexie (IndexedDB)
· vite-plugin-pwa · LayerChart · date-fns · Vitest. App 100% client-side (`adapter-static`,
sem backend nesta fase — tudo mockado localmente).

## Desenvolvimento (Docker)

Todo o desenvolvimento roda em container — **não precisa de Node na máquina**.

| Comando | O quê |
| --- | --- |
| `docker compose up web` | Dev com HMR em <http://localhost:5173> |
| `docker compose up preview` | Build de produção (nginx) em <http://localhost:8080> |
| `docker compose run --rm web npm run test` | Vitest dentro do container |
| `docker compose run --rm web npm i <pkg>` | Instalar dependência |
| `docker compose build --no-cache` | Rebuild após mudar dependências |

Após instalar dependência nova, rode `docker compose build` para a imagem incorporar o
`package.json` atualizado.

## Testar o PWA no celular (precisa de HTTPS)

Service worker e instalação só funcionam em **contexto seguro**. `localhost` conta;
o IP da LAN (`http://192.168.x.x:5173`) **não** — o app abre, mas não instala e não
registra o service worker. Duas saídas, nessa ordem de preferência:

### 1. Túnel (recomendado)

```sh
docker compose up web
cloudflared tunnel --url http://localhost:5173
```

O `cloudflared` imprime uma URL `https://…trycloudflare.com` — abra no celular.
HTTPS válido, funciona em qualquer rede, zero configuração de certificado.

### 2. mkcert (certificado local)

1. Na máquina: `mkcert -install && mkdir -p certs && mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 192.168.x.x` (use o IP da sua LAN).
2. Descomente o bloco `server.https` (e o import de `node:fs`) no [vite.config.ts](./vite.config.ts).
3. Descomente o volume `./certs` no [docker-compose.yml](./docker-compose.yml).
4. Instale a CA do mkcert no celular (`mkcert -CAROOT` mostra o arquivo `rootCA.pem`; envie ao aparelho e instale como certificado confiável).
5. `docker compose up web` e acesse `https://192.168.x.x:5173` no celular.

## Troubleshooting

- **HMR parece travado no dev**: o `devOptions.enabled: true` do vite-plugin-pwa deixa um
  service worker ativo também no `vite dev`. Se a página parar de refletir mudanças sem
  motivo, desregistre-o: DevTools → Application → Service Workers → **Unregister** + hard
  reload (Cmd/Ctrl+Shift+R).
- **Mudou dependência e o container não achou**: o `node_modules` do container vive num
  volume anônimo — rode `docker compose build` e suba de novo.

## Estrutura

```
src/
  lib/
    domain/        # regras puras (alertas, baseline) — TypeScript sem Svelte, testável
    services/      # única camada que fala com storage (mock Dexie nesta fase)
    stores/        # runes e stores nativos
    components/
  routes/
    login/ · cadastro/      # públicas
    (app)/                  # grupo protegido, com bottom tab bar
    r/[token]/              # visão somente leitura do responsável
```

Fases de execução e critérios de aceite: §9 da [spec](./SPEC-cuidador-pwa.md).
