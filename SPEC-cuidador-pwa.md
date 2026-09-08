# SPEC — PWA de Registro de Cuidados (v2)

> Documento de planejamento para execução pelo Claude Code.
> Fase atual: **tudo mockado** (sem backend real).
> v2 incorpora as decisões de produto da rodada de perguntas (ver §2).

> **Nota de histórico:** esta é a especificação original da fase pré-backend. As referências a
> “tudo mockado”, “sem backend” e backend fora de escopo descrevem a implementação inicial e foram
> preservadas para manter o histórico do produto. A implementação final evoluiu para um backend real
> em Spring Boot/Java 21, com persistência Oracle no schema `CUIDA_APP`. Para o estado atual, consulte
> o [README](./README.md), o código-fonte e os documentos finais da entrega.

---

## 1. Objetivo

PWA (Progressive Web App — aplicação web instalável que roda como app no celular) mobile-first
para cuidadores registrarem e não esquecerem os cuidados de cada paciente:
rotinas agendadas, linha do tempo do que foi feito, e alertas automáticos de
esquecimento ou de aferição fora do padrão.

**Stack**:
SvelteKit 2 + Svelte 5 (runes) + TypeScript (strict) + Tailwind CSS + Dexie (IndexedDB)
+ `vite-plugin-pwa`. Gráficos com LayerChart. Datas com `date-fns`. Testes com Vitest.

App **100% client-side**: `adapter-static`, com `export const ssr = false` e
`export const prerender = false` no layout raiz. Rotas são file-based (sem React Router).
Estado com runes (`$state`, `$derived`) e stores nativos (sem Zustand).
Ambiente containerizado — Docker para dev (Vite com HMR) e para preview de produção
(nginx servindo o estático). Ver §11.

---

## 2. Decisões de produto (fechadas)

| Tema | Decisão |
|---|---|
| Contexto | Cuidador autônomo, 1–3 pacientes |
| Relação | **1 paciente = 1 cuidador** (1:N). Sem turno, sem passagem de plantão |
| Quem vê | O cuidador (completo) + responsável/família (**somente leitura, via link**) |
| Medicação | Guarda dose, via, início/fim do tratamento e **estoque da caixa**. Sem SOS |
| Registro atrasado | Permitido, **exige justificativa** |
| Foto | **Obrigatória em medicação** (com escape: registrar sem foto exigindo justificativa) |
| Notificações | **Lembrete antes** do horário + **no horário exato**. Não insiste depois |
| Login | E-mail e senha sempre. Sem PIN, sem biometria |

### Papéis

- **Cuidador**: único usuário autenticado. Login/cadastro, gerencia seus pacientes,
  registra eventos, reconhece alertas, gera link para a família.
- **Responsável**: não tem conta. Acessa `/r/:token` — visão somente leitura do dia.

### Fora de escopo nesta fase

Backend real, push remoto, conta para a família, multi-cuidador, medicação SOS,
painel de gestor. **LGPD** (Lei Geral de Proteção de Dados): são dados de saúde —
tratar antes de qualquer produção.

---

## 3. Modelo de dados (TypeScript)

