# 💚 Cuida+ API

API REST desenvolvida em Java com Spring Boot para gerenciamento e organização de informações relacionadas aos cuidados de uma pessoa.

O sistema permite registrar medicamentos, consultas, notas e documentos, além de disponibilizar um histórico consolidado das atividades realizadas ao longo dos dias.

A aplicação possui autenticação JWT, persistência utilizando Spring Data JPA / Hibernate e foi estruturada para utilização com **Oracle Database**.

---

# Objetivo

O projeto **Cuida** tem como objetivo centralizar informações importantes relacionadas à rotina de cuidados de uma pessoa.

A aplicação permite organizar:

- Medicamentos
- Horários de medicação
- Dias da semana de utilização
- Consultas
- Notas e observações
- Documentos e exames
- Histórico de registros
- Atividades realizadas por dia

Cada registro é associado a uma pessoa específica, permitindo o gerenciamento independente de diferentes pessoas.

---

# Principais Funcionalidades

O backend disponibiliza suporte para:

- Cadastro de usuários
- Login
- Autenticação JWT
- Gerenciamento de pessoas
- Cadastro de medicamentos
- Horários dos medicamentos
- Dias da semana para medicação
- Cadastro de consultas
- Cadastro de notas
- Upload de documentos
- Associação dos registros a uma pessoa
- Histórico agrupado por dia
- Mapa de atividade
- Resumo dos últimos 30 dias
- Tratamento global de exceções
- Documentação Swagger / OpenAPI

---

# Tecnologias Utilizadas

- Java 21
- Spring Boot 4
- Spring MVC
- Spring Security
- JWT
- Spring Data JPA
- Hibernate
- Oracle Database
- Oracle JDBC Driver
- Swagger / OpenAPI
- Bean Validation
- Lombok
- Maven
- Multipart File Upload

---

# Arquitetura

O projeto utiliza arquitetura em camadas.

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Oracle Database
```

Responsabilidades:

```text
Controller
Recebe e responde requisições HTTP.

Service
Contém regras de negócio.

Repository
Realiza acesso aos dados utilizando Spring Data JPA.

Entity
Representa as estruturas persistidas no banco.

DTO
Define os objetos utilizados na entrada e saída da API.
```

---

# Estrutura do Projeto

```text
src/main/java/com/cuida

├── config
│   ├── interceptor
│   ├── CorsConfig
│   ├── DataLoader
│   ├── GlobalExceptionHandler
│   ├── RestTemplateConfig
│   ├── SecurityConfig
│   └── SwaggerConfig
│
├── controller
│   ├── AuthController
│   ├── ConsultaController
│   ├── DocumentoController
│   ├── MedicamentoController
│   └── RegistroController
│
├── dto
│   ├── AtividadeDiaResponse
│   ├── ConsultaRequest
│   ├── ErrorResponse
│   ├── HistoricoDiaResponse
│   ├── HistoricoResponse
│   ├── LoginRequest
│   ├── MedicamentoRequest
│   ├── NotaRequest
│   ├── RegisterRequest
│   ├── RegistroHistoricoResponse
│   ├── ResumoHistoricoResponse
│   ├── TipoRegistro
│   └── ValidationErrorResponse
│
├── entity
│   ├── CategoriaDocumento
│   ├── Consulta
│   ├── DiaSemana
│   ├── Documento
│   ├── EntidadeAuditavel
│   ├── Medicamento
│   ├── Nota
│   ├── Pessoa
│   └── Usuario
│
├── repository
│   ├── ConsultaRepository
│   ├── DocumentoRepository
│   ├── MedicamentoRepository
│   ├── NotaRepository
│   ├── PessoaRepository
│   └── UsuarioRepository
│
├── security
│   └── JwtService
│
├── service
│   ├── AuthService
│   ├── ConsultaService
│   ├── DocumentoService
│   ├── HistoricoService
│   ├── MedicamentoService
│   └── NotaService
│
└── CuidaApplication
```

---

# Modelo de Dados

Os registros são associados a uma pessoa.

```text
                 Pessoa
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
 Medicamentos   Consultas      Notas
       │
       │
       └──────────────────┐
                          ▼
                     Documentos
```

Relacionamentos:

```text
Pessoa 1 -------- N Medicamentos

Pessoa 1 -------- N Consultas

Pessoa 1 -------- N Notas

