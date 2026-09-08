# Cuida+ — PWA de Registro de Cuidados

PWA mobile-first para cuidadores registrarem os cuidados diários de seus pacientes:
rotinas agendadas, linha do tempo do que foi feito e alertas automáticos de esquecimento
ou de aferição fora do padrão. Especificação completa em [SPEC-cuidador-pwa.md](./SPEC-cuidador-pwa.md).

**Stack**: SvelteKit 2 · Svelte 5 (runes) · TypeScript strict · Tailwind CSS 4 · Dexie (IndexedDB)
· vite-plugin-pwa · LayerChart · date-fns · Vitest. O frontend SvelteKit PWA é publicado na Vercel
e usa o backend Spring Boot/Java 21 em `backend/` por meio do OCI API Gateway público. O backend
roda em OCI Compute e persiste os fluxos de produção no Oracle Autonomous Database, no schema
`CUIDA_APP`. Os mocks ficam restritos a testes e fixtures de desenvolvimento; Dexie/IndexedDB
serve como cache e estado do cliente, não como fonte de verdade dos dados de domínio em produção.

## Como rodar localmente

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose v2)
para o fluxo de desenvolvimento do frontend. O backend possui instruções próprias em
[`backend/README.md`](./backend/README.md) e usa H2 no perfil de desenvolvimento; o perfil de produção usa Oracle.

```sh
git clone https://github.com/OsCaraDaEngenhariaFiap/cuida-mais.git
cd cuida-mais
docker compose up web          # primeira vez demora: baixa a imagem e instala as dependências
```

Abra <http://localhost:5173>. Para o build de produção (service worker, instalável, offline):

```sh
docker compose up preview      # http://localhost:8080
```

Para testar o frontend local, configure `PUBLIC_API_BASE_URL` apontando para uma API disponível.
O cadastro e o login são feitos pelo backend. Fixtures e login de demonstração permanecem disponíveis
somente nos testes/ambientes locais baseados em mock.

Testes e checagem de tipos:

```sh
docker compose run --rm web npm run test    # Vitest (domínio + serviços mock)
docker compose run --rm web npm run check   # svelte-check
```

Para parar: `docker compose down`.

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
    services/      # camada única de acesso: API em produção, mocks em testes/dev
    stores/        # runes e stores nativos
    components/
  routes/
    login/ · cadastro/      # públicas
    (app)/                  # grupo protegido, com bottom tab bar
    r/[token]/              # visão somente leitura do responsável
```

Fases de execução e critérios de aceite: §9 da [spec](./SPEC-cuidador-pwa.md).