```ts
type UUID = string;
type ISODate = string; // ISO 8601

interface Caregiver {
  id: UUID;
  nome: string;
  email: string;
  senhaHash: string;       // mock: hash simples, não é segurança real
  fotoUrl?: string;
  criadoEm: ISODate;
}

interface Patient {
  id: UUID;
  caregiverId: UUID;              // 1 paciente = 1 cuidador
  nome: string;
  dataNascimento: ISODate;        // idade é derivada, nunca armazenada
  fotoUrl?: string;
  localizacao?: string;           // ex: "Quarto 102"
  responsavel?: { nome: string; parentesco?: string; telefone?: string };
  alergias?: string[];
  condicoes?: string[];           // ex: "Alzheimer", "Diabetes tipo 2"
  observacoes?: string;
  ativo: boolean;
  criadoEm: ISODate;
}

type TipoCuidado = 'medicacao' | 'refeicao' | 'medicao' | 'higiene' | 'atividade' | 'outro';

// Rotina = o que DEVE acontecer (agendamento recorrente)
interface CareTask {
  id: UUID;
  patientId: UUID;
  tipo: TipoCuidado;
  titulo: string;                 // "Losartana 50mg"
  descricao?: string;
  horarios: string[];             // ["08:00", "20:00"]
  diasSemana: number[];           // 0=dom … 6=sáb
  toleranciaMin: number;          // default 30
  lembreteAntesMin: number;       // default 15 (ver §7)
  measurementTypeIds?: UUID[];    // obrigatório quando tipo = 'medicao'
  medicacao?: MedicationDetails;  // obrigatório quando tipo = 'medicacao'
  ativo: boolean;
}

interface MedicationDetails {
  dose: string;                   // "50 mg", "10 gotas", "1 comprimido"
  via: 'oral' | 'sublingual' | 'topica' | 'inalatoria' | 'ocular' | 'nasal'
     | 'retal' | 'subcutanea' | 'intramuscular' | 'sonda' | 'outra';
  inicioTratamento: ISODate;
  fimTratamento?: ISODate;        // ausente = uso contínuo
  estoque?: {
    quantidadeAtual: number;      // unidades restantes na caixa
    unidade: string;              // "comprimidos", "mL", "gotas"
    consumoPorDose: number;       // debitado a cada registro realizado
    alertarAbaixoDe: number;      // default: 3 dias de consumo
  };
}

// Evento = o que ACONTECEU (linha do tempo)
interface CareEvent {
  id: UUID;
  patientId: UUID;
  taskId?: UUID;                  // ausente = registro avulso
  tipo: TipoCuidado;
  titulo: string;
  observacao?: string;
  ocorridoEm: ISODate;            // quando o cuidado aconteceu de fato
  registradoEm: ISODate;          // quando foi digitado no app
  registradoPor: UUID;            // caregiverId
  status: 'realizado' | 'atrasado' | 'pulado';
  motivoPulo?: string;
  fotoUrl?: string;               // base64; obrigatória em tipo='medicacao'
  justificativaSemFoto?: string;  // exigida se medicação registrada sem foto
  justificativaRetroativa?: string; // exigida se ocorridoEm < registradoEm − 30min
  editadoEm?: ISODate;            // trilha de correção
  motivoEdicao?: string;
}
```

### 3.1 Catálogo aberto de aferições

Sinais vitais são só o conjunto padrão. O cuidador pode criar quantas aferições quiser
(dor, diurese, humor, ingestão hídrica, sono, evacuação) **sem alterar código**.

```ts
interface MeasurementType {
  id: UUID;
  slug: string;                   // 'fc', 'pa', 'dor', 'diurese'
  nome: string;                   // "Frequência cardíaca"
  icone: string;
  campos: MeasurementField[];     // 1 campo = simples; 2+ = composto (ex: pressão arterial)
  alertaSemRegistroHoras?: number;// ex: 72 em "evacuação"
  sistema: boolean;               // pré-cadastrado, não deletável (só desativável)
  ativo: boolean;
}

interface MeasurementField {
  chave: string;                  // 'valor' | 'sistolica' | 'diastolica'
  rotulo: string;
  formato: 'numero' | 'escala' | 'booleano' | 'opcoes' | 'texto';
  unidade?: string;               // bpm, mmHg, °C, %, mL, kg
  casasDecimais?: number;
  escala?: { min: number; max: number };          // 'escala' — ex: dor 0–10
  opcoes?: string[];                              // 'opcoes' — ex: Bristol 1–7
  faixaNormal?: { min?: number; max?: number };   // opcional (ver §4.2a)
  pisoDesvio?: number;                            // opcional (ver §4.2b)
  valorEsperado?: string | boolean;               // 'booleano'/'opcoes' (ver §4.2c)
}

// Uma aferição gera 1 CareEvent + N Reading (uma por campo).
// Cada campo é uma SÉRIE HISTÓRICA INDEPENDENTE — sistólica e diastólica
// têm baselines separadas.
interface Reading {
  id: UUID;
  patientId: UUID;
  eventId: UUID;
  measurementTypeId: UUID;
  campo: string;                  // chave do MeasurementField
  valorNum?: number;              // numero | escala | booleano (0/1)
  valorTexto?: string;            // opcoes | texto
  aferidoEm: ISODate;
  foraDoPadrao: boolean;          // calculado na gravação
  motivoDesvio?: 'faixa' | 'baseline' | 'esperado';
}
```