Pessoa 1 -------- N Documentos
```

---

# Oracle Database

O banco de dados principal previsto para a aplicação é o **Oracle Database**.

A conexão é realizada utilizando JDBC e Spring Data JPA.

## Dependência Maven

Adicionar ao `pom.xml`:

```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <scope>runtime</scope>
</dependency>
```

---

# Configuração Oracle

É recomendado manter as informações de conexão fora do código-fonte.

Exemplo de `application.properties`:

```properties
spring.application.name=cuida

spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

spring.jpa.open-in-view=false
```

Exemplo da URL Oracle:

```text
jdbc:oracle:thin:@//localhost:1521/FREEPDB1
```

Exemplo utilizando variáveis de ambiente:

```bash
export DB_URL=jdbc:oracle:thin:@//localhost:1521/FREEPDB1
export DB_USERNAME=cuida
export DB_PASSWORD=senha
```

Depois:

```bash
mvn spring-boot:run
```

---

# Profiles

Para separar desenvolvimento e ambiente Oracle, podem ser utilizados profiles.

Estrutura:

```text
application.properties
application-dev.properties
application-oracle.properties
```

Executar com Oracle:

```bash
mvn spring-boot:run \
-Dspring-boot.run.profiles=oracle
```

Ou:

```bash
export SPRING_PROFILES_ACTIVE=oracle
```

---

# IDs no Oracle

Para Oracle, a aplicação pode utilizar **Sequences** para geração dos identificadores.

Exemplo:

```java
@Id
@GeneratedValue(
        strategy = GenerationType.SEQUENCE,
        generator = "pessoa_seq"
)
@SequenceGenerator(
        name = "pessoa_seq",
        sequenceName = "SEQ_PESSOA",
        allocationSize = 1
)
private Long id;
```

No Oracle será utilizada uma sequence semelhante a:

```sql
CREATE SEQUENCE SEQ_PESSOA
START WITH 1
INCREMENT BY 1;
```

O mesmo conceito pode ser aplicado a:

```text
SEQ_PESSOA
SEQ_MEDICAMENTO
SEQ_CONSULTA
SEQ_NOTA
SEQ_DOCUMENTO
SEQ_USUARIO
```

---

# Documentos e Oracle

Os documentos enviados pela aplicação podem ser armazenados utilizando o tipo `BLOB` do Oracle.

Na entidade:

```java
@Lob
private byte[] arquivo;
```

No Oracle:

```text
BLOB
```

São aceitos:

```text
PDF
JPEG
PNG
WebP
```

Limite definido pela aplicação:

```text
10 MB
```

Para aplicações maiores, uma evolução recomendada é armazenar os arquivos em storage externo e manter no Oracle somente os metadados e a localização do arquivo.

---

# Enumerações

Enums Java são persistidos como texto.

Exemplo:

```java
@Enumerated(EnumType.STRING)
private CategoriaDocumento categoria;
```

Categorias:

```text
EXAME
RECEITA
LAUDO
ATESTADO
RELATORIO
OUTRO
```

No Oracle esses valores podem ser armazenados em uma coluna `VARCHAR2`.

---

# Auditoria

As entidades relacionadas ao histórico estendem:

```java
EntidadeAuditavel
```

A classe possui:

```text
criadoEm
```

preenchido automaticamente durante a persistência.

Exemplo:

```java
@MappedSuperclass
public abstract class EntidadeAuditavel {

    @Column(
        name = "CRIADO_EM",
        nullable = false,
        updatable = false
    )
    private LocalDateTime criadoEm;

    @PrePersist
    protected void prePersist() {
        criadoEm = LocalDateTime.now();
    }
}
```

Esse campo é utilizado para montar o histórico e o mapa de atividade.

---

# Como Executar

## Clonar

```bash
git clone https://github.com/seu-repositorio/cuida.git
```

## Entrar no projeto

```bash
cd cuida
```

## Compilar

```bash
mvn clean install
```

Ou:

```bash
./mvnw clean install
```

## Executar

```bash
mvn spring-boot:run
```

A API estará disponível em:

```text
http://localhost:8080
```

---

# Swagger

Documentação:

```text
http://localhost:8080/swagger
```

ou:

```text
http://localhost:8080/swagger-ui/index.html
```

---

# Autenticação

A aplicação utiliza JWT.

## Cadastrar usuário

```http
POST /auth/register
```

```json
{
  "nome": "Murillo",
  "email": "murillo@cuida.com",
  "senha": "123456"
}
```

---

## Login

```http
POST /auth/login
```

```json
{
  "email": "murillo@cuida.com",
  "senha": "123456"
}
```

Resposta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

# Autorização

Enviar:

```http
Authorization: Bearer <TOKEN>
```

No Swagger:

```text
Authorize

Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

