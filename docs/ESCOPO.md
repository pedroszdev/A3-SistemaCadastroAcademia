# Escopo — Sistema de Cadastro de Academia

**A3 Garantia e Qualidade de Software** · UNISUL · Prof. Jorge Werner

Primeira entrega da A3. Este documento é a fonte para as seções 2.1, 2.2 e 2.3 do relatório. As regras de negócio (RN01…RN17) e a matriz de permissões são as do [backlog](BACKLOG.md#4-contrato-compartilhado-regras-de-negócio-e-permissões).

**Responsáveis por seção**

| Seção | Responsável |
| --- | --- |
| 1 Problema atendido | Pedro |
| 2 Atores | Pedro |
| 3 Tecnologias | Pedro |
| 4.1 Autenticação | Pedro |
| 4.2 Funcionários | Pedro |
| 4.3 Membros | Gabriel |
| 4.4 Treinos | Gabriel |
| 4.8 Membros e treinos: rastreabilidade, cronograma e demonstração | Gabriel |
| 4.5 Pagamentos | Yohan |
| 4.6 Histórico de atividades | Yohan |
| 4.7 Dashboard | Pedro |
| 5 Requisitos não funcionais | Pedro |
| 6 Regras de negócio | Pedro |
| 7 Fluxo principal e critérios de aceitação | Yohan |

---

## 1. Problema atendido

A academia controla membros, mensalidades e frequência em planilhas e papel. Nesse formato o mesmo aluno aparece duplicado, ninguém sabe na hora quem está com mensalidade atrasada e o histórico de treinos some entre uma folha e outra.

O sistema reúne tudo num lugar só:

- cadastro de membros, com CPF validado e sem exclusão (só desativação);
- treinos de cada membro, montados pelo instrutor;
- mensalidades com status calculado e controle de inadimplência;
- histórico de atividades, que a academia usa para acompanhar a frequência;
- dashboard com os números do dia para a recepção e a gerência;
- portal em que o aluno consulta os próprios treinos e o próprio histórico.

Cada pessoa vê só o que o cargo dela permite.

## 2. Atores

| Ator | O que faz | Acesso |
| --- | --- | --- |
| **ADMIN** | Gerencia funcionários e acompanha toda a operação | Todos os módulos, inclusive funcionários |
| **RECEPCIONISTA** | Atende o balcão: cadastra membros, lança e registra mensalidades, libera o acesso do aluno | Membros, pagamentos, dashboard; só consulta treinos e histórico |
| **INSTRUTOR** | Monta os treinos e registra as atividades dos membros | Treinos e histórico; só consulta membros; dashboard sem a lista de inadimplentes |
| **ALUNO** | Consulta os próprios treinos e o próprio histórico (somente leitura) | Só as rotas `/me/...` e `GET /auth/me` |

Os três primeiros são funcionários e fazem login com **login e senha**. O aluno é um membro com acesso liberado pela recepção ou pelo admin e faz login com **CPF e senha**. A matriz completa de permissões está na [seção 4.2 do backlog](BACKLOG.md#42-matriz-de-permissões-rbac).

## 3. Tecnologias

| Camada | Tecnologia |
| --- | --- |
| API | NestJS 11 (TypeScript), validação com class-validator e class-transformer |
| Banco de dados | PostgreSQL 17 (Docker Compose), acesso pelo Prisma 7 com migrations |
| Autenticação | JWT (`@nestjs/jwt`, Passport) e senhas com bcrypt (`bcryptjs`) |
| Front-end | Next.js 16, React 19 e Tailwind CSS 4 |
| Testes da API | Jest 30 (unitários, com cobertura) e supertest (e2e com banco real) |
| Testes do front | Vitest 5 e Testing Library |
| Qualidade | ESLint, Prettier e SonarCloud (quality gate Sonar way) |
| Integração contínua | GitHub Actions: lint, build, testes com cobertura, e2e e análise do Sonar |
| Repositório | Monorepo com pnpm workspaces, Node.js 24 ou mais novo |

## 4. Requisitos funcionais

Cada módulo tem uma faixa fixa de IDs para que os três escrevam em paralelo sem colisão: Autenticação RF01–RF09, Funcionários RF10–RF19, Membros RF20–RF29, Treinos RF30–RF39, Pagamentos RF40–RF49, Histórico RF50–RF59, Dashboard RF60–RF69. Cada tabela tem o ID do requisito, o que o usuário faz, os perfis que acessam (matriz da seção 4.2 do backlog) e as regras de negócio que se aplicam (seção 4.1 do backlog).

### 4.1 Autenticação

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF01** | Login do funcionário com login e senha (`POST /auth/login`); devolve um token JWT válido por **8 h** e o id, nome e cargo do funcionário; credencial errada ou funcionário inativo recebem a mesma mensagem genérica (401) | Público | RN12, RN14 |
| **RF02** | Login do aluno com CPF (com ou sem máscara) e senha (`POST /auth/login-aluno`); membro sem acesso liberado, inativo ou com CPF ou senha errados recebe a mesma mensagem genérica (401) | Público | RN12, RN15 |
| **RF03** | Consultar os próprios dados (`GET /auth/me`): o funcionário recebe o cadastro com o cargo, o aluno recebe os dados do membro; a senha nunca é devolvida | ADMIN, RECEPCIONISTA, INSTRUTOR, ALUNO | RN12 |
| **RF04** | Exigir token em todas as rotas, exceto os dois logins e `GET /health`; token ausente, inválido ou expirado → 401; funcionário ou aluno desativado (ou aluno com acesso revogado) perde o acesso na hora, sem esperar o token expirar | Todos | RN14 |
| **RF05** | Restringir cada rota aos cargos da matriz de permissões (sem permissão → 403); o aluno não entra em rota de funcionário nem o funcionário em rota do aluno | Todos | RN16, RN17 |

O login dos dois tipos não depende de cargo: quem não tem cadastro ativo não passa do 401. O segredo do token (`JWT_SECRET`) precisa ter pelo menos **32** caracteres, e a validade (`JWT_EXPIRES_IN`) precisa ser um valor válido; se não for, a API não sobe.

### 4.2 Funcionários

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF10** | Cadastrar funcionário com nome (**3 a 100** caracteres), cargo (ADMIN, RECEPCIONISTA ou INSTRUTOR), login (**3 a 30** letras e números) e senha (no mínimo **8** caracteres e no máximo **72** bytes); login repetido → 409 | ADMIN | RN12, RN13 |
| **RF11** | Listar funcionários com paginação, ordenados por nome, com filtro por cargo e por ativo/inativo | ADMIN | — |
| **RF12** | Consultar um funcionário pelo identificador (inexistente → 404) | ADMIN | RN12 |
| **RF13** | Editar nome, cargo e senha de um funcionário; o login não pode ser alterado; não é possível tirar o cargo de ADMIN do último administrador ativo (422) | ADMIN | RN12, RN13 |
| **RF14** | Desativar um funcionário, sem excluir o cadastro; ninguém desativa a si mesmo nem o último administrador ativo (422) | ADMIN | RN03, RN13 |
| **RF15** | Reativar um funcionário desativado | ADMIN | RN03 |

Só o ADMIN acessa as rotas de funcionários; os outros cargos e o ALUNO recebem 403.

### 4.3 Membros

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF20** | Cadastrar membro com nome (**3 a 120** caracteres), CPF válido, telefone (10 ou 11 dígitos) e endereço (**5 a 200** caracteres); o CPF e o telefone são guardados só com os números e o membro começa ativo | ADMIN, RECEPCIONISTA | RN01, RN02 |
| **RF21** | Listar membros com paginação, ordenados por nome, com busca por nome parcial (sem diferenciar maiúsculas) ou CPF e filtro por ativo/inativo | ADMIN, RECEPCIONISTA, INSTRUTOR | — |
| **RF22** | Consultar um membro pelo identificador (inexistente → 404) | ADMIN, RECEPCIONISTA, INSTRUTOR | — |
| **RF23** | Editar nome, telefone e endereço de um membro; o CPF não pode ser alterado | ADMIN, RECEPCIONISTA | RN02 |
| **RF24** | Desativar e reativar um membro, sem excluir o cadastro; membro inativo não recebe novo treino, pagamento nem atividade | ADMIN, RECEPCIONISTA | RN03, RN04 |
| **RF25** | Consultar a ficha resumida do membro: dados, situação financeira, treino mais recente e total de atividades nos últimos 30 dias | ADMIN, RECEPCIONISTA | RN09 |
| **RF26** | Liberar, redefinir (senha com no mínimo 8 caracteres) e revogar o acesso do aluno ao portal; membro inativo não recebe acesso, e a senha nunca é devolvida pela API | ADMIN, RECEPCIONISTA | RN12, RN15 |

O INSTRUTOR só lista e consulta membros; a ficha resumida fica de fora porque traz a situação financeira, e pagamentos são só do ADMIN e da RECEPCIONISTA. O ALUNO não acessa as rotas de membros (403).

### 4.4 Treinos

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF30** | Criar treino para um membro ativo, com tipo da lista (Musculação, Cardio, Funcional, Alongamento, Crossfit, Outro), descrição (**3 a 500** caracteres), duração de **1 a 300 min** e data de início a partir de hoje | ADMIN, INSTRUTOR | RN04, RN05 |
| **RF31** | Listar treinos com paginação e filtros por membro e tipo, e listar os treinos de um membro | ADMIN, RECEPCIONISTA, INSTRUTOR | — |
| **RF32** | Consultar um treino pelo identificador (inexistente → 404) | ADMIN, RECEPCIONISTA, INSTRUTOR | — |
| **RF33** | Editar tipo, descrição, duração e data de início de um treino, revalidando os campos enviados (a data de início só é revalidada se for alterada); o membro do treino não pode ser trocado | ADMIN, INSTRUTOR | RN05 |
| **RF34** | Excluir um treino; as atividades ligadas a ele continuam no histórico, sem o vínculo | ADMIN, INSTRUTOR | — |
| **RF35** | O aluno consulta os próprios treinos (lista paginada com filtro por tipo, mais recentes primeiro, e detalhe); o treino de outro membro responde 404 | ALUNO | RN16, RN17 |

A RECEPCIONISTA só consulta; quem cria, edita e exclui é o INSTRUTOR ou o ADMIN.

### 4.8 Membros e treinos: rastreabilidade, cronograma e demonstração (Gabriel)

Status em 11/11/2026: ✅ implementado (na `main`) · 🔄 em revisão (PR aberto) · ⏳ planejado.

**Rastreabilidade requisito → critério → teste → arquivo**

| RF | CA | Teste | Arquivo | Status |
| --- | --- | --- | --- | --- |
| **RF20** cadastrar membro | CA02 | unitário (create, CPF duplicado → 409), HTTP (CPF e telefone só com dígitos, CPF inválido → 400), matriz de permissões | `apps/api/src/membros/membros.service.spec.ts`, `membros.http.spec.ts`, `test/seguranca.e2e-spec.ts` | ✅ |
| **RF21** listar membros | CA02 | unitário (busca por nome/CPF, filtro ativo, paginação), matriz de permissões | `membros.service.spec.ts`, `test/seguranca.e2e-spec.ts` | ✅ |
| **RF22** consultar membro | — | unitário (404), matriz de permissões | `membros.service.spec.ts`, `test/seguranca.e2e-spec.ts` | ✅ |
| **RF23** editar membro | — | unitário (CPF fora do update), HTTP (CPF no body → 400) | `membros.service.spec.ts`, `membros.http.spec.ts` | ✅ |
| **RF24** desativar e reativar | CA12 | unitário (`desativar`, `reativar`, `assertMembroAtivo` → 422), e2e sem token → 401 | `membros.service.spec.ts`, `test/membros.e2e-spec.ts` | ✅ |
| **RF25** ficha resumida | — | MEM-06 (unitário, HTTP e matriz de permissões), tela WEB-G3 (Testing Library) | `apps/api/src/membros/` e `apps/web/src/features/membros/` (a criar) | ⏳ |
| **RF26** acesso do aluno ao portal | — | MEM-07: unitário (liberar, redefinir, revogar, inativo → 422, 404, sem `senhaHash`), HTTP (senha < 8 → 400), e2e (recepção libera, aluno loga, revogado não loga), matriz de permissões | `membros.service.spec.ts`, `membros.http.spec.ts`, `test/membros.e2e-spec.ts`, `test/seguranca.e2e-spec.ts` | 🔄 PR #60 (Pedro) |
| **RF30** criar treino | CA03 | unitário (RN04 → 422, RN05 → 400, data = hoje passa), HTTP (body inválido → 400), matriz de permissões (RECEPCIONISTA → 403) | `apps/api/src/treinos/treinos.service.spec.ts`, `treinos.http.spec.ts`, `test/seguranca.e2e-spec.ts` | ✅ (PR #55) |
| **RF31** listar treinos e treinos do membro | CA06 (escolha do treino) | unitário (filtros, paginação, membro inexistente → 404) | `treinos.service.spec.ts`, `membros-treinos.controller.spec.ts` | ✅ (PR #55) |
| **RF32** consultar treino | — | unitário (404) | `treinos.service.spec.ts` | ✅ (PR #55) |
| **RF33** editar treino | — | unitário (a data só é revalidada quando muda) | `treinos.service.spec.ts` | ✅ (PR #55) |
| **RF34** excluir treino | — | unitário (404), HTTP (204), matriz de permissões | `treinos.service.spec.ts`, `treinos.http.spec.ts`, `test/seguranca.e2e-spec.ts` | ✅ (PR #55) |
| **RF35** treinos do aluno | — | unitário e HTTP (`membroId` do token, outro membro → 404, `membroId` na query → 400), e2e RN16 | `treinos.service.spec.ts`, `meus-treinos.http.spec.ts`, `test/seguranca.e2e-spec.ts` | ✅ (PR #55) |
| RF20 a RF35 (validações ponta a ponta) | CA02, CA03 | E2E-04 | `test/membros-treinos.e2e-spec.ts` (a criar) | ⏳ |

**Cronograma do que falta (membros e treinos)**

Em 11/11, a MEM-07, a WEB-G6 e a E2E-04 passaram do Gabriel para o Pedro (veja a seção 5 do backlog).

| Task | O que entrega | Responsável | Data |
| --- | --- | --- | --- |
| PR #55 (TRE-02 a TRE-05) | módulo de treinos na API, libera o passo 3 do E2E-02 | Gabriel | ✅ mergeado em 11/11 |
| MEM-07 | liberar, redefinir e revogar o acesso do aluno (RF26) | Pedro | 🔄 PR #60 |
| MEM-06 | `GET /membros/:id/resumo` (ficha, RF25) | Gabriel | 13/11 |
| WEB-G1, WEB-G2 | lista e formulário de membros | Gabriel | 14/11 |
| WEB-G3, WEB-G4 | ficha do membro e telas de treinos | Gabriel | 14/11 a 15/11 |
| WEB-G5 | testes do front de membros e treinos | Gabriel | 16/11 |
| WEB-G6 | "Meus treinos" do portal do aluno e o componente de acesso da ficha | Pedro | 16/11 |
| E2E-04 | e2e das validações de membros e treinos | Pedro | 16/11 |

**Demonstração: membros e treinos (passos 2 e 3 do fluxo)**

Antes: `pnpm db:seed` e `pnpm dev` (API em `:3000`). Todos os dados são fictícios; a senha dos logins do seed é `senha1234`. Enquanto as telas WEB-G1 a G4 não entram, a demonstração é pela API:

1. Login da recepção (`recepcao`) e do instrutor (`instrutor`) em `POST /auth/login` e guardar os dois tokens.
2. **CA02:** com o token da recepção, `GET /membros?busca=Diego` mostra o Diego Rocha ativo; `POST /membros` com um CPF fictício válido cadastra um membro novo, que já começa ativo.
3. **RN04:** com o token do instrutor, `POST /treinos` para a Isabela Moura (inativa no seed) → 422.
4. **RN05:** `POST /treinos` para o Diego com `dataInicio` de ontem → 400.
5. **CA03:** `POST /treinos` para o Diego com tipo `Musculação`, duração 45 e `dataInicio` de hoje → 201; `GET /membros/:id/treinos` mostra o treino.
6. **Permissão:** o mesmo `POST /treinos` com o token da recepção → 403.
7. **RN16:** login da aluna Ana Souza em `POST /auth/login-aluno`; `GET /me/treinos` lista só os treinos dela, e `GET /me/treinos/<id do treino do Diego>` → 404.

### 4.5 Pagamentos

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF40** | Lançar mensalidade para um membro ativo, com valor de **0,01 a 10.000** (2 casas decimais) e data de vencimento obrigatória | ADMIN, RECEPCIONISTA | RN04, RN06 |
| **RF41** | Listar pagamentos com paginação e filtros por membro, status (PENDENTE, PAGO, ATRASADO, CANCELADO) e período de vencimento; cada item traz o status calculado e os dias em atraso | ADMIN, RECEPCIONISTA | RN07 |
| **RF42** | Consultar um pagamento pelo identificador (inexistente → 404) | ADMIN, RECEPCIONISTA | RN07 |
| **RF43** | Registrar o pagamento de uma mensalidade, com data do pagamento opcional (padrão: hoje; não pode ser futura) | ADMIN, RECEPCIONISTA | RN08 |
| **RF44** | Cancelar uma mensalidade que ainda não foi paga (já paga → 409) | ADMIN, RECEPCIONISTA | RN08 |
| **RF45** | Consultar a situação financeira de um membro: em dia ou inadimplente, quantidade de pagamentos atrasados e maior atraso em dias | ADMIN, RECEPCIONISTA | RN07, RN09 |

O INSTRUTOR e o ALUNO não acessam pagamentos (403).

### 4.6 Histórico de atividades

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF50** | Registrar atividade de um membro (descrição de **3 a 120** caracteres, data não futura, tempo de **1 a 600 min**, treino opcional do mesmo membro); o funcionário logado é gravado automaticamente | ADMIN, INSTRUTOR | RN04, RN09, RN10, RN11 |
| **RF51** | Listar atividades com paginação e filtros por membro, funcionário e período | ADMIN, RECEPCIONISTA, INSTRUTOR | — |
| **RF52** | Consultar uma atividade pelo identificador (inexistente → 404) e o histórico de um membro | ADMIN, RECEPCIONISTA, INSTRUTOR | — |
| **RF53** | O aluno consulta o próprio histórico (lista com filtro de período, detalhe e resumo do período), sem ver dados de outros membros nem do funcionário além do nome | ALUNO | RN16, RN17 |

A RECEPCIONISTA só consulta; quem registra é o INSTRUTOR ou o ADMIN.

### 4.7 Dashboard

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF60** | Consultar o resumo do dia (`GET /dashboard`): membros ativos, membros inadimplentes, pagamentos atrasados, receita do mês (pagamentos pagos com data de pagamento dentro do mês corrente) e atividades de hoje | ADMIN, RECEPCIONISTA, INSTRUTOR | RN07, RN09 |
| **RF61** | Listar os membros inadimplentes (`GET /dashboard/inadimplentes`), em ordem de nome, com o maior atraso de cada um em dias | ADMIN, RECEPCIONISTA | RN09 |

Os números reaproveitam os services de membros, pagamentos e histórico, então seguem as mesmas regras desses módulos. O INSTRUTOR vê o resumo, mas a lista de inadimplentes traz situação financeira e dá 403 para ele; o ALUNO não acessa o dashboard (403).

## 5. Requisitos não funcionais

Cada requisito tem uma meta com número e uma forma de verificar. Só entram metas que o repositório configura ou que o backlog define.

| ID | Requisito | Meta mensurável | Como é verificado |
| --- | --- | --- | --- |
| **RNF01** | Cobertura de testes | Cobertura **≥ 80%** (mínimo da A3: **75%**) na API e no front | Jest e Vitest geram o `lcov.info` no CI e o SonarCloud calcula a cobertura (badge no README); a última medição registrada foi 99,4% em 09/11/2026 |
| **RNF02** | Quality gate do SonarCloud | Gate **Sonar way** aprovado: código novo com cobertura **≥ 80%**, duplicação **≤ 3%**, ratings de confiabilidade, segurança e manutenibilidade **A** e **100%** dos security hotspots revisados | O passo do Sonar no CI usa `sonar.qualitygate.wait=true`; gate reprovado deixa o CI vermelho |
| **RNF03** | Integração contínua obrigatória para o merge | **0** PRs mergeados com o check "Lint, build e testes" vermelho; **1** aprovação de outro integrante; merge sem squash | Proteção da `main` (ruleset versionado em `.github/rulesets/main.json`; em 11/11 a regra ativa no GitHub está com 0 aprovações obrigatórias e precisa ser reaplicada a partir desse arquivo); o CI roda lint, build, testes unitários, e2e com Postgres e Sonar |
| **RNF04** | Senhas | Hash **bcrypt com 10 rounds**; senha de **8 a 72 bytes**; **0** respostas da API com `senhaHash` | Testes unitários de funcionários e auth; `auth.e2e-spec.ts` confere que o hash não sai nas respostas |
| **RNF05** | Sessão | Token JWT (HS256) que expira em **8 h**; `JWT_SECRET` com **≥ 32** caracteres (senão a API não sobe) | Testes unitários de `expiracao-token` e `segredo-jwt`; `seguranca.e2e-spec.ts` cobre token inválido e expirado → 401 |
| **RNF06** | Controle de acesso | **100%** das rotas com `@Roles` ou `@Public`; matriz de permissões (401, 403 e sucesso por cargo) testada por HTTP | `test/seguranca.e2e-spec.ts` roda no CI; o teste "cobertura da matriz" falha se uma rota ficar de fora. Evidência em `docs/evidencias/permissoes/README.md` |
| **RNF07** | Login sem vazamento de informação | **1** mensagem genérica ("Login ou senha inválidos") para login inexistente, senha errada, funcionário ou membro inativo e aluno sem acesso; o hash é comparado mesmo quando a conta não existe | Testes unitários do `AuthService` e e2e de auth |
| **RNF08** | Validação de entrada | **100%** dos corpos e filtros passam pelo `ValidationPipe` global; campo desconhecido → 400 | `configurar-app.spec.ts`, testes HTTP e e2e; os DTOs têm specs próprios |
| **RNF09** | Paginação | Listagens com `pageSize` padrão **20** e máximo **100**; resposta no formato `{ data, total, page, pageSize }` | `pagination-query.dto.spec.ts` e os testes de cada listagem |
| **RNF10** | Desempenho | Listagens paginadas respondem em **menos de 500 ms** (meta do backlog) | Medição manual na demonstração, com os dados do seed; ainda não há teste automatizado de tempo |
| **RNF11** | Privacidade (LGPD) | **0** dados pessoais reais no repositório: CPF, telefone e endereço de seed, testes e prints são fictícios | Revisão do PR (regra 9 do backlog); `pnpm db:seed` cria só dados fictícios |
| **RNF12** | Mensagens de erro | Erros no formato padrão `{ statusCode, message, error }`, com mensagens de validação em português | Specs dos DTOs e testes HTTP conferem o texto e o status |

## 6. Regras de negócio

Mesma tabela da [seção 4.1 do backlog](BACKLOG.md#41-regras-de-negócio); se uma regra mudar, ela muda lá primeiro.

| ID | Regra | Dono | Resposta da API ao violar |
| --- | --- | --- | --- |
| **RN01** | O CPF deve ser válido (dígitos verificadores, sem sequências repetidas como `111.111.111-11`) e é guardado só com os números | Gabriel | 400 |
| **RN02** | O CPF é único no sistema e não pode ser alterado depois do cadastro | Gabriel | 409 (duplicado) / 400 (tentar alterar) |
| **RN03** | Membro e funcionário **não são excluídos**, apenas desativados (`ativo = false`) e reativados | Gabriel / Pedro | — |
| **RN04** | Membro **inativo** não pode receber novo treino, novo pagamento nem nova atividade | Gabriel (helper) / todos usam | 422 |
| **RN05** | Treino: duração entre **1 e 300 min**; `dataInicio` não pode ser anterior a hoje; tipo deve ser um da lista (Musculação, Cardio, Funcional, Alongamento, Crossfit, Outro) | Gabriel | 400 |
| **RN06** | Pagamento: valor **> 0 e ≤ 10.000**; data de vencimento obrigatória; vencimento e data de pagamento com no máximo **90 dias no passado** (constante `DIAS_RETROATIVOS_MAX = 90`); no máximo **uma cobrança não cancelada** por membro em cada vencimento | Yohan | 400 / 409 |
| **RN07** | O status do pagamento é **calculado**. No banco ficam só `PENDENTE`, `PAGO` e `CANCELADO`. Na resposta: `CANCELADO` se cancelado; `PAGO` se tem `dataPagamento`; `ATRASADO` se o vencimento é anterior a hoje e não foi pago; senão `PENDENTE` | Yohan | — |
| **RN08** | Não é possível pagar um pagamento já pago ou cancelado, nem cancelar um pagamento já pago | Yohan | 409 |
| **RN09** | Membro **inadimplente** é aquele com algum pagamento atrasado há **mais de 10 dias** (constante `DIAS_TOLERANCIA = 10`). Inadimplente **não pode registrar atividade** | Yohan | 422 ("Membro com pagamento em atraso") |
| **RN10** | Atividade: tempo de execução entre **1 e 600 min**; a data não pode ser futura; se tiver `treinoId`, o treino deve ser **do mesmo membro** | Yohan | 400 / 422 |
| **RN11** | A atividade registra automaticamente o funcionário logado (`funcionarioId` vem do token, não do body) | Yohan | — |
| **RN12** | Senha guardada só como hash (bcrypt) e nunca devolvida pela API. Login e senha errados ou funcionário inativo recebem a **mesma** mensagem genérica | Pedro | 401 |
| **RN13** | O login é único. Um funcionário não pode desativar a si mesmo, e o sistema não pode ficar sem nenhum ADMIN ativo | Pedro | 409 / 422 |
| **RN14** | Todas as rotas exigem JWT, exceto `POST /auth/login`, `POST /auth/login-aluno` e `GET /health`. O token expira em 8h | Pedro | 401 |
| **RN15** | **Aluno** (membro) faz login com **CPF + senha**. O acesso é liberado pela recepção ou pelo admin, que define a senha inicial. Membro sem acesso liberado ou **inativo** não consegue logar (mesma mensagem genérica da RN12) | Pedro (login e liberar acesso) | 401 |
| **RN16** | O aluno **só enxerga os próprios dados**: os próprios treinos e o próprio histórico. O `membroId` vem **sempre do token**, nunca da URL ou do body. Pedir um treino ou atividade de outro membro → 404, para não revelar que o recurso existe | Gabriel (treinos) / Yohan (histórico) | 404 |
| **RN17** | O aluno é **somente leitura**: não cria, edita nem exclui nada, inclusive treinos e atividades próprios | Pedro (RBAC) | 403 |

## 7. Fluxo principal e critérios de aceitação

O fluxo principal é o caminho que a demo e o teste e2e `test/fluxo-principal.e2e-spec.ts` (E2E-02) percorrem. Os cenários de inadimplência são cobertos pelo E2E-03.

1. Login do funcionário
2. Cadastrar membro
3. Criar treino
4. Lançar pagamento
5. Registrar o pagamento
6. Registrar atividade
7. Consultar o histórico do membro
8. Conferir o dashboard

### 7.1 Critérios de aceitação do fluxo principal

**CA01 · Login do funcionário**

- **Dado** um funcionário ativo com login e senha válidos
- **Quando** ele faz login
- **Então** recebe um token válido por 8 horas, e `GET /auth/me` com esse token devolve o seu cargo

**CA02 · Cadastrar membro**

- **Dado** uma recepcionista logada e um CPF válido ainda não cadastrado
- **Quando** ela cadastra o membro
- **Então** o membro fica ativo e aparece na lista de membros

**CA03 · Criar treino**

- **Dado** um instrutor logado e um membro ativo
- **Quando** ele cria um treino com tipo da lista, duração entre 1 e 300 min e início a partir de hoje
- **Então** o treino fica vinculado ao membro

**CA04 · Lançar pagamento**

- **Dado** uma recepcionista logada e um membro ativo
- **Quando** ela lança uma mensalidade de R$ 100,00 com vencimento futuro
- **Então** o pagamento é criado com status PENDENTE

**CA05 · Registrar pagamento**

- **Dado** um pagamento PENDENTE
- **Quando** a recepcionista registra o pagamento sem informar a data
- **Então** o status passa a PAGO, com a data de hoje

**CA06 · Registrar atividade**

- **Dado** um instrutor logado, um membro ativo e em dia, e o treino do CA03
- **Quando** ele registra uma atividade de 60 min com data de hoje
- **Então** a atividade é gravada com o instrutor como responsável

**CA07 · Consultar histórico**

- **Dado** o membro com a atividade do CA06
- **Quando** a recepcionista consulta o histórico do membro
- **Então** a atividade aparece no histórico do membro, com o nome do instrutor e os 60 minutos

**CA08 · Conferir o dashboard**

- **Dado** o membro, o pagamento e a atividade dos CA02 a CA06
- **Quando** a recepcionista consulta o dashboard
- **Então** o membro conta nos membros ativos, os R$ 100,00 entram na receita do mês e a atividade entra nas atividades de hoje

### 7.2 Cenários alternativos (inadimplência, RN09)

O limite da tolerância (atraso de 10 dias ainda em dia, de 11 dias inadimplente) é verificado nos unitários PAG-02 e PAG-06; os cenários abaixo usam 15 e 5 dias, como o E2E-03.

**CA09 · Atraso acima da tolerância**

- **Dado** um membro com pagamento vencido há 15 dias e não pago
- **Quando** o instrutor tenta registrar uma atividade
- **Então** recebe 422 "Membro com pagamento em atraso" e nada é gravado

**CA10 · Atraso dentro da tolerância**

- **Dado** um membro com pagamento vencido há 5 dias (dentro da tolerância de 10 dias)
- **Quando** o instrutor registra uma atividade
- **Então** a atividade é gravada

**CA11 · Regularização do atraso**

- **Dado** o membro do CA09
- **Quando** a recepcionista registra o pagamento atrasado e o instrutor tenta de novo
- **Então** a atividade é gravada (201)

**CA12 · Membro inativo**

- **Dado** um membro inativo
- **Quando** a recepcionista tenta lançar um pagamento ou o instrutor tenta registrar uma atividade
- **Então** recebe 422

### 7.3 Rastreabilidade

Status em 11/11/2026: ✅ implementado (na `main`) · 🔄 em revisão (PR aberto) · ⏳ planejado. A rastreabilidade por requisito de membros e treinos está na seção 4.8.

| Critério | RFs | RNs | Teste | Arquivo | Status |
| --- | --- | --- | --- | --- | --- |
| **CA01** | RF01, RF03 | RN14 | E2E-02 | `apps/api/test/fluxo-principal.e2e-spec.ts` | ✅ (PR #57) |
| **CA02** | RF20, RF21 | RN01, RN02 | E2E-02 | `apps/api/test/fluxo-principal.e2e-spec.ts` | ✅ (PR #57) |
| **CA03** | RF30 | RN04, RN05 | E2E-02 | `apps/api/test/fluxo-principal.e2e-spec.ts` | ✅ (PR #57) |
| **CA04** | RF40 | RN06, RN07 | E2E-02 | `apps/api/test/fluxo-principal.e2e-spec.ts` | ✅ (PR #57) |
| **CA05** | RF43 | RN08 | E2E-02 | `apps/api/test/fluxo-principal.e2e-spec.ts` | ✅ (PR #57) |
| **CA06** | RF50 | RN04, RN09, RN10, RN11 | E2E-02 | `apps/api/test/fluxo-principal.e2e-spec.ts` | ✅ (PR #57) |
| **CA07** | RF52 | — | E2E-02 | `apps/api/test/fluxo-principal.e2e-spec.ts` | ✅ (PR #57) |
| **CA08** | RF60 | — | E2E-02 | `apps/api/test/fluxo-principal.e2e-spec.ts` | ✅ (PR #57) |
| **CA09** | RF50 | RN09 | E2E-03 | `apps/api/test/inadimplencia.e2e-spec.ts` | ✅ (PR #26) |
| **CA10** | RF50 | RN09 | E2E-03 | `apps/api/test/inadimplencia.e2e-spec.ts` | ✅ (PR #26) |
| **CA11** | RF43, RF50 | RN09 | E2E-03 | `apps/api/test/inadimplencia.e2e-spec.ts` | ✅ (PR #26) |
| **CA12** | RF40, RF50 | RN04 | PAG-06 / HIS-04 (unitário) | `apps/api/src/pagamentos/pagamentos.service.spec.ts`, `apps/api/src/historico/historico.service.spec.ts` | ✅ |
| Limite de 10/11 dias | RF45 | RN09 | PAG-02 / PAG-06 (unitário) + E2E-03 | `apps/api/src/pagamentos/pagamento-status.spec.ts`, `pagamentos.service.spec.ts`, `test/inadimplencia.e2e-spec.ts` | ✅ |

A cobertura de 100% do escopo analisado vale só para o que já está na `main`; os módulos ⏳ entram na rastreabilidade quando forem entregues.

### 7.4 Cronograma do que falta para o fluxo principal

| Entrega | O que libera | Responsável | Data |
| --- | --- | --- | --- |
| Merge do PR #55 (TRE-02 a TRE-05) | módulo de treinos na API (passo 3 do fluxo) | Gabriel | ✅ 11/11 |
| Merge do E2E-02 (`fluxo-principal.e2e-spec.ts`) | teste de sistema CA01–CA08 com banco de teste | Gabriel | ✅ 11/11 (PR #57) |
| MEM-06 | ficha do membro (RF25) | Gabriel | 13/11 |
| MEM-07 | acesso do aluno (RF26) | Pedro | 🔄 PR #60 |
| WEB-G1 a WEB-G4 | telas de membros e treinos (passos 2 e 3 pela interface) | Gabriel | 14/11 a 15/11 |
| WEB-G5 | testes do front de membros e treinos | Gabriel | 16/11 |
| WEB-G6 e E2E-04 | "Meus treinos" e e2e de validações | Pedro | 16/11 |
| E2E-05 (RN16 aluno × aluno) | fecha o e2e de segurança | Pedro | 🔄 PR #59 |
| QA-01 a QA-05 | issues do Sonar zeradas, cobertura consolidada ≥ 75% e quality gate aprovado | Pedro, Gabriel e Yohan | 17/11 a 23/11 (code freeze) |

As telas de login, pagamentos, histórico e dashboard já estão na `main`; as únicas telas que faltam para percorrer o fluxo pela interface são as de membros e treinos.

### 7.5 Demonstração do fluxo e participação de cada integrante

Preparação: `pnpm install`, `docker compose up -d`, `pnpm db:migrate`, `pnpm db:seed` e `pnpm dev` (API em `:3000`, web em `:3001`). Todos os dados são fictícios (LGPD) e as datas do seed são relativas a hoje; a senha dos logins do seed é `senha1234`. A prova automática do mesmo roteiro é o `pnpm --filter api test:e2e` (E2E-02 e E2E-03).

| Passo | CA | Como demonstrar | Quem apresenta (dono do módulo) |
| --- | --- | --- | --- |
| 1 Login do funcionário | CA01 | login `recepcao` na tela de login; o menu mostra o cargo | Pedro |
| 2 Cadastrar membro | CA02 | cadastro de um membro novo com CPF fictício válido; ele aparece ativo na lista (pela API até a WEB-G2 entrar; roteiro na seção 4.8) | Gabriel |
| 3 Criar treino | CA03 | login `instrutor`, treino de Musculação de 45 min a partir de hoje para o membro (roteiro, RN04, RN05 e permissão na seção 4.8) | Gabriel |
| 4 Lançar pagamento | CA04 | tela de pagamentos, mensalidade de R$ 100,00 com vencimento futuro → PENDENTE | Yohan |
| 5 Registrar pagamento | CA05 | "Registrar pagamento" sem data → PAGO com a data de hoje | Yohan |
| 6 Registrar atividade | CA06 | tela de histórico, atividade de 60 min hoje com o treino do passo 3 | Yohan |
| 7 Consultar histórico | CA07 | histórico do membro mostra a atividade com o instrutor e os 60 min | Yohan |
| 8 Conferir o dashboard | CA08 | os cards mostram o membro ativo, os R$ 100,00 na receita do mês e a atividade de hoje | Pedro |
| Alternativo: inadimplência | CA09–CA11 | Bruno Lima (seed, inadimplente): o registro de atividade mostra "Membro com pagamento em atraso"; depois de pagar, registra | Yohan |
| Alternativo: portal do aluno | RF35, RN16 | login da aluna Ana Souza: "Minhas atividades" e `/me/treinos` só com os dados dela | Gabriel |

Divisão do trabalho, pelos responsáveis do backlog: Pedro (infraestrutura, CI/Sonar, autenticação, funcionários, dashboard, coordenação do escopo, acesso do aluno e tela "Meus treinos"), Gabriel (membros, treinos e a API dos treinos do aluno) e Yohan (pagamentos, histórico de atividades, critérios de aceitação e e2e de inadimplência).