**Catálogo padrão do seed (`sistema: true`)**

| Slug | Nome | Campos | Formato |
|---|---|---|---|
| `fc` | Frequência cardíaca | valor (bpm) | numero |
| `pa` | Pressão arterial | sistólica, diastólica (mmHg) | numero ×2 |
| `temp` | Temperatura | valor (°C) | numero |
| `spo2` | Saturação de oxigênio | valor (%) | numero |
| `glicemia` | Glicemia | valor (mg/dL) | numero |
| `peso` | Peso | valor (kg) | numero |
| `dor` | Nível de dor | valor (0–10) | escala |
| `evacuacao` | Evacuação | ocorreu, consistência | booleano + opcoes |
| `diurese` | Diurese | volume (mL) | numero |
| `hidratacao` | Ingestão hídrica | volume (mL) | numero |
| `humor` | Humor / disposição | valor | opcoes |

### 3.2 Alertas e compartilhamento

```ts
interface Alert {
  id: UUID;
  patientId: UUID;
  tipo: 'medicacao_atrasada' | 'tarefa_pendente' | 'sinal_fora_padrao'
      | 'sem_registro' | 'estoque_baixo';
  severidade: 'critico' | 'atencao';
  titulo: string;
  detalhe: string;                // "FC 140 bpm — média habitual 88 bpm"
  referenciaId?: UUID;            // taskId ou readingId
  criadoEm: ISODate;
  reconhecidoEm?: ISODate;
  reconhecidoPor?: UUID;
}

interface ShareLink {
  token: string;                  // 24 chars, URL-safe
  patientId: UUID;
  criadoPor: UUID;
  criadoEm: ISODate;
  expiraEm: ISODate;              // default: +7 dias
  escopo: 'dia_atual';            // única opção nesta fase
  revogado: boolean;
  ultimoAcessoEm?: ISODate;
}
```

---

## 4. Motor de alertas (núcleo do produto)

Fica em `src/lib/domain/alerts/`. Funções **puras e testáveis**, sem dependência de UI.
Reavaliado: ao abrir o app, ao salvar um evento, e a cada 60s por timer.

### 4.1 Tarefa atrasada / esquecida

Cada horário previsto de hoje de uma `CareTask` ativa gera uma "ocorrência esperada".

| Condição | Resultado |
|---|---|
| Existe `CareEvent` com o `taskId` em `[horário − 30min, horário + tolerância]` | OK |
| Passou `horário + tolerância` sem evento | `atencao` — "Tarefa pendente" |
| Passou `horário + 60min` sem evento e tipo = `medicacao` | `critico` — "Medicação atrasada" |
| Evento registrado após a tolerância | Salvo com `status: 'atrasado'` + justificativa; alerta resolvido |

Tarefa fora do intervalo `inicioTratamento`–`fimTratamento` não gera ocorrência.

### 4.2 Aferição fora do padrão

O motor **não conhece métrica nenhuma por nome**. Recebe um `Reading` + o
`MeasurementField` e decide pelo `formato`. Aferição criada pelo cuidador entra
no mesmo caminho, sem código novo.

| Formato | Camadas aplicáveis |
|---|---|
| `numero`, `escala` | a + b |
| `booleano`, `opcoes` | c |
| `texto` | nenhuma — nunca gera alerta |

**a) Faixa absoluta** — só roda se o campo tiver `faixaNormal`.