# Medicamentos

## Criar

```http
POST /api/registros/pessoas/{pessoaId}/medicamentos
```

```json
{
  "nome": "Losartana",
  "horarios": [
    "08:00",
    "20:00"
  ],
  "dose": "50 mg",
  "orientacoes": "Tomar após alimentação",
  "dataInicio": "2026-09-07",
  "dataTermino": null,
  "lembrete": true,
  "diasSemana": [
    "DOMINGO",
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO"
  ]
}
```

## Listar

```http
GET /api/registros/pessoas/{pessoaId}/medicamentos
```

## Buscar

```http
GET /api/registros/pessoas/{pessoaId}/medicamentos/{id}
```

## Excluir

```http
DELETE /api/registros/pessoas/{pessoaId}/medicamentos/{id}
```

---

# Consultas

## Criar

```http
POST /api/registros/pessoas/{pessoaId}/consultas
```

```json
{
  "titulo": "Consulta com cardiologista",
  "quando": "2026-09-15T15:30:00",
  "lembrete": true,
  "descricao": "Levar exames anteriores."
}
```

## Listar

```http
GET /api/registros/pessoas/{pessoaId}/consultas
```

## Buscar

```http
GET /api/registros/pessoas/{pessoaId}/consultas/{id}
```

## Excluir

```http
DELETE /api/registros/pessoas/{pessoaId}/consultas/{id}
```

---

# Notas

## Criar

```http
POST /api/registros/pessoas/{pessoaId}/notas
```

```json
{
  "titulo": "Pressão arterial",
  "quando": "2026-09-07T15:08:00",
  "texto": "Pressão arterial: 120/80 mmHg."
}
```

## Listar

```http
GET /api/registros/pessoas/{pessoaId}/notas
```

## Buscar

```http
GET /api/registros/pessoas/{pessoaId}/notas/{id}
```

## Excluir

```http
DELETE /api/registros/pessoas/{pessoaId}/notas/{id}
```

---

# Documentos

## Criar

```http
POST /api/registros/pessoas/{pessoaId}/documentos
```

Content-Type:

```text
multipart/form-data
```

Campos:

```text
titulo
dataDocumento
categoria
descricao
arquivo
```

Exemplo:

```text
titulo = Hemograma completo
dataDocumento = 2026-09-07
categoria = EXAME
descricao = Exame realizado em setembro
arquivo = hemograma.pdf
```

---

# Histórico

O histórico consolida:

```text
MEDICAMENTO
CONSULTA
NOTA
DOCUMENTO
```

## Consultar

```http
GET /api/registros/pessoas/{pessoaId}/historico
```

Exemplo:

```http
GET /api/registros/pessoas/1/historico?dias=30
```

---

# Resposta do Histórico

```json
{
  "inicio": "2026-08-09",
  "fim": "2026-09-07",

  "ultimos30Dias": {
    "diasComRegistros": 4,
    "totalRegistros": 8
  },

  "atividade": [
    {
      "data": "2026-09-05",
      "quantidade": 1
    },
    {
      "data": "2026-09-06",
      "quantidade": 0
    },
    {
      "data": "2026-09-07",
      "quantidade": 4
    }
  ],

  "historico": [
    {
      "data": "2026-09-07",
      "quantidade": 2,
      "registros": [
        {
          "id": 1,
          "tipo": "MEDICAMENTO",
          "titulo": "Losartana",
          "descricao": "Dose: 50 mg",
          "criadoEm": "2026-09-07T09:30:00"
        }
      ]
    }
  ]
}
```

---

# Mapa de Atividade

O campo:

```json
atividade
```

é utilizado pelo frontend para construir o mapa de registros.

Exemplo:

```text
0 registros   → sem destaque
1 registro    → intensidade baixa
2 registros   → intensidade média
3 registros   → intensidade alta
4+ registros  → intensidade máxima
```

---

# DataLoader

Durante o desenvolvimento pode ser utilizado um `DataLoader` para inserir automaticamente dados de teste.

O loader não deve ser utilizado em produção.

Recomenda-se habilitá-lo somente no profile:

```text
dev
```

Exemplo:

```java
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {
```

Dessa forma:

```text
dev
    → DataLoader ativo

oracle / produção
    → DataLoader desativado
```

---

# Dados de Teste

No ambiente de desenvolvimento podem ser criados dados como:

### Pessoas

```text
Maria da Silva
João Oliveira
```

### Medicamentos

```text
Losartana
Vitamina D
Metformina
```

### Consultas

```text
Consulta com cardiologista
Retorno clínico
```

### Notas

```text
Pressão arterial
Observação
Alimentação
```

### Documentos

```text
Hemograma completo
Receita médica
```

---

# Tratamento de Erros

O tratamento centralizado é realizado através de:

```java
GlobalExceptionHandler
```

Entre os erros tratados:

- Pessoa não encontrada
- Medicamento não encontrado
- Consulta não encontrada
- Nota não encontrada
- Documento não encontrado
- Usuário não autorizado
- Token inválido
- E-mail já cadastrado
- Erros de validação

---

# Endpoints Principais

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro de usuário |
| POST | `/auth/login` | Autenticação |
| POST | `/api/registros/pessoas/{pessoaId}/medicamentos` | Cadastra medicamento |
| GET | `/api/registros/pessoas/{pessoaId}/medicamentos` | Lista medicamentos |
| GET | `/api/registros/pessoas/{pessoaId}/medicamentos/{id}` | Busca medicamento |
| DELETE | `/api/registros/pessoas/{pessoaId}/medicamentos/{id}` | Exclui medicamento |
| POST | `/api/registros/pessoas/{pessoaId}/consultas` | Cadastra consulta |
| GET | `/api/registros/pessoas/{pessoaId}/consultas` | Lista consultas |
| GET | `/api/registros/pessoas/{pessoaId}/consultas/{id}` | Busca consulta |
| DELETE | `/api/registros/pessoas/{pessoaId}/consultas/{id}` | Exclui consulta |
| POST | `/api/registros/pessoas/{pessoaId}/notas` | Cadastra nota |
| GET | `/api/registros/pessoas/{pessoaId}/notas` | Lista notas |
| GET | `/api/registros/pessoas/{pessoaId}/notas/{id}` | Busca nota |
| DELETE | `/api/registros/pessoas/{pessoaId}/notas/{id}` | Exclui nota |
| POST | `/api/registros/pessoas/{pessoaId}/documentos` | Cadastra documento |
| GET | `/api/registros/pessoas/{pessoaId}/documentos` | Lista documentos |
| GET | `/api/registros/pessoas/{pessoaId}/documentos/{id}` | Busca documento |
| DELETE | `/api/registros/pessoas/{pessoaId}/documentos/{id}` | Exclui documento |
| GET | `/api/registros/pessoas/{pessoaId}/historico` | Consulta histórico |

---

# Evolução do Banco de Dados

Para ambientes Oracle de homologação e produção, é recomendado utilizar controle de versão do schema através de uma ferramenta como:

```text
Flyway
```

ou:

```text
Liquibase
```

Em produção, é recomendado substituir:

```properties
spring.jpa.hibernate.ddl-auto=update
```

por:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

e controlar alterações através de scripts versionados.

---

# Próximos Passos

- Conexão definitiva com Oracle Database
- Scripts de criação das sequences
- Versionamento do banco com Flyway
- Operações PUT para atualização
- Autenticação dos endpoints `/api/**`
- Associação entre usuário e pessoas cadastradas
- Perfis de cuidador
- Controle de acesso
- Lembretes reais
- Notificações
- Dashboard
- Upload dos documentos para storage externo
- Integração com frontend
- Exportação do histórico
- Deploy em cloud

---

# Observações da Implementação

Medicamentos, consultas, notas e documentos são entidades independentes porque possuem atributos e regras de negócio diferentes.

O:

```java
RegistroController
```

centraliza os endpoints relacionados aos registros da pessoa.

As regras permanecem separadas em:

```text
MedicamentoService
ConsultaService
NotaService
DocumentoService
HistoricoService
```

A aplicação foi estruturada para permitir a substituição do banco utilizado em desenvolvimento por Oracle sem alteração das regras de negócio.

---

# Autores

Andre Ribeiro Leli - RM97780

Daniel Alexandre Barcellos de Brito - RM98185

Marcone Santos Ribeiro - RM552585

Murillo Barbosa Lemos - M550445

Projeto acadêmico desenvolvido para demonstração de conhecimentos em:

- Java
- Spring Boot
- APIs REST
- Spring Security
- JWT
- JPA
- Hibernate
- Oracle Database
- Arquitetura em camadas
- Modelagem relacional
- Upload de arquivos
- Auditoria
- Histórico de registros
