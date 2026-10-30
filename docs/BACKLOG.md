# Backlog — A3 Garantia e Qualidade de Software

**Sistema de Cadastro de Academia** · UNISUL · Prof. Jorge Werner

| Integrante | Papel (seção 2.9 do relatório) | Módulos |
| --- | --- | --- |
| **Pedro** | Líder de equipe + Especialista em DevOps | Infra de qualidade (CI, SonarCloud, testes), Auth (funcionário + aluno), Funcionários, Dashboard, base do front e portal do aluno |
| **Gabriel** | Desenvolvedor | Membros (CPF, busca, ficha, acesso do aluno), Treinos (+ *Meus treinos* do aluno) |
| **Yohan** | Testador | Pagamentos (status, inadimplência), Histórico de Atividades (+ *Meu histórico* do aluno), testes de integração (e2e) |

> Todos programam e todos escrevem testes unitários do próprio código, como o professor exige.

---

## Sumário

1. [Como a nota é calculada](#1-como-a-nota-é-calculada)
2. [Regras do jogo (leia antes de commitar)](#2-regras-do-jogo-leia-antes-de-commitar)
3. [Cronograma e marcos](#3-cronograma-e-marcos)
4. [Contrato compartilhado: regras de negócio e permissões](#4-contrato-compartilhado-regras-de-negócio-e-permissões)
5. [Checklist por pessoa](#5-checklist-por-pessoa)
6. [Tasks detalhadas](#6-tasks-detalhadas)
   - [Fase 0 — Administrativo](#fase-0--administrativo)
   - [Fase 1 — Fundação de qualidade](#fase-1--fundação-de-qualidade-pedro)
   - [Fase 2 — Back-end](#fase-2--back-end)
   - [Fase 3 — Front-end](#fase-3--front-end)
   - [Fase 4 — Testes de integração (e2e)](#fase-4--testes-de-integração-e2e)
   - [Fase 5 — Qualidade, quality gate e issues](#fase-5--qualidade-quality-gate-e-issues)
   - [Fase 6 — Relatório escrito](#fase-6--relatório-escrito)
   - [Fase 7 — Apresentação](#fase-7--apresentação)
   - [Fase 8 — Entrega](#fase-8--entrega)
7. [Definição de Pronto (DoD)](#7-definição-de-pronto-dod)

---

## 1. Como a nota é calculada

| Item | Pontos | O que precisamos garantir |
| --- | --- | --- |
| **2.10 Critérios de aceitação** | **4,0** | Cobertura ≥ **75%** (nossa meta é **80%**, o mínimo do quality gate padrão do Sonar), **quality gate aprovado** no SonarCloud e **todas as issues** abertas pelos professores resolvidas |
| Demais seções do relatório (normas + 2.1 a 2.13) | 3,0 | Seções escritas, com evidências (prints, links) |
| Apresentação | 3,0 | Identificação de todos (0,5) + **cada um demonstra o software rodando** (1,5) + sequência lógica em 10 ± 2 min (1,0) |
| Penalidade | −0,5 por aluno | Quem não postar o .zip no Ulife até 02/12 |

**Nota individual:** a participação é medida pelos **commits de código-fonte** de cada um, na **última versão** do repositório.

---

## 2. Regras do jogo (leia antes de commitar)

Estas regras vêm direto do PDF da A3. Quebrar alguma delas tira nota individual.

1. **Cada um commita só o próprio código, com a própria conta do GitHub.** Ninguém commita nem dá push por outra pessoa.
2. **Commits de arquivos que não são código-fonte não contam** (README, package.json, docs, configs). Para a nota de participação, o que vale são `.ts` e `.tsx`, de código e de teste.
3. **Arquivos que não existem na última versão não contam.** Não criem arquivos para apagar depois e evitem renomear arquivos perto da entrega.
4. **Commits pequenos e atômicos**, um propósito por commit. Nada de "megacommit". Façam commit várias vezes por dia de trabalho.
5. **Conventional Commits**, em português:
   ```
   feat(membros): adiciona validação de CPF no cadastro
   test(membros): cobre CPF duplicado no MembrosService
   fix(pagamentos): corrige cálculo de atraso no último dia do mês
   refactor(auth): extrai geração de token para método próprio
   ```
   Escopos: `api`, `web`, `auth`, `funcionarios`, `membros`, `treinos`, `pagamentos`, `historico`, `dashboard`, `ci`, `e2e`.
6. **Fluxo de branches:** `main` é protegida. Cada task vira uma branch e um PR:
   ```
   feat/membros-service       test/pagamentos-status       fix/historico-data-futura
   ```
   O PR precisa ter o CI verde e **1 aprovação** de outro integrante. Façam o merge com **"Rebase and merge"** ou **"Create a merge commit"**. **Nunca usem "Squash"**, porque ele junta os commits e destrói o histórico granular que o professor avalia.
7. **Teste junto com o código.** Toda task de back ou front só está pronta com os testes no mesmo PR.
8. **Lógica fica em arquivos testáveis.** No front, as páginas (`page.tsx`) devem ser finas. Validação, formatação e chamadas à API ficam em `lib/` ou `features/<modulo>/` e têm teste.
9. **Dados fictícios sempre.** Nada de CPF, telefone ou endereço reais em seed, testes ou prints (LGPD, seção 2.6).

---

## 3. Cronograma e marcos

| Sprint | Período | Objetivo | Marco ao final |
| --- | --- | --- | --- |
| **0 — Kickoff** | 10/10 a 13/10 | Regularizar a A3 no Ulife, acessos e ambiente de todos | Todos rodando o projeto localmente; o professor ciente do grupo de 3 |
| **1 — Fundação** | 13/10 a 19/10 | CI + SonarCloud + config de testes + módulo de referência; escopo documentado | **M1:** primeiro PR com CI verde e **primeira análise do Sonar salva ("antes")** |
| **2 — Back-end** | 20/10 a 02/11 | Todos os módulos da API com testes unitários | **M2:** API completa, cobertura da API ≥ 80% |
| **3 — Front-end** | 03/11 a 16/11 | Todas as telas integradas à API; testes de front; e2e | **M3:** sistema navegável de ponta a ponta |
| **4 — Qualidade** | 17/11 a 23/11 | Quality gate aprovado, issues zeradas, regressão | **M4 (code freeze em 23/11):** quality gate verde e 0 issues abertas |
| **5 — Documentação** | 24/11 a 29/11 | Relatório + slides + ensaios | **M5:** PDFs prontos e ensaio cronometrado feito |
| **Entrega** | 30/11 a 02/12 | Postagem individual no Ulife | **M6:** os 3 postaram (meta: 30/11; prazo: 02/12) |
| **Apresentação** | 04/12 | Socialização | 🎤 |

**Check-in semanal:** domingo às 20h, 15 min. Cada um responde: o que fiz, o que vou fazer e o que está me travando.

---

## 4. Contrato compartilhado: regras de negócio e permissões

Esta seção é a fonte da verdade para back, front e testes. Se uma regra mudar, ela muda **aqui primeiro**, com o grupo de acordo.

### 4.1 Regras de negócio

| ID | Regra | Dono | Resposta da API ao violar |
| --- | --- | --- | --- |
| **RN01** | O CPF deve ser válido (dígitos verificadores, sem sequências repetidas como `111.111.111-11`) e é guardado só com os números | Gabriel | 400 |
| **RN02** | O CPF é único no sistema e não pode ser alterado depois do cadastro | Gabriel | 409 (duplicado) / 400 (tentar alterar) |
| **RN03** | Membro e funcionário **não são excluídos**, apenas desativados (`ativo = false`) e reativados | Gabriel / Pedro | — |
| **RN04** | Membro **inativo** não pode receber novo treino, novo pagamento nem nova atividade | Gabriel (helper) / todos usam | 422 |
| **RN05** | Treino: duração entre **1 e 300 min**; `dataInicio` não pode ser anterior a hoje; tipo deve ser um da lista (Musculação, Cardio, Funcional, Alongamento, Crossfit, Outro) | Gabriel | 400 |
| **RN06** | Pagamento: valor **> 0 e ≤ 10.000**; data de vencimento obrigatória | Yohan | 400 |
| **RN07** | O status do pagamento é **calculado**. No banco ficam só `PENDENTE`, `PAGO` e `CANCELADO`. Na resposta: `CANCELADO` se cancelado; `PAGO` se tem `dataPagamento`; `ATRASADO` se o vencimento é anterior a hoje e não foi pago; senão `PENDENTE` | Yohan | — |
| **RN08** | Não é possível pagar um pagamento já pago ou cancelado, nem cancelar um pagamento já pago | Yohan | 409 |
| **RN09** | Membro **inadimplente** é aquele com algum pagamento atrasado há **mais de 10 dias** (constante `DIAS_TOLERANCIA = 10`). Inadimplente **não pode registrar atividade** | Yohan | 422 ("Membro com pagamento em atraso") |
| **RN10** | Atividade: tempo de execução entre **1 e 600 min**; a data não pode ser futura; se tiver `treinoId`, o treino deve ser **do mesmo membro** | Yohan | 400 / 422 |
| **RN11** | A atividade registra automaticamente o funcionário logado (`funcionarioId` vem do token, não do body) | Yohan | — |
| **RN12** | Senha guardada só como hash (bcrypt) e nunca devolvida pela API. Login e senha errados ou funcionário inativo recebem a **mesma** mensagem genérica | Pedro | 401 |
| **RN13** | O login é único. Um funcionário não pode desativar a si mesmo, e o sistema não pode ficar sem nenhum ADMIN ativo | Pedro | 409 / 422 |
| **RN14** | Todas as rotas exigem JWT, exceto `POST /auth/login`, `POST /auth/login-aluno` e `GET /health`. O token expira em 8h | Pedro | 401 |
| **RN15** | **Aluno** (membro) faz login com **CPF + senha**. O acesso é liberado pela recepção ou pelo admin, que define a senha inicial. Membro sem acesso liberado ou **inativo** não consegue logar (mesma mensagem genérica da RN12) | Pedro (login) / Gabriel (liberar acesso) | 401 |
| **RN16** | O aluno **só enxerga os próprios dados**: os próprios treinos e o próprio histórico. O `membroId` vem **sempre do token**, nunca da URL ou do body. Pedir um treino ou atividade de outro membro → 404, para não revelar que o recurso existe | Gabriel (treinos) / Yohan (histórico) | 404 |
| **RN17** | O aluno é **somente leitura**: não cria, edita nem exclui nada, inclusive treinos e atividades próprios | Pedro (RBAC) | 403 |

### 4.2 Matriz de permissões (RBAC)

| Recurso | ADMIN | RECEPCIONISTA | INSTRUTOR | ALUNO |
| --- | --- | --- | --- | --- |
| Funcionários (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Membros — listar/ver | ✅ | ✅ | ✅ | ❌ |
| Membros — criar/editar/desativar | ✅ | ✅ | ❌ | ❌ |
| Membros — liberar/redefinir acesso do aluno | ✅ | ✅ | ❌ | ❌ |
| Treinos — listar/ver (todos) | ✅ | ✅ | ✅ | ❌ |
| Treinos — ver **os próprios** (`/me/treinos`) | — | — | — | ✅ |
| Treinos — criar/editar/excluir | ✅ | ❌ | ✅ | ❌ |
| Pagamentos — tudo | ✅ | ✅ | ❌ | ❌ |
| Histórico — listar/ver (todos) | ✅ | ✅ | ✅ | ❌ |
| Histórico — ver **o próprio** (`/me/atividades`) | — | — | — | ✅ |
| Histórico — registrar | ✅ | ❌ | ✅ | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ❌ |
| Meus dados (`/auth/me`) | ✅ | ✅ | ✅ | ✅ |

**Como o ALUNO funciona tecnicamente**
- `ALUNO` **não** entra no enum `Cargo`, porque `Cargo` é só de funcionário. O JWT passa a ter `tipo: 'FUNCIONARIO' | 'ALUNO'`. Para funcionários, o `cargo` também vem no token.
- O `RolesGuard` trata `ALUNO` como um papel a mais. Por exemplo, `@Roles('ALUNO')` libera só para alunos.
- As rotas do aluno ficam separadas em `/me/...` e sempre filtram pelo `sub` do token (RN16). As rotas gerais (`/treinos`, `/atividades`) continuam **fechadas** para o aluno.
- No front, o aluno cai em um **portal próprio** (`/aluno`), com menu de 2 itens: *Meus treinos* e *Meu histórico*.

### 4.3 Padrão de código de cada módulo da API

```
apps/api/src/<modulo>/
├── dto/
│   ├── create-<x>.dto.ts
│   ├── update-<x>.dto.ts
│   └── query-<x>.dto.ts
├── <modulo>.controller.ts
├── <modulo>.controller.spec.ts
├── <modulo>.service.ts
├── <modulo>.service.spec.ts      ← PrismaService mockado
└── <modulo>.module.ts
apps/api/test/<modulo>.e2e-spec.ts ← banco real (Postgres do CI)
```

O módulo **Funcionários** (Pedro, Sprint 1) é a **referência**. Copiem a estrutura e o estilo de teste dele.

### 4.4 Formato padrão das respostas

- Listas: `{ data: T[], total: number, page: number, pageSize: number }`
- Erros: o formato padrão do Nest `{ statusCode, message, error }`
- Datas em ISO 8601; valores em número com 2 casas decimais

---

## 5. Checklist por pessoa

Marquem `[x]` quando a task estiver **pronta segundo a DoD** (seção 7). Use 🟡 para indicar uma task **parcial**, com uma nota do que falta.

### 5.0 Já concluído antes do backlog (Pedro) — status em 10/10

Base entregue nos 4 commits iniciais (`chore: estrutura do monorepo…` até `feat(api): ajusta schema com UUID v7…`), já enviados para a `main`:

- [x] Monorepo com pnpm workspaces (`apps/api`, `apps/web`, `packages/`) e scripts na raiz (`dev`, `build`, `lint`, `test`, `db:*`)
- [x] `docker-compose.yml` com PostgreSQL 17
- [x] README com instruções de setup, scripts e modelo de dados
- [x] LICENSE (MIT), `.editorconfig` e `.gitignore` completo (sem `.env` nem client gerado do Prisma)
- [x] API NestJS 11: `ConfigModule` global, `ValidationPipe` global (whitelist, transform), CORS, shutdown hooks
- [x] `PrismaService` + `PrismaModule` (Prisma 7 com adapter pg) e endpoint `GET /health`
- [x] **Schema Prisma completo** das 5 entidades: UUID v7, `ativo` em Membro e Funcionário, FKs com `RESTRICT`, `dataVencimento`/`dataPagamento`, enums `Cargo` e `StatusPagamento`, índices
- [x] 2 migrations aplicadas (`init`, `ajustes_regras_negocio`)
- [x] Web Next.js 16 + React 19 + Tailwind 4 com página inicial e client `lib/api.ts` (`ApiError`)
- [x] ESLint + Prettier configurados na API; ESLint no web
- [x] Commits em Conventional Commits, branch `main`

> ⚠️ Pendências do schema atual ligadas ao backlog:
> - o enum `StatusPagamento` ainda tem `ATRASADO`, que pela RN07 não deve ser gravado (o Yohan resolve na PAG-02/03);
> - `Membro` ainda não tem `senhaHash` (resolvido na AUTH-04).

> ✅ **Fase 0 (ADM-01 a ADM-05) concluída**, confirmada pelo Pedro em 10/10: postagem no Ulife, e-mail ao professor, colaboradores e repositório público, ambiente de todos e canal do grupo. Falta só a ADM-06 (documento de escopo).

### Pedro
- [x] ADM-01 Postar link do repositório e nomes no Ulife
- [x] ADM-02 E-mail ao professor (grupo de 3 + stack)
- [x] ADM-03 Adicionar colaboradores no GitHub
- [x] ADM-05 Canal e check-in semanal
- [ ] ADM-06 Documento de escopo (coordenação + RNFs)
- [x] INF-01 Proteção da main, templates e CONTRIBUTING
- [ ] INF-02 Jest da API com cobertura + e2e — 🟡 **parcial**: Jest, ts-jest e @nestjs/testing já estão instalados, com a config básica no `package.json`. Faltam a cobertura (exclusões, lcov, `test:cov`), o `jest-e2e.json`, o supertest e remover o `--passWithNoTests`
- [ ] INF-03 Testes no front (Vitest)
- [ ] INF-04 Pipeline do GitHub Actions
- [x] INF-05 SonarCloud + primeira análise
- [ ] INF-06 Seed do banco
- [ ] INF-07 Base comum da API (filtro de erros, paginação, datas)
- [ ] FUN-01 Back de funcionários
- [ ] FUN-02 Testes de funcionários
- [ ] AUTH-01 Login com JWT
- [ ] AUTH-02 Autorização por cargo (RBAC)
- [ ] AUTH-03 Testes de auth
- [ ] AUTH-04 Login do aluno (migration + JWT com tipo)
- [ ] AUTH-05 Testes do login do aluno
- [ ] DASH-01 Endpoint do dashboard + testes
- [ ] WEB-01 Base do front (layout e componentes) — 🟡 **parcial**: o client `lib/api.ts` com `ApiError` existe. Faltam o envio do token, o tratamento de 401, o layout e os componentes
- [ ] WEB-02 Autenticação no front
- [ ] WEB-03 Telas de funcionários
- [ ] WEB-04 Tela do dashboard
- [ ] WEB-05 Login e portal do aluno
- [ ] E2E-05 e2e de segurança (401/403)
- [ ] QA-01 Issues do Sonar no meu código
- [ ] QA-02 Cobertura consolidada
- [ ] QA-05 Evidências (prints antes/depois)
- [ ] DOC-02 Introdução · DOC-05 2.3 · DOC-09 2.7 · DOC-11 2.9 · DOC-14 2.12 · DOC-16 Conclusão
- [ ] DOC-17 Revisão final e PDF do relatório
- [ ] APR-02 Roteiro e tempos · APR-03 meus slides · APR-04 Ambiente de demo + vídeo reserva
- [ ] ENT-01 Checklist final · ENT-02 Montar o .zip · ENT-03 Postar no Ulife

### Gabriel
- [x] ADM-01 Postar link do repositório e nomes no Ulife
- [x] ADM-04 Ambiente local + git com a própria conta
- [ ] ADM-06 Escopo: RFs de membros e treinos
- [x] MEM-01 Validador de CPF
- [ ] MEM-02 DTOs de membros
- [ ] MEM-03 Service de membros
- [ ] MEM-04 Controller de membros
- [ ] MEM-05 Testes de membros
- [ ] MEM-06 Resumo/ficha do membro (API)
- [ ] MEM-07 Liberar e redefinir o acesso do aluno
- [ ] TRE-01 DTOs de treinos
- [ ] TRE-02 Service de treinos
- [ ] TRE-03 Controller de treinos
- [ ] TRE-04 Testes de treinos
- [ ] TRE-05 Treinos do aluno (`/me/treinos`)
- [ ] WEB-G1 Lista de membros
- [ ] WEB-G2 Formulário de membro
- [ ] WEB-G3 Ficha do membro
- [ ] WEB-G4 Telas de treinos
- [ ] WEB-G5 Testes do front (membros/treinos)
- [ ] WEB-G6 Portal do aluno: Meus treinos + liberação de acesso
- [ ] E2E-04 e2e de validações de membros/treinos
- [ ] QA-01 Issues do Sonar no meu código
- [ ] QA-06 (opcional) Teste de usabilidade
- [ ] DOC-01 Modelo UNISUL/ABNT · DOC-07 2.5 · DOC-08 2.6 · DOC-10 2.8 · DOC-13 2.11 · DOC-15 2.13
- [ ] APR-01 Template e capa dos slides · APR-03 meus slides
- [ ] ENT-03 Postar no Ulife

### Yohan
- [x] ADM-01 Postar link do repositório e nomes no Ulife
- [x] ADM-04 Ambiente local + git com a própria conta
- [x] ADM-06 Escopo: RFs de pagamentos/histórico + fluxo principal e critérios de aceitação
- [ ] PAG-01 DTOs de pagamentos
- [x] PAG-02 Cálculo de status (função pura)
- [ ] PAG-03 Service de pagamentos
- [ ] PAG-04 Situação financeira / inadimplência
- [ ] PAG-05 Controller de pagamentos
- [ ] PAG-06 Testes de pagamentos
- [x] HIS-01 DTOs de histórico
- [ ] HIS-02 Service de histórico
- [ ] HIS-03 Controller de histórico
- [ ] HIS-04 Testes de histórico
- [ ] HIS-05 Histórico do aluno (`/me/atividades`)
- [ ] WEB-Y1 Tela de pagamentos
- [ ] WEB-Y2 Formulário de pagamento
- [ ] WEB-Y3 Tela de histórico
- [ ] WEB-Y4 Componentes para a ficha do membro
- [ ] WEB-Y5 Testes do front (pagamentos/histórico)
- [ ] WEB-Y6 Portal do aluno: Meu histórico
- [ ] E2E-01 Utilitários de e2e (banco limpo, login)
- [ ] E2E-02 e2e do fluxo principal
- [ ] E2E-03 e2e da regra de inadimplência
- [ ] QA-01 Issues do Sonar no meu código
- [ ] QA-03 Triagem semanal das issues do professor
- [ ] QA-04 Regressão manual pré-entrega
- [ ] DOC-03 2.1 · DOC-04 2.2 · DOC-06 2.4 · DOC-12 2.10
- [ ] APR-03 meus slides · APR-05 Ensaio (cronometrista)
- [ ] ENT-03 Postar no Ulife

---

## 6. Tasks detalhadas

Formato de cada task: **Responsável · Sprint · Depende de**, depois **O que fazer** e **Resultado esperado** (critério de pronto).

---

### Fase 0 — Administrativo

#### ADM-01 · Postar link do repositório e integrantes no Ulife
**Responsável:** Pedro, Gabriel e Yohan (cada um posta) · **Sprint:** 0 · **Prazo:** imediato (o prazo oficial era 09/10) · **Status:** ✅ concluída

**O que fazer**
- Postar no Ulife, em *Conteúdo → "A3 – Grupo"*: `https://github.com/pedroszdev/A3-SistemaCadastroAcademia` + nome completo dos 3 integrantes.
- Como o prazo passou, mencionar o atraso no e-mail da ADM-02.

**Resultado esperado**
- As 3 postagens feitas, com print de cada uma guardado na pasta do grupo.

---

#### ADM-02 · E-mail ao professor: grupo de 3 e stack
**Responsável:** Pedro · **Sprint:** 0 · **Depende de:** — · **Status:** ✅ concluída

**O que fazer**
- Enviar um e-mail ao prof. Jorge Werner, com Gabriel e Yohan em cópia, contendo:
  - o tema (Cadastro de Academia) e o link do repositório;
  - a composição de **3 integrantes** (o padrão é 5) e o pedido de confirmação;
  - a stack: NestJS + Prisma + PostgreSQL (API), Next.js (web), Jest/Vitest, GitHub Actions e SonarCloud;
  - a pergunta sobre a "primeira entrega" (problema, atores, RFs etc.): onde e quando ela deve ser entregue.

**Resultado esperado**
- O e-mail enviado e a resposta do professor salva em PDF. Ela vira evidência caso a composição seja questionada.

---

#### ADM-03 · Acessos ao repositório
**Responsável:** Pedro (convida), Gabriel e Yohan (aceitam) · **Sprint:** 0 · **Status:** ✅ concluída

**O que fazer**
- *Settings → Collaborators*: adicionar Gabriel e Yohan com permissão **Write**.
- Conferir se o repositório está **público**, porque o SonarCloud é gratuito só para repositórios públicos.

**Resultado esperado**
- Os dois conseguem criar branches e abrir PRs. O repositório está público.

---

#### ADM-04 · Ambiente local e git com a própria conta
**Responsável:** Gabriel, Yohan · **Sprint:** 0 · **Depende de:** ADM-03 · **Status:** ✅ concluída

**O que fazer**
- Instalar Node ≥ 24, pnpm (`corepack enable`) e Docker.
- Configurar o git com o **mesmo e-mail da conta do GitHub**:
  ```bash
  git config --global user.name "Seu Nome"
  git config --global user.email "email-da-conta@github.com"
  ```
- Configurar a chave SSH no GitHub e clonar o repositório.
- Seguir o README: `pnpm install` → copiar os `.env` → `pnpm db:up` → `pnpm db:migrate` → `pnpm dev`.
- Abrir um PR de teste pequeno (pode ser só o próprio nome no CONTRIBUTING) para validar o fluxo. Esse PR **não conta** como código, é só validação.

**Resultado esperado**
- `http://localhost:3000/health` retorna `{"status":"ok"}` e `http://localhost:3001` abre.
- O commit aparece no GitHub com a **foto/usuário da pessoa**, e não como "unknown". Se aparecer "unknown", o e-mail do git está errado e os commits não vão contar.

---

#### ADM-05 · Comunicação do grupo
**Responsável:** Pedro · **Sprint:** 0 · **Status:** ✅ concluída

**O que fazer**
- Criar um grupo de WhatsApp (ou usar um existente) e fixar o link deste backlog.
- Combinar o check-in semanal (domingo às 20h, 15 min).
- Combinar a regra de review: PR aberto recebe revisão em até 24h.

**Resultado esperado**
- O canal criado, com o horário do check-in e a regra de review acordados.

---

#### ADM-06 · Documento de escopo (`docs/ESCOPO.md`)
**Responsável:** Pedro (coordena, RNFs, tecnologias), Gabriel (RFs de membros/treinos), Yohan (RFs de pagamentos/histórico, fluxo principal, critérios de aceitação) · **Sprint:** 0–1

**O que fazer**
- Escrever o que o PDF chama de "primeira entrega":
  - **Problema atendido**: academia controla membros, mensalidades e frequência em planilhas e papel.
  - **Atores**: Admin, Recepcionista, Instrutor e **Aluno** (consulta os próprios treinos e o próprio histórico).
  - **Tecnologias**.
  - **Requisitos funcionais** (RF01…): no mínimo um por módulo.
  - **Requisitos não funcionais prioritários**: segurança dos dados (hash de senha, JWT, LGPD), desempenho (listagens paginadas < 500 ms), usabilidade, manutenibilidade (cobertura ≥ 80%, quality gate).
  - **Fluxo principal**: login → cadastrar membro → criar treino → lançar pagamento → registrar atividade, com **critérios de aceitação** em formato *Dado/Quando/Então*.
  - **Regras de negócio**: copiar da seção 4.1.

**Resultado esperado**
- `docs/ESCOPO.md` revisado pelos 3 e na `main`. Ele alimenta as seções 2.1, 2.2 e 2.3 do relatório e o slide de requisitos.

---

### Fase 1 — Fundação de qualidade (Pedro)

> Esta é a fase mais urgente, porque Gabriel e Yohan dependem dela para seguir o padrão. **Meta: tudo na `main` até 15/10.**
> Enquanto isso, Gabriel e Yohan já podem começar MEM-01/02 e PAG-01/02: DTOs e funções puras não dependem de CI.

#### INF-01 · Governança do repositório
**Responsável:** Pedro · **Sprint:** 1

**O que fazer**
- *Settings → Branches*: criar a regra de proteção da `main` com:
  - PR obrigatório e 1 aprovação;
  - status check do CI obrigatório;
  - proibição de push direto.
- *Settings → General → Pull Requests*: **desmarcar "Allow squash merging"**.
- Labels: `bug`, `feature`, `test`, `professor`, `sonar`, `docs`, `membros`, `treinos`, `pagamentos`, `historico`, `auth`, `funcionarios`, `web`, `ci`.
- Templates:
  - `.github/ISSUE_TEMPLATE/bug.md`: passos para reproduzir, esperado, obtido, evidência;
  - `.github/pull_request_template.md`: o que muda, como testar, checklist da DoD, `Closes #`.
- `CONTRIBUTING.md`: as regras da seção 2 deste backlog, de forma resumida.

**Resultado esperado**
- Não é possível dar push direto na `main`, e o PR mostra o template.
- Isso vira evidência das seções 2.11 (gestão de defeitos) e 2.13 (controle de versão).

---

#### INF-02 · Jest da API com cobertura e e2e
**Responsável:** Pedro · **Sprint:** 1 · **Status:** 🟡 parcial (Jest instalado e configurado sem cobertura)

**O que fazer**
- No `apps/api/package.json` (bloco `jest`):
  - `collectCoverageFrom: ["**/*.ts"]` com `rootDir: "src"`;
  - `coveragePathIgnorePatterns`: `generated/`, `main.ts`, `.module.ts`, `/dto/`;
  - `coverageReporters: ["lcov", "text-summary"]`, `coverageDirectory: "../coverage"`.
- Scripts: `test:cov` e `test:e2e` (`jest --config test/jest-e2e.json --runInBand`).
- Instalar `supertest` e `@types/supertest`. Criar `test/jest-e2e.json` e um `test/app.e2e-spec.ts` que testa o `GET /health`.
- Remover o `--passWithNoTests` quando existirem testes.

**Resultado esperado**
- `pnpm --filter api test:cov` gera `apps/api/coverage/lcov.info` **sem** o código gerado do Prisma.
- `pnpm --filter api test:e2e` passa com o banco local no ar.

---

#### INF-03 · Testes no front (Vitest + Testing Library)
**Responsável:** Pedro · **Sprint:** 1

**O que fazer**
- Instalar `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` e `@vitest/coverage-v8`.
- `vitest.config.ts` com cobertura `lcov` em `apps/web/coverage`, incluindo `src/**/*.{ts,tsx}` e excluindo `layout.tsx` e os arquivos de config.
- Scripts `test` e `test:cov` no `apps/web/package.json`.
- Primeiro teste: `src/lib/api.test.ts` (sucesso, erro → `ApiError` com status), usando `fetch` mockado.

**Resultado esperado**
- `pnpm --filter web test:cov` passa e gera `lcov.info`. O `pnpm test` da raiz roda API e web.

---

#### INF-04 · Pipeline de CI (GitHub Actions)
**Responsável:** Pedro · **Sprint:** 1 · **Depende de:** INF-02, INF-03

**O que fazer**
- `.github/workflows/ci.yml`, disparado em `push` na `main` e em `pull_request`:
  1. checkout com `fetch-depth: 0` (o Sonar precisa do histórico) → setup do pnpm e do Node 24 com cache → `pnpm install --frozen-lockfile`;
  2. `pnpm lint`;
  3. `pnpm build` (garante que compila);
  4. testes unitários com cobertura: `pnpm --filter api test:cov` e `pnpm --filter web test:cov`;
  5. e2e: **service `postgres:17`** no job, `DATABASE_URL` apontando para ele, `prisma migrate deploy` e depois `pnpm --filter api test:e2e`;
  6. scan do SonarCloud (INF-05) usando os dois `lcov.info`.
- Badge do CI no README.

**Resultado esperado**
- Todo PR mostra o check verde ou vermelho, e o PR que quebra um teste fica bloqueado.
- Tirar print de um PR com o check e da aba Actions (evidência para a seção 2.7 e para a demo de CI).

---

#### INF-05 · SonarCloud
**Responsável:** Pedro · **Sprint:** 1 · **Depende de:** INF-04

**O que fazer**
- Entrar no sonarcloud.io com o GitHub → importar a organização e o repositório → **desativar "Automatic Analysis"** (a análise passa a ser feita pelo CI).
- Criar o secret `SONAR_TOKEN` no repositório.
- `sonar-project.properties` na raiz:
  ```properties
  sonar.projectKey=pedroszdev_A3-SistemaCadastroAcademia
  sonar.organization=pedroszdev
  sonar.sources=apps/api/src,apps/web/src
  sonar.tests=apps/api/src,apps/api/test,apps/web/src
  sonar.test.inclusions=**/*.spec.ts,**/*.e2e-spec.ts,**/*.test.ts,**/*.test.tsx
  sonar.exclusions=**/generated/**,**/node_modules/**,**/*.d.ts
  sonar.coverage.exclusions=**/main.ts,**/*.module.ts,**/dto/**,**/layout.tsx,**/*.config.*
  sonar.javascript.lcov.reportPaths=apps/api/coverage/lcov.info,apps/web/coverage/lcov.info
  ```
- Quality gate: **Sonar way** (padrão). Badges de *Quality Gate* e *Coverage* no README.
- **Rodar a primeira análise e tirar prints** do dashboard: issues, cobertura, duplicações, segurança e confiabilidade. Esse é o **"antes"** exigido pela seção 2.12 e pelo slide "Evolução do software".

**Resultado esperado**
- A análise aparece no SonarCloud a cada push ou PR, e o PR recebe um comentário do Sonar.
- Prints do "antes" salvos em `docs/evidencias/sonar-antes/`.

---

#### INF-06 · Seed do banco
**Responsável:** Pedro · **Sprint:** 1 (completar na 2, quando os módulos existirem)

**O que fazer**
- `apps/api/prisma/seed.ts` + script `db:seed` na raiz, configurado no `prisma.config.ts`.
- Dados **fictícios**:
  - 3 funcionários (`admin` / `recepcao` / `instrutor`, com senhas documentadas no README, só para desenvolvimento);
  - 10 membros com CPFs válidos gerados (2 inativos), sendo **2 com acesso de aluno liberado** (CPF e senha documentados no README): um em dia e um inadimplente;
  - treinos variados;
  - pagamentos nos 4 status, incluindo **1 membro inadimplente** (atraso > 10 dias) para a demo;
  - cerca de 30 atividades.
- O seed deve ser **idempotente**: dá para rodar duas vezes sem erro.

**Resultado esperado**
- `pnpm db:seed` deixa o sistema pronto para demonstrar. O seed também é usado na apresentação (APR-04).

---

#### INF-07 · Base comum da API
**Responsável:** Pedro · **Sprint:** 1

**O que fazer**
- `src/common/filters/prisma-exception.filter.ts`: traduz `P2002` → 409, `P2025` → 404 e `P2003` → 409, com mensagens em português.
- `src/common/dto/pagination-query.dto.ts` (`page` ≥ 1, `pageSize` entre 1 e 100, padrão 20) + helper `paginate()` que devolve o formato da seção 4.4.
- `src/common/utils/date.ts`: `hoje()` sem horário e `diasEntre(a, b)`, usados nas RN05, RN07, RN09 e RN10.
- Testes unitários dos três.

**Resultado esperado**
- Gabriel e Yohan importam esses utilitários em vez de cada um reinventar. Cobertura de 100% em `common/`.

---

### Fase 2 — Back-end

#### FUN-01 · Funcionários: back (módulo de referência)
**Responsável:** Pedro · **Sprint:** 1 · **Depende de:** INF-07

**O que fazer**
- DTOs: `CreateFuncionarioDto` (nome, cargo enum, login 3–30 caracteres alfanuméricos, senha ≥ 8), `UpdateFuncionarioDto` (sem login; senha opcional) e `QueryFuncionarioDto` (cargo, ativo, paginação).
- Service:
  - `create`: hash com `bcrypt`, login duplicado → 409;
  - `findAll`, `findOne` (404);
  - `update` (refaz o hash se vier senha nova);
  - `desativar` e `reativar`, com a RN13.
- **Nunca devolver `senhaHash`**: usar o `select` explícito do Prisma.
- Rotas: `GET/POST /funcionarios`, `GET/PATCH /funcionarios/:id`, `PATCH /funcionarios/:id/desativar` e `/reativar`.

**Resultado esperado**
- CRUD funcionando via Insomnia/Postman e servindo de **exemplo** de estrutura para os colegas (seção 4.3).

---

#### FUN-02 · Funcionários: testes unitários
**Responsável:** Pedro · **Sprint:** 1 · **Depende de:** FUN-01

**O que fazer**
- `funcionarios.service.spec.ts` com o PrismaService mockado, cobrindo:
  - criação com hash (a senha salva ≠ a senha enviada);
  - login duplicado;
  - 404;
  - auto-desativação bloqueada;
  - último admin bloqueado;
  - `senhaHash` nunca aparece no retorno.
- `funcionarios.controller.spec.ts`: delegação para o service.

**Resultado esperado**
- O módulo com **≥ 90%** de cobertura. Os testes servem de modelo para Gabriel e Yohan.

---

#### AUTH-01 · Login com JWT
**Responsável:** Pedro · **Sprint:** 2 · **Depende de:** FUN-01

**O que fazer**
- Instalar `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt` e `bcrypt`.
- `POST /auth/login { login, senha }` → `{ accessToken, funcionario: { id, nome, cargo } }`.
- `GET /auth/me` → o funcionário logado.
- `JwtAuthGuard` **global** + decorator `@Public()` para o login e o health (RN14).
- `JWT_SECRET` e `JWT_EXPIRES_IN=8h` no `.env.example`.
- Decorator `@UsuarioAtual()`, que o Yohan usa no histórico (RN11).

**Resultado esperado**
- Sem token → 401; credencial errada ou funcionário inativo → 401 com mensagem genérica (RN12).

---

#### AUTH-02 · Autorização por cargo (RBAC)
**Responsável:** Pedro · **Sprint:** 2 · **Depende de:** AUTH-01

**O que fazer**
- Decorator `@Roles(Cargo.ADMIN, ...)` + `RolesGuard`.
- Aplicar nos controllers de funcionários e dashboard.
- Avisar Gabriel e Yohan para aplicarem a **matriz da seção 4.2** nos controllers deles.

**Resultado esperado**
- Um RECEPCIONISTA que tenta `POST /funcionarios` recebe 403.

---

#### AUTH-03 · Auth: testes unitários
**Responsável:** Pedro · **Sprint:** 2

**O que fazer**
- Testes de `AuthService`: login ok, senha errada, usuário inexistente, inativo e conteúdo do payload do token.
- Testes de `RolesGuard`: com e sem `@Roles`, cargo permitido e negado.
- Testes de `JwtAuthGuard` com `@Public`.

**Resultado esperado**
- O módulo de auth com ≥ 90% de cobertura.

---

#### AUTH-04 · Login do aluno
**Responsável:** Pedro · **Sprint:** 2 · **Depende de:** AUTH-01

**O que fazer**
- **Migration** `acesso_aluno`: adicionar `senhaHash String? @map("senha_hash")` em `Membro`. Fica nulo enquanto o acesso não for liberado. Avisar o grupo antes de mergear, porque o schema é compartilhado.
- `POST /auth/login-aluno { cpf, senha }`:
  - normaliza o CPF (usa `normalizarCpf` do Gabriel, MEM-01);
  - valida a senha com bcrypt;
  - rejeita membro sem `senhaHash` ou inativo com a mensagem genérica (RN15).
- Payload do JWT: `{ sub: membroId, tipo: 'ALUNO' }`. Ajustar o `JwtStrategy` para os dois tipos e o `GET /auth/me` para devolver os dados do aluno (sem `senhaHash`).
- `RolesGuard` reconhece o papel `'ALUNO'`. Funcionário nunca passa em `@Roles('ALUNO')`, e aluno nunca passa nas rotas de funcionário (RN17).
- O decorator `@UsuarioAtual()` passa a devolver `{ id, tipo, cargo? }`. Gabriel e Yohan usam o `id` nas rotas `/me/...`.

**Resultado esperado**
- Um aluno com acesso liberado recebe um token e consegue chamar `/me/...`. Com esse token, `GET /treinos` responde 403.

---

#### AUTH-05 · Login do aluno: testes unitários
**Responsável:** Pedro · **Sprint:** 2 · **Depende de:** AUTH-04

**O que fazer**
- Casos de teste:
  - login ok com CPF com e sem máscara;
  - senha errada;
  - CPF inexistente;
  - membro sem acesso liberado;
  - membro inativo (os 4 casos de erro com a mesma mensagem);
  - payload com `tipo: 'ALUNO'`.
- `RolesGuard`: aluno em rota de funcionário → negado; funcionário em rota de aluno → negado.

**Resultado esperado**
- Os fluxos do aluno ficam cobertos e o módulo de auth continua com ≥ 90% de cobertura.

---

#### DASH-01 · Dashboard: API
**Responsável:** Pedro · **Sprint:** 2 (fim) · **Depende de:** MEM-03, PAG-04, HIS-02

**O que fazer**
- `GET /dashboard` → `{ membrosAtivos, membrosInadimplentes, pagamentosAtrasados, receitaMes, atividadesHoje }`.
- Reaproveitar os services dos colegas (injeção). Não duplicar regra.
- Testes unitários com os services mockados.

**Resultado esperado**
- Os números batem com o seed e o endpoint está coberto por testes. Ele também é a "consulta" exigida pelo PDF, junto com as listagens.

---

#### MEM-01 · Validador de CPF
**Responsável:** Gabriel · **Sprint:** 1 · **Depende de:** —

**O que fazer**
- `src/common/validators/cpf.ts`:
  - `normalizarCpf(valor)`: remove pontos e traço;
  - `isCpfValido(valor)`: 11 dígitos, rejeita todos iguais, calcula os 2 dígitos verificadores.
- `src/common/validators/is-cpf.decorator.ts`: decorator `@IsCpf()` do class-validator.
- `cpf.spec.ts` com **tabela de casos** (`it.each`): CPFs válidos gerados, dígito errado, 10 e 12 dígitos, `000.000.000-00`, com máscara, sem máscara, letras.

**Resultado esperado**
- 100% de cobertura no validador. Ele é a base da RN01 e é ótimo para mostrar na apresentação.

---

#### MEM-02 · Membros: DTOs
**Responsável:** Gabriel · **Sprint:** 1–2 · **Depende de:** MEM-01

**O que fazer**
- `CreateMembroDto`: nome (3–120), cpf (`@IsCpf`, normalizado com `@Transform`), telefone (10–11 dígitos, normalizado), endereco (5–200).
- `UpdateMembroDto`: tudo opcional, **sem cpf** (RN02).
- `QueryMembroDto`: `busca` (nome parcial, sem diferenciar maiúsculas, ou CPF), `ativo`, paginação (estende a de INF-07).

**Resultado esperado**
- Um body inválido retorna 400 com mensagens claras em português.

---

#### MEM-03 · Membros: service
**Responsável:** Gabriel · **Sprint:** 2 · **Depende de:** MEM-02, INF-07

**O que fazer**
- `create`: CPF duplicado → 409 (RN02).
- `findAll`: busca + filtro de ativo + paginação + ordenação por nome.
- `findOne`: 404 se não existir.
- `update`, `desativar`, `reativar` (RN03).
- **`assertMembroAtivo(id)`**: método público que lança 404 se o membro não existe e 422 se está inativo (RN04). **Exportar no `MembrosModule`**, porque Treinos, Pagamentos e Histórico usam.

**Resultado esperado**
- Regras RN01–RN04 implementadas. O Yohan consegue injetar `MembrosService` e chamar `assertMembroAtivo`.

---

#### MEM-04 · Membros: controller
**Responsável:** Gabriel · **Sprint:** 2 · **Depende de:** MEM-03, AUTH-02

**O que fazer**
- Rotas: `GET/POST /membros`, `GET/PATCH /membros/:id`, `PATCH /membros/:id/desativar` e `/reativar`.
- `ParseUUIDPipe` no `:id`.
- `@Roles` conforme a matriz 4.2.

**Resultado esperado**
- Os endpoints funcionam com token e respeitam as permissões.

---

#### MEM-05 · Membros: testes unitários
**Responsável:** Gabriel · **Sprint:** 2 · **Depende de:** MEM-03, MEM-04

**O que fazer**
- Service com Prisma mockado:
  - criar ok;
  - CPF duplicado;
  - busca por nome e por CPF;
  - paginação (`skip`/`take` corretos);
  - 404;
  - desativar e reativar;
  - `assertMembroAtivo` nos 3 cenários (ok, 404, 422).
- Controller: delegação.

**Resultado esperado**
- Membros com ≥ 90% de cobertura.

---

#### MEM-06 · Membros: resumo para a ficha
**Responsável:** Gabriel · **Sprint:** 2 (fim) · **Depende de:** MEM-03, PAG-04 (Yohan)

**O que fazer**
- `GET /membros/:id/resumo` → dados do membro + `situacaoFinanceira` (do `PagamentosService.situacaoMembro` do Yohan) + treino mais recente + total de atividades nos últimos 30 dias.
- Testes unitários com os services mockados.

**Resultado esperado**
- O endpoint alimenta a tela de ficha (WEB-G3).

---

#### MEM-07 · Liberar e redefinir o acesso do aluno
**Responsável:** Gabriel · **Sprint:** 2 · **Depende de:** MEM-03, AUTH-04

**O que fazer**
- `PATCH /membros/:id/acesso { senha }` (senha ≥ 8): grava o `senhaHash` com bcrypt. Serve tanto para liberar o acesso pela primeira vez quanto para redefinir a senha.
- `DELETE /membros/:id/acesso`: revoga o acesso (`senhaHash = null`).
- Membro inativo → 422. O retorno nunca inclui `senhaHash`. Incluir `acessoLiberado: boolean` nas respostas de membro.
- `@Roles(ADMIN, RECEPCIONISTA)`.
- Testes unitários: liberar, redefinir (o hash muda), revogar, membro inativo, 404 e o hash nunca aparece na resposta.

**Resultado esperado**
- A recepção libera o acesso do aluno, e o aluno consegue logar (AUTH-04).

---

#### TRE-01 · Treinos: DTOs
**Responsável:** Gabriel · **Sprint:** 2

**O que fazer**
- `CreateTreinoDto`: membroId (UUID), tipo (`@IsIn` com a lista da RN05), descricao (3–500), duracao (inteiro 1–300), dataInicio (data ISO).
- `UpdateTreinoDto` (parcial, sem membroId) e `QueryTreinoDto` (membroId, tipo, paginação).

**Resultado esperado**
- Valores fora da faixa retornam 400.

---

#### TRE-02 · Treinos: service
**Responsável:** Gabriel · **Sprint:** 2 · **Depende de:** TRE-01, MEM-03

**O que fazer**
- `create`: `assertMembroAtivo` (RN04) + dataInicio ≥ hoje (RN05, usando `hoje()` de INF-07).
- `findAll` (filtros), `findOne` (404), `update` (revalida a data, se alterada).
- `remove`: as atividades vinculadas ficam com `treinoId = null` (já está no schema).

**Resultado esperado**
- As regras RN04 e RN05 funcionam.

---

#### TRE-03 · Treinos: controller
**Responsável:** Gabriel · **Sprint:** 2

**O que fazer**
- Rotas: `GET/POST /treinos`, `GET/PATCH/DELETE /treinos/:id` e `GET /membros/:id/treinos`.
- `@Roles` conforme a matriz.

**Resultado esperado**
- O INSTRUTOR cria treino; a RECEPCIONISTA recebe 403 ao tentar.

---

#### TRE-04 · Treinos: testes unitários
**Responsável:** Gabriel · **Sprint:** 2

**O que fazer**
- Casos:
  - criar ok;
  - membro inativo (422) e inexistente (404);
  - data no passado;
  - data de hoje (limite: deve passar);
  - update com data inválida;
  - remove.
- **Mockar a data atual** (`jest.useFakeTimers().setSystemTime(...)`), para os testes não quebrarem conforme o dia em que rodam.

**Resultado esperado**
- Treinos com ≥ 90% de cobertura e testes determinísticos.

---

#### TRE-05 · Treinos do aluno (`/me/treinos`)
**Responsável:** Gabriel · **Sprint:** 2 · **Depende de:** TRE-02, AUTH-04

**O que fazer**
- Criar o `MeTreinosController` (ou rotas `/me` no controller de treinos) com `@Roles('ALUNO')`:
  - `GET /me/treinos`: lista os treinos do aluno logado, mais recentes primeiro, com paginação e filtro por tipo;
  - `GET /me/treinos/:id`: detalhe. **Se o treino for de outro membro → 404** (RN16).
- No service, criar `findDoMembro(membroId, query)` e `findOneDoMembro(membroId, id)`, que **sempre** filtram por `membroId` no `where`. Nunca buscar pelo id e checar depois.
- Testes unitários:
  - lista só os treinos do próprio membro (verificar o `where` passado ao Prisma);
  - detalhe do próprio treino ok;
  - treino de outro membro → 404;
  - inexistente → 404.

**Resultado esperado**
- O aluno vê só a própria ficha de treino, e o isolamento entre membros está provado por teste.

---

#### PAG-01 · Pagamentos: DTOs
**Responsável:** Yohan · **Sprint:** 1–2

**O que fazer**
- `CreatePagamentoDto`: membroId, valor (número com até 2 casas, entre 0,01 e 10.000, RN06), dataVencimento.
- `RegistrarPagamentoDto`: dataPagamento opcional (padrão: hoje; não pode ser futura).
- `QueryPagamentoDto`: membroId, status (incluindo `ATRASADO`), `vencimentoDe`, `vencimentoAte`, paginação.

**Resultado esperado**
- Um body inválido retorna 400.

---

#### PAG-02 · Cálculo de status (função pura)
**Responsável:** Yohan · **Sprint:** 1 · **Depende de:** —

**O que fazer**
- `src/pagamentos/pagamento-status.ts`:
  - `calcularStatus(pagamento, hoje)` conforme a **RN07**;
  - `diasEmAtraso(pagamento, hoje)`.
- `pagamento-status.spec.ts` com `it.each` cobrindo:
  - cancelado;
  - pago antes e depois do vencimento;
  - vence hoje (→ PENDENTE);
  - venceu ontem (→ ATRASADO);
  - venceu há 10 e há 11 dias (limite da RN09).

**Resultado esperado**
- 100% de cobertura. Essa é **a regra de negócio principal** para mostrar no relatório e na apresentação.

---

#### PAG-03 · Pagamentos: service
**Responsável:** Yohan · **Sprint:** 2 · **Depende de:** PAG-01, PAG-02, MEM-03

**O que fazer**
- `create`: `assertMembroAtivo` (RN04).
- `findAll`:
  - filtros por membro, período e status;
  - o filtro `ATRASADO` vira query no banco (`status = PENDENTE AND dataPagamento IS NULL AND dataVencimento < hoje`);
  - cada item da resposta traz o `status` calculado e `diasEmAtraso`.
- `findOne` (404).
- `registrarPagamento` e `cancelar` (RN08).

**Resultado esperado**
- O banco nunca guarda `ATRASADO`. A API sempre devolve o status calculado.

---

#### PAG-04 · Situação financeira / inadimplência
**Responsável:** Yohan · **Sprint:** 2 · **Depende de:** PAG-03

**O que fazer**
- `situacaoMembro(membroId)` → `{ situacao: 'EM_DIA' | 'INADIMPLENTE', pagamentosAtrasados, maiorAtrasoDias }` (RN09, `DIAS_TOLERANCIA = 10` em constante exportada).
- `assertMembroAdimplente(membroId)`: lança 422 com a mensagem da RN09.
- Exportar no `PagamentosModule`, porque Histórico (Yohan), Resumo do membro (Gabriel) e Dashboard (Pedro) usam.
- Rota `GET /membros/:id/situacao`.

**Resultado esperado**
- Os outros módulos consultam a inadimplência sem duplicar a regra.

---

#### PAG-05 · Pagamentos: controller
**Responsável:** Yohan · **Sprint:** 2

**O que fazer**
- Rotas: `GET/POST /pagamentos`, `GET /pagamentos/:id`, `PATCH /pagamentos/:id/pagar` e `/cancelar`.
- `@Roles(ADMIN, RECEPCIONISTA)`.

**Resultado esperado**
- O INSTRUTOR recebe 403 em pagamentos.

---

#### PAG-06 · Pagamentos: testes unitários
**Responsável:** Yohan · **Sprint:** 2

**O que fazer**
- Service com Prisma mockado e data fixa, cobrindo:
  - criar;
  - membro inativo;
  - pagar ok;
  - pagar já pago (409) e pagar cancelado (409);
  - cancelar pago (409);
  - filtro por ATRASADO monta a query certa;
  - `situacaoMembro` com 0 atrasos, atraso de 5 dias (ainda em dia) e atraso de 11 dias (inadimplente).
- Controller: delegação.

**Resultado esperado**
- Pagamentos com ≥ 90% de cobertura.

---

#### HIS-01 · Histórico: DTOs
**Responsável:** Yohan · **Sprint:** 2

**O que fazer**
- `CreateAtividadeDto`: membroId, treinoId opcional, atividade (3–120), data (não futura), tempoExecucao (1–600). **Sem `funcionarioId`** (RN11).
- `QueryAtividadeDto`: membroId, funcionarioId, `dataDe`, `dataAte`, paginação.

**Resultado esperado**
- Um body inválido retorna 400. Se o cliente mandar `funcionarioId`, o campo é rejeitado pela whitelist.

---

#### HIS-02 · Histórico: service
**Responsável:** Yohan · **Sprint:** 2 · **Depende de:** HIS-01, MEM-03, PAG-04, AUTH-01

**O que fazer**
- `registrar(dto, funcionarioLogado)`:
  - `assertMembroAtivo` (RN04);
  - `assertMembroAdimplente` (RN09);
  - se tiver treino, valida que ele pertence ao membro (RN10);
  - grava o `funcionarioId` do token (RN11).
- `findAll` com filtros e `include` de membro, funcionário e treino (só os campos necessários).
- `resumoMembro(membroId, de, ate)` → total de atividades e total de minutos.

**Resultado esperado**
- Um inadimplente recebe 422 ao registrar atividade. Essa é a regra mais "visual" da demo.

---

#### HIS-03 · Histórico: controller
**Responsável:** Yohan · **Sprint:** 2

**O que fazer**
- Rotas: `GET/POST /atividades`, `GET /atividades/:id` e `GET /membros/:id/atividades`.
- `@Roles` conforme a matriz. Usar `@UsuarioAtual()` do Pedro.

**Resultado esperado**
- O INSTRUTOR registra atividade; a RECEPCIONISTA só consulta.

---

#### HIS-04 · Histórico: testes unitários
**Responsável:** Yohan · **Sprint:** 2

**O que fazer**
- Casos:
  - registrar ok (com e sem treino);
  - membro inativo;
  - inadimplente (422);
  - treino de outro membro (422);
  - data futura;
  - `funcionarioId` vem do usuário logado;
  - filtros de período;
  - resumo.

**Resultado esperado**
- Histórico com ≥ 90% de cobertura.

---

#### HIS-05 · Histórico do aluno (`/me/atividades`)
**Responsável:** Yohan · **Sprint:** 2 · **Depende de:** HIS-02, AUTH-04

**O que fazer**
- Rotas com `@Roles('ALUNO')`:
  - `GET /me/atividades`: histórico do aluno logado, com filtro de período e paginação;
  - `GET /me/atividades/:id`: detalhe (de outro membro → 404, RN16);
  - `GET /me/atividades/resumo?de=&ate=`: total de atividades e total de minutos no período (reaproveita `resumoMembro` do HIS-02).
- **Não** devolver dados do funcionário além do nome.
- O `membroId` vem do token e o filtro fica sempre no `where` (RN16).
- Testes unitários:
  - lista só as atividades do próprio membro;
  - filtro de período;
  - resumo;
  - atividade de outro membro → 404.

**Resultado esperado**
- O aluno acompanha a própria frequência sem acesso aos dados de outros membros.

---

### Fase 3 — Front-end

> Padrão: `src/app/(app)/<modulo>/page.tsx` fino. A lógica fica em `src/features/<modulo>/` (`api.ts` com as chamadas, `schemas.ts` com validação, componentes) e tem teste.

#### WEB-01 · Base do front
**Responsável:** Pedro · **Sprint:** 3 (começar no fim da 2) · **Depende de:** INF-03 · **Status:** 🟡 parcial (client `api.ts` pronto)

**O que fazer**
- Layout autenticado `(app)/layout.tsx` com menu lateral, que mostra só os itens permitidos pelo cargo (matriz 4.2).
- Componentes base em `src/components/ui/`: `Button`, `Input`, `Select`, `Table` com paginação, `Dialog`, `Toast`, `StatusBadge` e `EmptyState`.
- `src/lib/format.ts`: `formatarMoeda` (BRL), `formatarData`, `mascaraCpf`, `mascaraTelefone`, **com testes**.
- Atualizar o `api.ts` para enviar o token e tratar 401 (redireciona para o login).

**Resultado esperado**
- Gabriel e Yohan montam as telas reaproveitando esses componentes. O visual fica consistente.

---

#### WEB-02 · Autenticação no front
**Responsável:** Pedro · **Sprint:** 3 · **Depende de:** AUTH-01, WEB-01

**O que fazer**
- Tela `/login` com mensagem de erro genérica.
- Guardar o token em cookie, com `middleware.ts` protegendo as rotas `(app)` e um contexto/hook `useUsuario()` com o cargo.
- Logout.
- Testes do formulário de login (sucesso, erro) e dos helpers de sessão.

**Resultado esperado**
- Sem login, a aplicação redireciona para `/login`. Depois do login, o usuário vai para o dashboard.

---

#### WEB-03 · Telas de funcionários
**Responsável:** Pedro · **Sprint:** 3 · **Depende de:** FUN-01, WEB-01

**O que fazer**
- Lista com filtro de cargo e situação; formulário de criar/editar; ação desativar/reativar com confirmação.
- Visível só para ADMIN. Testes dos componentes.

**Resultado esperado**
- O ADMIN gerencia funcionários pela interface.

---

#### WEB-04 · Dashboard
**Responsável:** Pedro · **Sprint:** 3 · **Depende de:** DASH-01

**O que fazer**
- Cards com os indicadores do DASH-01 + lista dos membros inadimplentes com link para a ficha. Testes.

**Resultado esperado**
- É a tela inicial depois do login e também abre a demo.

---

#### WEB-05 · Login e portal do aluno
**Responsável:** Pedro · **Sprint:** 3 · **Depende de:** AUTH-04, WEB-02

**O que fazer**
- A tela `/login` ganha duas abas: **Funcionário** (login + senha) e **Aluno** (CPF com máscara + senha).
- Depois do login, o `middleware.ts` redireciona conforme o `tipo` do token: funcionário → dashboard; aluno → `/aluno`. Um aluno que tenta acessar uma rota de funcionário é mandado de volta para `/aluno`.
- Layout do portal `(aluno)/layout.tsx`: cabeçalho com o nome do aluno, menu *Meus treinos* e *Meu histórico*, botão de sair. Deve funcionar bem **no celular**, porque é onde o aluno vai usar.
- Testes: troca de abas, envio para a rota certa de cada aba, redirecionamento por tipo (helper de sessão).

**Resultado esperado**
- O aluno loga com o CPF e cai no próprio portal. Cada portal só é acessível pelo tipo de usuário certo.

---

#### WEB-G1 · Lista de membros
**Responsável:** Gabriel · **Sprint:** 3 · **Depende de:** MEM-04, WEB-01

**O que fazer**
- Busca por nome/CPF com debounce, filtro ativo/inativo, paginação.
- Coluna de situação (badge ativo/inativo).
- Botões "Novo membro" e "Ver ficha".

**Resultado esperado**
- A consulta de membros funciona. Ela é a "consulta" mínima exigida pelo PDF.

---

#### WEB-G2 · Formulário de membro
**Responsável:** Gabriel · **Sprint:** 3

**O que fazer**
- Criar e editar com máscaras de CPF e telefone; o CPF fica desabilitado na edição (RN02).
- Validação no cliente reaproveitando a lógica do CPF (copiar `isCpfValido` para `features/membros/cpf.ts`, com teste).
- Mostrar o erro 409 da API ("CPF já cadastrado").

**Resultado esperado**
- O cadastro funciona de ponta a ponta, com mensagens claras.

---

#### WEB-G3 · Ficha do membro
**Responsável:** Gabriel · **Sprint:** 3 · **Depende de:** MEM-06, WEB-Y4

**O que fazer**
- `/membros/[id]` com cabeçalho (dados + badge de situação financeira) e abas:
  - **Treinos** (Gabriel);
  - **Pagamentos** e **Histórico**, usando os componentes do Yohan (WEB-Y4).
- Botões desativar/reativar.

**Resultado esperado**
- Uma tela central que junta os módulos. É ótima para a demo.

---

#### WEB-G4 · Telas de treinos
**Responsável:** Gabriel · **Sprint:** 3

**O que fazer**
- Lista geral com filtro por tipo e por membro; formulário de criar/editar (tipo como select da RN05); excluir com confirmação.
- Só o INSTRUTOR e o ADMIN veem os botões de edição.

**Resultado esperado**
- O CRUD de treinos funciona pela interface.

---

#### WEB-G6 · Portal do aluno: Meus treinos + liberação de acesso
**Responsável:** Gabriel · **Sprint:** 3 · **Depende de:** TRE-05, MEM-07, WEB-05

**O que fazer**
- `/aluno/treinos`: cards com os treinos do aluno (tipo, descrição, duração, início), filtro por tipo e detalhe ao clicar. Layout pensado para celular.
- Na **ficha do membro** (WEB-G3): botão "Liberar acesso" ou "Redefinir senha" (modal com senha e confirmação) e "Revogar acesso", com o badge "Acesso liberado".
- Testes: lista renderiza os cards, filtro chama a API certa, modal valida a senha (mínimo 8 e confirmação igual).

**Resultado esperado**
- A recepção libera o acesso pela ficha e o aluno vê os próprios treinos no portal.

---

#### WEB-G5 · Testes do front (membros/treinos)
**Responsável:** Gabriel · **Sprint:** 3

**O que fazer**
- Testes com Testing Library:
  - formulário de membro (validação de CPF, envio, erro 409);
  - lista (renderiza, busca chama a API com o parâmetro certo);
  - formulário de treino (limites de duração);
  - `cpf.ts` do front.

**Resultado esperado**
- `features/membros` e `features/treinos` com ≥ 80% de cobertura.

---

#### WEB-Y1 · Tela de pagamentos
**Responsável:** Yohan · **Sprint:** 3 · **Depende de:** PAG-05, WEB-01

**O que fazer**
- Lista com filtros de status e período; `StatusBadge` colorido (pendente, pago, atrasado com os dias de atraso, cancelado); ações "Registrar pagamento" e "Cancelar" com confirmação.

**Resultado esperado**
- A recepção vê os atrasados e dá baixa nos pagamentos.

---

#### WEB-Y2 · Formulário de pagamento
**Responsável:** Yohan · **Sprint:** 3

**O que fazer**
- Novo pagamento: busca do membro por nome/CPF, valor com máscara BRL, vencimento.
- Mostrar os erros da API (membro inativo, 409 ao pagar).

**Resultado esperado**
- O lançamento de mensalidade funciona.

---

#### WEB-Y3 · Tela de histórico
**Responsável:** Yohan · **Sprint:** 3

**O que fazer**
- Lista com filtros de membro, funcionário e período.
- Formulário "Registrar atividade" (treino opcional, filtrado pelo membro escolhido).
- **Mensagem destacada quando o membro estiver inadimplente** (RN09).

**Resultado esperado**
- O registro de atividade funciona, e o bloqueio por inadimplência aparece de forma clara na interface.

---

#### WEB-Y4 · Componentes para a ficha do membro
**Responsável:** Yohan · **Sprint:** 3

**O que fazer**
- `PagamentosDoMembro` e `HistoricoDoMembro`, que recebem `membroId`.
- Combinar a interface (props) com o Gabriel no início da sprint 3.

**Resultado esperado**
- O Gabriel só importa os componentes na ficha (WEB-G3).

---

#### WEB-Y6 · Portal do aluno: Meu histórico
**Responsável:** Yohan · **Sprint:** 3 · **Depende de:** HIS-05, WEB-05

**O que fazer**
- `/aluno/historico`:
  - no topo, cards de resumo do período (atividades e minutos totais), com filtro rápido: 7 dias, 30 dias ou mês atual;
  - abaixo, a lista cronológica das atividades (data, atividade, tempo, treino vinculado).
- Layout pensado para celular; estado vazio amigável ("Nenhuma atividade no período").
- Testes: resumo renderiza os totais, troca de período chama a API com as datas certas, estado vazio.

**Resultado esperado**
- O aluno acompanha a própria frequência pelo portal.

---

#### WEB-Y5 · Testes do front (pagamentos/histórico)
**Responsável:** Yohan · **Sprint:** 3

**O que fazer**
- Testes de:
  - `StatusBadge` para cada status;
  - formulário de pagamento (valor inválido);
  - ação pagar (chama a rota certa e atualiza a lista);
  - formulário de atividade (mensagem de inadimplência);
  - componentes da ficha.

**Resultado esperado**
- `features/pagamentos` e `features/historico` com ≥ 80% de cobertura.

---

### Fase 4 — Testes de integração (e2e)

> Os testes e2e rodam contra um **Postgres real** (local via docker; no CI via service) usando `supertest`. Eles também contam como **testes de sistema** no relatório (2.4).

#### E2E-01 · Utilitários de e2e
**Responsável:** Yohan · **Sprint:** 2 (fim) · **Depende de:** INF-02, AUTH-01

**O que fazer**
- `test/utils/`:
  - `criarApp()`: sobe o `AppModule` com os mesmos pipes e filtros do `main.ts`;
  - `limparBanco()`: `TRUNCATE ... CASCADE` em todas as tabelas;
  - `loginComo(cargo)`: cria o funcionário e devolve o token;
  - fábricas `criarMembro()`, `criarPagamento()` etc. com dados fictícios.

**Resultado esperado**
- Qualquer integrante escreve um e2e novo em poucas linhas.

---

#### E2E-02 · Fluxo principal
**Responsável:** Yohan · **Sprint:** 3 · **Depende de:** E2E-01, todos os controllers

**O que fazer**
- `test/fluxo-principal.e2e-spec.ts`: login → criar membro → criar treino → lançar pagamento → pagar → registrar atividade → consultar o histórico do membro → conferir o dashboard.

**Resultado esperado**
- O fluxo principal do `ESCOPO.md` está automatizado e os critérios de aceitação são verificados.

---

#### E2E-03 · Regra de inadimplência
**Responsável:** Yohan · **Sprint:** 3

**O que fazer**
- Pagamento vencido há 15 dias → `POST /atividades` → **422** → `PATCH /pagamentos/:id/pagar` → `POST /atividades` → **201**.
- Vencido há 5 dias → atividade permitida (tolerância).

**Resultado esperado**
- A RN09 está validada ponta a ponta. É a evidência principal da "regra de negócio validada por testes".

---

#### E2E-04 · Validações de membros e treinos
**Responsável:** Gabriel · **Sprint:** 3 · **Depende de:** E2E-01

**O que fazer**
- `test/membros.e2e-spec.ts`: CPF inválido → 400; CPF duplicado → 409; buscar por nome; desativar → criar treino para ele → 422; UUID inválido → 400; inexistente → 404.

**Resultado esperado**
- As RN01–RN05 estão validadas com banco real.

---

#### E2E-05 · Segurança (401/403)
**Responsável:** Pedro · **Sprint:** 3 · **Depende de:** E2E-01, AUTH-02

**O que fazer**
- `test/seguranca.e2e-spec.ts`:
  - sem token → 401 em rotas protegidas;
  - token inválido ou expirado → 401;
  - percorrer a **matriz 4.2** com `it.each` (papel × rota → 2xx/403), **incluindo o ALUNO**;
  - aluno A pede `GET /me/treinos/:id` e `GET /me/atividades/:id` de recursos do aluno B → **404** (RN16);
  - aluno tenta `POST /treinos` e `POST /atividades` → 403 (RN17);
  - membro com acesso revogado ou inativo não consegue logar;
  - as respostas de funcionário e de membro nunca contêm `senhaHash`.

**Resultado esperado**
- O RNF de segurança está coberto por testes. Isso entra no relatório como "testes de segurança" (2.4).

---

### Fase 5 — Qualidade, quality gate e issues

#### QA-01 · Corrigir as issues do Sonar no próprio código
**Responsável:** cada um no seu módulo · **Sprint:** contínuo, com foco na 4

**O que fazer**
- A cada PR, ler o comentário do Sonar e corrigir os bugs, vulnerabilidades e code smells do próprio código.
- Revisar os **Security Hotspots** (marcar como seguro com justificativa ou corrigir).
- Eliminar a duplicação (> 3% derruba o gate). Reduzir a complexidade cognitiva de funções grandes.
- Commits do tipo `fix(sonar): ...` ou `refactor(...)`, **um por problema**. Isso gera histórico bom para a seção 2.12.
- Anotar em `docs/evidencias/sonar-correcoes.md`: problema → regra do Sonar → como foi corrigido → commit.

**Resultado esperado**
- 0 bugs, 0 vulnerabilidades, hotspots 100% revisados e quality gate **Passed**.

---

#### QA-02 · Cobertura ≥ 80%
**Responsável:** cada um no seu módulo; Pedro consolida · **Sprint:** 4

**O que fazer**
- Rodar `pnpm test` com cobertura e abrir `coverage/lcov-report/index.html`.
- Cada um completa os testes do próprio módulo até ≥ 80%, priorizando os *branches* (if/else) não cobertos.
- Pedro confere o número geral no Sonar e checa se as exclusões estão justas. Não pode excluir código de lógica só para subir a porcentagem; o professor pode questionar.

**Resultado esperado**
- Cobertura geral no Sonar ≥ 80% (o mínimo exigido é 75%).

---

#### QA-03 · Triagem das issues do professor
**Responsável:** Yohan (triagem); dono do módulo (correção) · **Sprint:** contínuo, toda semana até 02/12

**O que fazer**
- Toda segunda-feira, olhar a aba *Issues* do GitHub. Para cada issue nova:
  - colocar a label `professor` + a label do módulo;
  - atribuir ao dono;
  - avisar no grupo.
- A correção vai em PR com `Closes #N` na descrição, para a issue fechar automaticamente e ficar rastreável.
- Ativar *Watch → All activity* no repositório, para receber e-mail quando o professor abrir uma issue.

**Resultado esperado**
- **0 issues abertas** na entrega, cada uma ligada ao PR que a resolveu. Isso vira evidência para as seções 2.10 e 2.11 e para o slide "Principais issues".

---

#### QA-04 · Regressão manual pré-entrega
**Responsável:** Yohan · **Sprint:** 4 (depois do code freeze)

**O que fazer**
- `docs/testes/regressao.md`: um checklist de cerca de 20 passos cobrindo todas as telas e as 3 visões (ADMIN, RECEPCIONISTA, INSTRUTOR), executado com o banco do seed.
- Bugs encontrados viram issues com a label `bug` (fluxo da INF-01).

**Resultado esperado**
- O checklist executado e assinado, com a data. Os bugs foram corrigidos antes de 29/11.

---

#### QA-05 · Evidências
**Responsável:** Pedro (organiza); todos contribuem · **Sprint:** contínuo

**O que fazer**
- Pasta `docs/evidencias/` com:
  - prints do Sonar **antes** (INF-05) e **depois** (fim da sprint 4);
  - prints do Actions (um PR barrado por teste quebrado e um verde);
  - relatório de cobertura;
  - prints de issues fechadas.

**Resultado esperado**
- Todo o material visual do relatório (2.7, 2.10, 2.12) e dos slides fica em um lugar só.

---

#### QA-06 · (Opcional) Teste de usabilidade
**Responsável:** Gabriel · **Sprint:** 4

**O que fazer**
- Pedir a 3 pessoas de fora do grupo que façam 3 tarefas (cadastrar membro, lançar pagamento, registrar atividade). Medir o tempo e aplicar o questionário SUS.

**Resultado esperado**
- Uma tabela de resultados para a seção 2.4. É citado no PDF de temas, mas não vale nota direta.

---

### Fase 6 — Relatório escrito

> **Formato:** modelo TCC do caderno de metodologia da UNISUL (biblioteca), com Capa, Folha de rosto ("sobrecapa"), Sumário, Introdução, Desenvolvimento, Conclusão e Referências.
> **Atenção:** o modelo do professor fala em "sistema legado". O nosso sistema é **novo**, então expliquem isso na 2.1 e na 2.3 e tratem o sistema "como construído" ao longo do semestre.
> Escrever em um Google Docs compartilhado, cada um na sua seção, e exportar para PDF no final.

| Task | Seção | Pontos | Responsável | Conteúdo mínimo |
| --- | --- | --- | --- | --- |
| **DOC-01** | Normas, capa, folha de rosto, sumário, referências | 0,5 | Gabriel | Modelo UNISUL/ABNT aplicado, sumário automático, referências (Nest, Prisma, Jest, SonarCloud, ISO 25010, livros/artigos de teste) |
| **DOC-02** | 1 Introdução | — | Pedro | Contexto (academia), problema, objetivo do trabalho, organização do documento |
| **DOC-03** | 2.1 Objetivo do plano de testes | 0,2 | Yohan | Objetivos dos testes + justificativa (por que testar; o sistema é novo, não legado) |
| **DOC-04** | 2.2 Escopo do teste | 0,2 | Yohan | Tabela de módulos/funcionalidades testados; o que **não** é testado e por quê (ex.: testes visuais, carga em escala) |
| **DOC-05** | 2.3 Contexto do sistema | 0,2 | Pedro | Arquitetura (diagrama do monorepo: web → API → Postgres), tecnologias, dependências, histórico de mudanças (link do histórico de commits/PRs), documentação (README, ESCOPO) |
| **DOC-06** | 2.4 Estratégia de testes | 0,2 | Yohan | Unitários (Jest/Vitest com mocks), integração e sistema (e2e com supertest + banco real), regressão (CI em todo PR), segurança (E2E-05), desempenho (justificar se não fizer), usabilidade (QA-06, se feito) |
| **DOC-07** | 2.5 Ambiente de teste | 0,2 | Gabriel | Máquinas locais (requisitos), Docker/Postgres 17, runner do GitHub Actions (ubuntu, Node 24), como replicar (README + docker-compose) |
| **DOC-08** | 2.6 Dados de teste | 0,2 | Gabriel | Seed, fábricas do e2e, CPFs **gerados** (não reais), banco limpo a cada execução, LGPD |
| **DOC-09** | 2.7 Ferramentas de teste | 0,2 | Pedro | Jest, Vitest, Testing Library, supertest, GitHub Actions (automação a cada push/PR), SonarCloud (análise estática), com justificativa e prints |
| **DOC-10** | 2.8 Cronograma | 0,2 | Gabriel | Tabela de sprints e marcos (seção 3 deste backlog), com datas reais de conclusão |
| **DOC-11** | 2.9 Responsabilidades | 0,2 | Pedro (todos preenchem as próprias linhas) | Papéis + **tabela de 3 colunas: Aluno, Funcionalidade, Link do(s) arquivo(s) de teste no GitHub** |
| **DOC-12** | 2.10 Critérios de aceitação | **4,0** | Yohan | Critérios definidos (cobertura ≥ 75%, gate aprovado, 0 issues, testes passando) + **evidências** de que foram atingidos (prints do Sonar, Actions, issues fechadas) |
| **DOC-13** | 2.11 Gestão de defeitos | 0,2 | Gabriel | Fluxo: issue (template) → label → atribuição → branch → PR com `Closes #` → CI → review → merge; ferramentas: GitHub Issues/PRs + SonarCloud |
| **DOC-14** | 2.12 Relatórios e métricas | 0,3 | Pedro | Tabela funcionalidade × testes; Sonar **antes × depois** (segurança, confiabilidade, manutenibilidade, duplicação, complexidade); problemas encontrados e como foram corrigidos (de `sonar-correcoes.md`) |
| **DOC-15** | 2.13 Controle de versão | 0,2 | Gabriel | Link do repositório, uso da `main` protegida, estrutura (LICENSE, README, apps/…/src), convenção Conventional Commits com exemplos reais, estratégia de branches |
| **DOC-16** | 3 Conclusão | — | Pedro (os 3 revisam) | Resultados, lições aprendidas (cada um contribui com um parágrafo), trabalhos futuros |
| **DOC-17** | Revisão final e PDF | — | Pedro | Leitura cruzada (cada um revisa uma seção de outro), conferir links, exportar `relatorio.pdf` |

**Resultado esperado da fase:** `relatorio.pdf` pronto até 29/11, com todos os links apontando para arquivos que existem na versão final da `main`.

---

### Fase 7 — Apresentação

#### APR-01 · Template e capa dos slides
**Responsável:** Gabriel · **Sprint:** 5

**O que fazer**
- Criar um template único (Google Slides ou PowerPoint).
- Capa com **nome, semestre e curso de cada integrante** (vale 0,5).
- Slide de sumário.

**Resultado esperado**
- O template compartilhado, com a capa pronta.

---

#### APR-02 · Roteiro e divisão de tempo
**Responsável:** Pedro · **Sprint:** 5

**O que fazer**
- Roteiro de cerca de 10 min, com uns 3 min por pessoa:

| Bloco | Quem | Tempo |
| --- | --- | --- |
| Capa e identificação (cada um diz nome/semestre/curso) + sumário | Todos (abre o Gabriel) | 0:45 |
| Requisitos funcionais e não funcionais | Gabriel | 1:00 |
| **Demo:** login, dashboard, funcionários e controle de acesso por cargo | Pedro | 1:30 |
| **Demo:** cadastro/busca de membro (CPF inválido e duplicado), ficha, treinos, liberar acesso e **login como aluno → Meus treinos** | Gabriel | 1:45 |
| **Demo:** pagamentos (atrasado), bloqueio de atividade por inadimplência, pagar e liberar, e o aluno vendo a atividade em **Meu histórico** | Yohan | 1:45 |
| **Demo:** integração contínua (PR → Actions → testes → Sonar) e automação dos testes unitários | Pedro | 1:15 |
| Principais issues detectadas e corrigidas | Yohan | 0:45 |
| Evolução do software (Sonar antes × depois do quality gate) | Pedro | 0:45 |
| Conclusão | Gabriel | 0:30 |

**Resultado esperado**
- Os três com tempo de fala equilibrado e **os três demonstrando o software rodando** (vale 1,5).

---

#### APR-03 · Slides de cada parte
**Responsável:** cada um, os seus blocos · **Sprint:** 5

**O que fazer**
- Slides com pouco texto e prints, conforme o roteiro.

**Resultado esperado**
- Todos os slides prontos até 28/11.

---

#### APR-04 · Ambiente de demonstração
**Responsável:** Pedro · **Sprint:** 5

**O que fazer**
- Roteiro de demo com os logins do seed (admin, recepcao, instrutor).
- Banco "limpo" com `pnpm db:seed` antes de apresentar.
- **Plano B:** gravar um vídeo da demo completa, caso o notebook, a rede ou o projetor falhem.
- Deixar abertos, antes de começar: a aplicação, o GitHub Actions e o SonarCloud.

**Resultado esperado**
- A demo roda sem improviso, e há um vídeo reserva salvo localmente.

---

#### APR-05 · Ensaios
**Responsável:** todos (Yohan cronometra) · **Sprint:** 5

**O que fazer**
- Pelo menos **2 ensaios completos** com cronômetro. O alvo é entre 9 e 11 min (o aceito vai de 8 a 12).
- Ajustar os blocos que estourarem.
- Cada um deve saber **explicar o próprio código e os próprios testes**, porque o PDF prevê uma possível **defesa individual**.

**Resultado esperado**
- Tempo dentro da faixa nos dois ensaios. Exportar `apresentacao.pdf`.

---

### Fase 8 — Entrega

#### ENT-01 · Checklist final do repositório
**Responsável:** Pedro (os 3 conferem) · **Prazo:** 29/11

**O que fazer**
- [ ] `main` com o CI verde no último commit
- [ ] SonarCloud: quality gate **Passed**, cobertura ≥ 80%
- [ ] **0 issues abertas** no GitHub (principalmente as do professor)
- [ ] README atualizado (como rodar, badges, logins do seed); LICENSE presente
- [ ] Os 3 com commits de **código-fonte** distribuídos no histórico (conferir em *Insights → Contributors*)
- [ ] Os links da tabela 2.9 do relatório abrem os arquivos de teste corretos

**Resultado esperado**
- O repositório pronto para avaliação.

---

#### ENT-02 · Montar o .zip
**Responsável:** Pedro · **Prazo:** 30/11

**O que fazer**
- Montar o `A3_Academia_Pedro_Gabriel_Yohan.zip` contendo **exatamente**:
  - `link-repositorio.txt` (URL do GitHub);
  - `relatorio.pdf`;
  - `apresentacao.pdf`.
- **Nada além disso.** O PDF diz que "postagem de arquivos não solicitados equivale a não postar".

**Resultado esperado**
- O zip enviado no grupo para os três postarem.

---

#### ENT-03 · Postagem individual no Ulife
**Responsável:** Pedro, Gabriel e Yohan · **Meta:** 30/11 · **Prazo final:** 02/12

**O que fazer**
- **Cada um** posta o mesmo zip em *Conteúdo → "A3 - Postagem do trabalho"*.
- Tirar print da confirmação e mandar no grupo.

**Resultado esperado**
- 3 postagens confirmadas. Quem não postar perde 0,5, e depois do prazo não dá para enviar nem corrigir.

---

#### ENT-04 · Apresentação
**Responsável:** todos · **Data:** 04/12

**O que fazer**
- Chegar cedo, testar o projetor e o notebook, rodar `pnpm db:seed` e deixar as abas abertas (APR-04).

**Resultado esperado**
- Apresentação dentro do tempo, com os três falando e demonstrando.

---

## 7. Definição de Pronto (DoD)

Uma task de código só é marcada como concluída quando:

- [ ] O código e os **testes** estão no mesmo PR, com **commits pequenos** no padrão Conventional Commits, feitos pela **conta do próprio autor**
- [ ] O CI está verde (lint, build, testes unitários, e2e)
- [ ] O comentário do Sonar no PR não aponta bug, vulnerabilidade ou hotspot novo, e a cobertura do código novo é ≥ 80%
- [ ] Recebeu 1 aprovação de outro integrante e foi mergeado sem squash
- [ ] As regras da seção 4 foram respeitadas. Se alguma regra mudou, a seção 4 foi atualizada antes
- [ ] O item correspondente foi marcado na seção 5