| Campo | Faixa | Fora → |
|---|---|---|
| fc.valor | 50–110 bpm | `critico` |
| pa.sistolica | 90–160 mmHg | `critico` |
| pa.diastolica | 50–100 mmHg | `critico` |
| spo2.valor | ≥ 92 % | `critico` |
| temp.valor | 35.5–37.7 °C | `atencao` |
| glicemia.valor | 70–200 mg/dL | `atencao` |
| dor.valor | ≤ 3 | `atencao` |

Aferição customizada sem `faixaNormal` continua funcionando — cai só na camada (b).

**b) Desvio da linha de base do paciente** — resolve "90, 90, 88, 92… e agora 140",
para qualquer campo numérico ou de escala:

1. Últimas **10** leituras do mesmo `patientId` + `measurementTypeId` + `campo`
   (excluindo a atual). Séries por campo: sistólica não se mistura com diastólica.
2. Menos de **4** leituras → pular (amostra insuficiente).
3. Calcular média e desvio-padrão (σ).
4. **Piso de σ**, para não alertar em paciente muito estável:
   - `pisoDesvio` do campo, se configurado;
   - **senão, derivar**: `max(σ, 8% da média, menor incremento do campo)`.
     É o que faz uma aferição nova funcionar sem ajuste manual.
   - `σ_efetivo = max(σ, piso)`.
5. `|valor − média| > 2 × σ_efetivo` → `atencao`, com valor, média e nº de amostras.
6. `> 3 × σ_efetivo` → `critico`.

> Exemplo: média 90, σ=1.6, piso = 8% de 90 = 7.2 → limite 2σ = ±14.4 → 140 dispara `critico`.

**c) Valor esperado** — campos `booleano`/`opcoes` com `valorEsperado`.
Registro diferente do esperado → `atencao`.

### 4.3 Aferição sem registro há tempo demais

`MeasurementType` com `alertaSemRegistroHoras`: última leitura mais antiga que o limite
→ `atencao`. Cobre o que não tem horário fixo ("não evacua há 3 dias").

### 4.4 Estoque baixo

A cada registro de medicação realizada, debitar `consumoPorDose` de `quantidadeAtual`.
Quando `quantidadeAtual ≤ alertarAbaixoDe` → `atencao` — "Losartana acaba em ~2 dias".
Botão "Repor caixa" no alerta abre o campo de quantidade.

### 4.5 Deduplicação

Não criar alerta novo se já existir um do mesmo `tipo` + `referenciaId` não reconhecido.

---

## 5. Telas

| Rota | Tela | Conteúdo |
|---|---|---|
| `/login` | Login | e-mail + senha, link p/ cadastro |
| `/cadastro` | Cadastro | nome, e-mail, senha, foto opcional |
| `/` | Dashboard | resumo do dia: pendências, alertas críticos, próximos horários, atalho por paciente |
| `/pacientes` | Lista | busca, card com foto/nome/local, badge de alertas e pendências |
| `/pacientes/novo` · `/pacientes/:id/editar` | Formulário | nome, nascimento, foto, localização, responsável, alergias, condições |
| `/pacientes/:id` | Detalhe | header + abas: **Linha do Tempo**, **Rotinas**, **Aferições**, **Perfil** |
| `/pacientes/:id/registrar` | Registro rápido | escolhe tipo → formulário curto → salva |
| `/pacientes/:id/compartilhar` | Compartilhar | gera/revoga link do responsável, mostra validade |
| `/alertas` | Alertas | lista global por severidade, ação "Reconhecer" |
| `/relatorio/:id` | Relatório do dia | timeline consolidada + contadores + compartilhar |
| `/configuracoes` | Configurações | perfil, tolerância padrão, lembrete padrão, catálogo de aferições, sair |
| `/configuracoes/afericoes` | Catálogo | criar/editar tipo: nome, ícone, campos, formato, unidade, faixa, valor esperado |
| `/r/:token` | **Visão do responsável** | somente leitura, sem login — ver §6 |

