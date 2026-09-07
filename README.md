# 🌱 Safra Certa API

Sistema de recomendação agrícola desenvolvido em Java com Spring Boot, capaz de fornecer recomendações de culturas agrícolas com base em informações de região, clima, solo e pH.

---

# Objetivo

O projeto tem como finalidade auxiliar produtores rurais na tomada de decisão sobre quais culturas possuem maior compatibilidade com determinada região, considerando fatores ambientais e climáticos.

A aplicação disponibiliza uma API REST protegida por autenticação JWT e documentada através do Swagger/OpenAPI.

---

# Tecnologias Utilizadas

* Java 21
* Spring Boot
* Spring Security
* JWT (JSON Web Token)
* Spring Data JPA
* Hibernate
* Banco de Dados H2
* Swagger / OpenAPI
* Lombok
* Maven

---

# Arquitetura do Projeto

```text
src/main/java/com/safra/certa

├── config
│   ├── SecurityConfig
│   ├── JwtFilter
│   ├── SwaggerConfig
│   └── DataLoader
│
├── controller
│   ├── AuthController
│   ├── RegiaoController
│   ├── CulturaController
│   ├── ClimaController
│   └── RecomendacaoController
│
├── dto
│   ├── LoginRequest
│   ├── RegisterRequest
│   ├── RecomendacaoRequest
│   ├── RecomendacaoResponse
│   └── MensagemAnaliseDTO
│
├── entity
│   ├── Usuario
│   ├── Regiao
│   ├── Cultura
│   ├── Clima
│   └── Recomendacao
│
├── repository
│   ├── UsuarioRepository
│   ├── RegiaoRepository
│   ├── CulturaRepository
│   ├── ClimaRepository
│   └── RecomendacaoRepository
│
├── security
│   └── JwtService
│
└── service
    ├── AuthService
    ├── RegiaoService
    ├── CulturaService
    ├── ClimaService
    └── RecomendacaoService
```

---

# Como Executar

## Clonar o projeto

```bash
git clone https://github.com/seu-repositorio/safra-certa.git
```

## Acessar o diretório

```bash
cd safra-certa
```

## Compilar

```bash
mvn clean install
```

## Executar

```bash
mvn spring-boot:run
```

A aplicação ficará disponível em:

```text
http://localhost:8080
```

---

# Banco de Dados H2

Console:

```text
http://localhost:8080/h2-console
```

Configuração:

```text
JDBC URL: jdbc:h2:mem:testdb
User: sa
Password:
```

---

# Swagger

Documentação da API:

```text
http://localhost:8080/swagger
```

ou

```text
http://localhost:8080/swagger-ui/index.html
```

---

# Autenticação JWT

Todos os endpoints, exceto login e cadastro, exigem autenticação.

Header obrigatório:

```http
Authorization: Bearer <TOKEN>
```

---

# Fluxo de Teste

## 1 - Cadastrar Usuário

Endpoint:

```http
POST /auth/register
```

Body:

```json
{
  "nome": "Murillo",
  "email": "murillo@safra.com",
  "senha": "123456"
}
```

---

## 2 - Realizar Login

Endpoint:

```http
POST /auth/login
```

Body:

```json
{
  "email": "murillo@safra.com",
  "senha": "123456"
}
```

Resposta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

Copie o token retornado.

---

## 3 - Autorizar no Swagger

Clique em:

```text
Authorize
```

Informe:

```text
Bearer eyJhbGciOiJIUzI1NiJ9...
```

Após isso todos os endpoints protegidos poderão ser testados.

---

# Endpoints Disponíveis

## Autenticação

### Registrar Usuário

```http
POST /auth/register
```

### Login

```http
POST /auth/login
```

---

## Regiões

### Listar Regiões

```http
GET /regioes
```

Exemplo:

```json
[
  {
    "id": 1,
    "nome": "Londrina",
    "estado": "PR",
    "latitude": -23.30,
    "longitude": -51.16
  }
]
```

---

## Culturas

### Listar Culturas

```http
GET /culturas
```

Exemplo:

```json
[
  {
    "id": 1,
    "nome": "Soja",
    "temperaturaMin": 20.0,
    "temperaturaMax": 30.0,
    "chuvaMin": 120,
    "chuvaMax": 250
  }
]
```

---

## Clima

### Consultar Clima da Região

```http
GET /clima/{regiaoId}
```

Exemplo:

```json
{
  "id": 1,
  "temperatura": 25.4,
  "chuva": 120,
  "umidade": 68,
  "fonte": "Mock"
}
```

---

## Recomendações

### Gerar Recomendação

```http
POST /recomendacoes
```

Body:

```json
{
  "regiaoId": 1,
  "solo": "Argiloso",
  "relevo": "Plano",
  "ph": 6.2
}
```

Resposta:

```json
{
  "cultura": "Café",
  "compatibilidade": 70,
  "temperatura": 20.0,
  "chuva": 120,
  "ph": 6.2,
  "mensagens": [
    {
      "status": "OK",
      "descricao": "Temperatura prevista dentro da faixa ideal."
    },
    {
      "status": "ALERTA",
      "descricao": "Chuva abaixo do recomendado."
    }
  ]
}
```

---

### Consultar Histórico

```http
GET /recomendacoes
```

---

# Tratamento de Erros

## Token não informado

```json
{
  "status": 401,
  "erro": "Token não informado"
}
```

## Token inválido

```json
{
  "status": 401,
  "erro": "Token inválido ou expirado"
}
```

## Erro de validação

```json
{
  "dataHora": "2026-06-05T00:30:00",
  "status": 400,
  "erro": "Campo obrigatório",
  "path": "/auth/register"
}
```

---

# Dados Mockados

Ao iniciar a aplicação são carregados automaticamente:

### Região

```text
Londrina - PR
```

### Cultura

```text
Soja
```

### Clima

Valores simulados gerados aleatoriamente:

* Temperatura
* Umidade
* Chuva

---

# Próximos Passos

* Integração com Oracle Database
* Cálculo real de compatibilidade agrícola
* Dashboard em Angular
* Histórico de análises por usuário
* Relatórios em PDF
* Integração com mapas geográficos

---

# Observações da Implementação

A interface web foi criada com foco informativo para o usuário final, permitindo a consulta de regiões, condições climáticas e recomendações agrícolas.

As operações de atualização (PUT) e exclusão (DELETE) foram implementadas exclusivamente na API para fins administrativos e para atendimento aos requisitos técnicos da disciplina, podendo ser testadas através do Swagger ou de ferramentas como Postman.

Dessa forma, o front-end mantém uma experiência simplificada para o usuário final, enquanto o backend disponibiliza todas as operações CRUD exigidas pelo projeto.

---

| Método | Endpoint | Descrição |
|----------|----------|----------|
| POST | /auth/register | Cadastro de usuário |
| POST | /auth/login | Autenticação e geração de JWT |
| GET | /regioes | Lista regiões |
| PUT | /regioes/{id} | Atualiza uma região |
| DELETE | /regioes/{id} | Remove uma região |
| GET | /culturas | Lista culturas |
| GET | /clima/{id} | Consulta clima da região |
| POST | /recomendacoes | Gera recomendação agrícola |
| GET | /recomendacoes | Consulta histórico |

---

# Autor

Andre Ribeiro Leli - RM97780

Daniel Alexandre Barcellos de Brito - RM98185

Marcone Santos Ribeiro - RM552585

Murillo Barbosa Lemos - M550445

Projeto desenvolvido para fins acadêmicos e demonstração de conhecimentos em Java, Spring Boot, APIs REST, JWT e arquitetura de software.
