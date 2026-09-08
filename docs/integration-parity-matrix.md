# Paridade de persistência da UI

Matriz interna da branch `integration/full-oracle-parity`. Em produção, `apiServices` é a implementação ativa no browser; `mockServices` permanece para testes e fixtures locais.

| Capacidade usada pela UI | Contrato | Persistência/API | Adaptador |
|---|---|---|---|
| Sessão | `auth` | `/auth/register`, `/auth/login`, JWT em localStorage | token JWT -> `Caregiver` |
| Pacientes | `patients` | `/api/pessoas` com dono em `Pessoa.usuario` | campos compostos -> colunas |
| Rotinas/medicação | `tasks` | `/api/pessoas/{id}/rotinas`, `/api/rotinas/{id}` | schedules/medicação serializados no agregado da rotina |
| Linha do tempo/notas | `events` | `/api/registros/pessoas/{id}/notas`, `/api/notas/{id}` | nota -> `CareEvent` |
| Aferições | `measurements` | `/api/tipos-afericao`, `/api/pessoas/{id}/leituras` | IDs numéricos isolados no serviço |
| Alertas | `alerts` | `/api/alertas` e reconhecimento por usuário | deduplicação no backend |
| Compartilhamento | `share` | `/api/pessoas/{id}/compartilhamento` e resolver público | token opaco, expiração e revogação |
| Reset demo | `demo` | não disponível na API de produção | somente mock/dev |

Fluxos sem rota utilizável no produto continuam fora do escopo desta integração; não são simulados pelo adaptador de produção.