**Navegação:** bottom tab bar (Dashboard · Pacientes · Alertas · Config)
+ FAB (botão flutuante) de registro rápido dentro do paciente.
As rotas acima são file-based; tudo exceto `/login`, `/cadastro` e `/r/[token]`
fica dentro do grupo protegido `(app)/`.

**Linha do Tempo:** replica o mockup — horário à esquerda, ícone colorido por tipo,
card com título + subtítulo + quem executou, linha vertical conectando.
Agrupada por dia, com seletor de data. Evento atrasado ganha selo laranja;
evento com foto mostra miniatura.

**Aba Aferições:** um card por campo já registrado para aquele paciente — a tela é gerada
a partir dos dados, nunca de lista fixa no código.
`numero`/`escala` → gráfico de linha (7/30 dias), pontos fora do padrão em vermelho e
faixa normal sombreada. `booleano`/`opcoes` → grade de frequência por dia.
`texto` → lista cronológica.

### 5.1 Registro de medicação (fluxo com foto)

1. Toca na tarefa pendente → tela de confirmação com nome, dose, via.
2. Câmera abre direto. Foto é obrigatória por padrão.
3. Link secundário "Registrar sem foto" → exige `justificativaSemFoto` (texto curto,
   com sugestões rápidas: "mãos ocupadas", "paciente recusou câmera", "sem bateria").
4. Se `ocorridoEm` for mais de 30 min no passado → exige `justificativaRetroativa`.
5. Salva, debita estoque, resolve o alerta.

> Flag `fotoObrigatoriaMedicacao` em Configurações (default `true`) permite desligar por completo.

### 5.2 Edição de registro

Registro pode ser corrigido, nunca apagado silenciosamente. Editar exige `motivoEdicao`
e grava `editadoEm`. O card na timeline mostra "editado". Excluir só marca `status: 'pulado'`.

---

## 6. Visão do responsável (`/r/:token`)

Página pública, sem login, sem bottom bar, sem ação de escrita.

- Mostra: nome e foto do paciente, data, linha do tempo do **dia atual**, contadores
  do resumo, e um aviso quando há alerta crítico não resolvido.
- **Não mostra**: outros pacientes, histórico de outros dias, dados do cuidador,
  observações marcadas como internas.
- Token expira em 7 dias; o cuidador pode revogar a qualquer momento.
- Botão "Compartilhar" usa a Web Share API (WhatsApp, e-mail) com fallback de copiar link.
- Token inválido/expirado/revogado → página neutra "Link indisponível", sem vazar existência do paciente.

---

## 7. PWA e notificações

- `static/manifest.webmanifest`: ícones 192/512 + maskable, `display: standalone`,
  `orientation: portrait`, tema azul-marinho do mockup.
- Service worker via `vite-plugin-pwa` (`registerType: 'autoUpdate'`), precache do app shell.
  Alternativa nativa do SvelteKit: `src/service-worker.ts` com `$service-worker`
  (`build`, `files`, `version`) — escolha uma das duas, não as duas.
- **Offline-first**: tudo é local (IndexedDB), funciona offline por natureza.
  Campo `sincronizado: boolean` nos registros, preparando a fase de backend.
- Fotos em base64 com **compressão obrigatória antes de salvar** (max 1024px, JPEG q0.7) —
  sem isso o IndexedDB estoura em semanas de uso.

**Regra de notificação** (decisão §2): dois disparos por ocorrência, e só isso.

| Momento | Notificação |
|---|---|
| `horário − lembreteAntesMin` (default 15) | "Em 15 min: Losartana 50mg — Maria" |
| `horário` exato | "Agora: Losartana 50mg — Maria" |
| depois do horário | **nenhuma notificação** — vira alerta in-app (§4.1) |

Implementação: `Notification API` + timers agendados no service worker enquanto o app
está aberto ou em background. Push remoto fica para a fase 2 (no iOS exige o PWA
instalado na tela de início). Prompt de instalação customizado via `beforeinstallprompt`.

---

## 8. Arquitetura de mock

Regra: **a UI nunca fala com storage direto**. Só com a camada de serviço.

```
src/
  lib/
    domain/        # tipos, regras, cálculos — sem Svelte, 100% testável
      alerts/
      measurements/
      schedule/
    services/
      types.ts     # interfaces Auth/Patient/Task/Event/Alert/ShareService
      mock/        # implementação Dexie + seed
      index.ts     # exporta a implementação ativa (troca única no futuro)
    stores/        # runes e stores nativos
    components/
  routes/
    +layout.svelte          # shell + bottom tab bar
    +layout.ts              # ssr = false, prerender = false
    login/ · cadastro/
    (app)/                  # grupo protegido
      +layout.ts            # guarda de sessão
      +page.svelte          # dashboard
      pacientes/[id]/…
      alertas/ · configuracoes/ · relatorio/[id]/
    r/[token]/+page.svelte  # visão do responsável — FORA do grupo protegido
  service-worker.ts
static/
  manifest.webmanifest, icons/
```

> `src/lib/domain/` não pode importar nada de `svelte` nem de `$app`. É TypeScript puro —
> é o que garante que as regras de alerta sejam testáveis sem montar componente.

**Seed obrigatório** (bate com o mockup e já exercita todos os alertas no primeiro boot):

- Cuidador demo: `joao@demo.com` / `123456`, nome "João".
- **Maria Silva**, 78 anos, Quarto 102, responsável "Ana Silva (filha)".
  Eventos do dia: café 08:00, medicação 08:15, aferição 09:20 (PA 120x80, FC 72),
  observação de tontura 10:30, médico informado 11:00, almoço 12:10.
- Paciente 2 com **medicação atrasada** há 70 min → alerta crítico.
- Paciente 3 com FC 88/90/91/89 e uma leitura de **140** → alerta de desvio (camada b).
- Uma aferição **customizada** ("Diurese (mL)", fora do catálogo padrão) com 5 leituras
  e uma discrepante — prova que o motor não depende de métrica conhecida.
- Uma medicação com **estoque em 4 comprimidos** e `alertarAbaixoDe: 6` → alerta de estoque.
- Um `ShareLink` ativo para Maria Silva, para testar `/r/:token`.
- Botão "Resetar dados de demonstração" em Configurações.

---

## 9. Fases de execução

Uma fase por vez, validando o critério de aceite antes de seguir.

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **0** | Scaffold SvelteKit + adapter-static + Tailwind, PWA, Docker (§11), design tokens, bottom tab bar, rotas vazias | `docker compose up web` sobe com HMR; `docker compose up preview` serve o build; app instalável; Lighthouse PWA verde |
| **1** | Tipos do domínio + camada de serviço + Dexie + seed completo | Seed carrega no primeiro boot; reset funciona |
| **2** | Auth mock: login, cadastro, sessão persistida, guarda em `(app)/+layout.ts` | Login demo entra; rota protegida redireciona |
| **3** | CRUD de pacientes + lista + perfil + foto comprimida | Criar/editar/arquivar persiste após reload |
| **4** | Catálogo de aferições: CRUD + formulário dinâmico por `formato` | Criar "Diurese (mL)" pela UI e registrar leitura, sem tocar em código |
| **5** | Rotinas: CRUD, medicação com dose/via/período/estoque, próximos horários | Rotina com 2 horários aparece no dashboard; fora do período não aparece |
| **6** | Linha do tempo + registro rápido + fluxo de foto/justificativa (§5.1) | Timeline do mockup renderizada; medicação sem foto exige justificativa |
| **7** | Motor de alertas (§4.1–4.5) + tela de alertas + badges | Testes unitários passando, **incluindo métrica criada em runtime**; seed gera os 5 tipos de alerta |
| **8** | Dashboard, aba de aferições com gráficos, relatório do dia | Contadores batem; gráfico marca ponto fora do padrão |
| **9** | Link do responsável `/r/:token` + Web Share + revogação | Link aberto em aba anônima mostra só o dia; revogado mostra página neutra |
| **10** | Notificações locais (lembrete + horário), instalação, estados vazios, polimento | Notificação dispara 15 min antes com o app em background |

**Testes:** Vitest em `src/lib/domain/` — obrigatório nas fases 4, 5 e 7. UI sem testes nesta fase.

---

## 10. Direção visual

Baseada no mockup: nav azul-marinho escuro (`#152A47` aprox.), fundo branco,
cards com borda sutil e canto 12–16px, tipografia arredondada e generosa.
Contexto real: cuidador com pressa, celular numa mão, às vezes de luva.

- Alvo de toque mínimo 48px; ações primárias na metade inferior da tela.
- Semântica de cor: verde = realizado · azul = medicação/aferição · laranja = atenção ·
  vermelho = crítico · roxo = comunicação.
- Todo estado vazio precisa de ação óbvia ("Nenhum paciente ainda — cadastrar o primeiro").
- Tema escuro na fase 10.

---

## 11. Docker

Dois alvos no mesmo `Dockerfile` multi-stage: `dev` (Vite com HMR) e `prod`
(estático servido por nginx). Ambos entram já na Fase 0.

### 11.1 Estrutura

```
Dockerfile          # stages: base → dev → build → prod
docker-compose.yml  # serviço "web" (dev) e "preview" (prod local)
.dockerignore       # node_modules, .svelte-kit, build, .git, *.md
```

- **base**: `node:22-alpine`, `WORKDIR /app`, instala dependências a partir de
  `package*.json` (camada cacheada antes de copiar o código).
- **dev**: `npm run dev -- --host 0.0.0.0 --port 5173`.
- **build**: `npm run build` → gera `build/`.
- **prod**: `nginx:alpine` copiando só `build/`.

### 11.2 Pontos que quebram se ignorados

**Bind mount + node_modules.** Montar `.:/app` sobrepõe o `node_modules` do container
pelo do host. Usar volume anônimo em cima:

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

**Hot reload no macOS e Windows.** Eventos de filesystem não atravessam o bind mount.
No `vite.config.ts`:

```ts
server: {
  host: true,
  port: 5173,
  watch: { usePolling: true, interval: 300 },
  hmr: { clientPort: 5173 }
}
```

**Fallback de SPA.** `adapter-static` com rotas dinâmicas (`[id]`, `[token]`) **exige**
`fallback: 'index.html'` no `svelte.config.js`. Sem isso, `/pacientes/abc` dá 404 no
nginx. E no nginx:

```nginx
location / { try_files $uri $uri/ /index.html; }
```

**Cache do service worker.** No nginx, `index.html` e `service-worker.js` com
`Cache-Control: no-cache`; `/_app/immutable/` com `max-age=31536000, immutable`.
Errar isso deixa o usuário preso numa versão antiga do app.

### 11.3 HTTPS para testar o PWA no celular

Service worker e notificações só funcionam em **contexto seguro**. `localhost` conta;
o IP da LAN (`http://192.168.x.x:5173`) **não** — o app abre, mas não instala e não
registra o service worker.

Duas saídas, nessa ordem de preferência:

1. **Túnel**: `cloudflared tunnel --url http://localhost:5173`. Dá HTTPS válido,
   funciona em qualquer celular, zero configuração de certificado.
2. **mkcert**: gerar certificado local, montar em `./certs` e apontar
   `server.https` no Vite. Exige instalar a CA no celular.

Documentar as duas no README. O `docker-compose.yml` deve deixar `./certs` mapeado
e comentado, pronto para a opção 2.

### 11.4 Comandos

| Comando | O quê |
|---|---|
| `docker compose up web` | Dev com HMR em `http://localhost:5173` |
| `docker compose up preview` | Build de produção em `http://localhost:8080` |
| `docker compose run --rm web npm run test` | Vitest dentro do container |
| `docker compose build --no-cache` | Rebuild após mudar dependências |
