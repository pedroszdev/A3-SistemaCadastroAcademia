# Quality gate e escopo das métricas

Responde à issue [#30](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/issues/30). Este documento mostra três coisas:

- como uma reprovação do quality gate do SonarCloud barra o merge na `main`;
- o que as métricas medem e o que fica de fora;
- os registros de cobertura, Sonar e CI, cada um ligado a um commit.

Relação com a A3: itens 2.7 (ferramentas), 2.10 (critérios de aceitação) e 2.12 (relatórios de métricas).

## 1. Como o gate barra o merge

```
PR para a main
  └─ workflow CI (.github/workflows/ci.yml), job "Lint, build e testes"
       ├─ lint, build, testes unitários (API e web, com cobertura), e2e da API
       ├─ Verificar SONAR_TOKEN   → sem token, em qualquer evento: o job falha
       └─ Análise do SonarCloud   → sonar.qualitygate.wait=true
            └─ gate FAILED → o passo falha → o job fica vermelho
                 └─ a proteção da main exige o check "Lint, build e testes" → merge bloqueado
```

O bloqueio fica em dois lugares:

1. **No workflow.** O [`sonar-project.properties`](../../../sonar-project.properties) define `sonar.qualitygate.wait=true` e `sonar.qualitygate.timeout=300`. Com isso, o passo "Análise do SonarCloud" espera o SonarCloud calcular o gate e só fica verde se o gate for **Passed**. Se o gate reprovar, ou se o resultado não chegar em 5 minutos, o passo falha.
2. **Na proteção da `main`.** Um ruleset da `main` exige o check `Lint, build e testes` (do GitHub Actions, `integration_id` 15368) rodado sobre a `main` atual, 1 aprovação dada depois do último push e merge só por PR, sem bypass, nem para admin. Como a espera pelo gate roda **dentro** desse job, nenhum check extra precisa ser exigido: um gate reprovado já deixa vermelho o check que a proteção exige.

   **Achado de 05/11/2026.** A proteção da `main` foi configurada na INF-01, mas estava **desativada** nesta data:
   - `gh api repos/pedroszdev/A3-SistemaCadastroAcademia/branches/main --jq .protected` devolvia `false`;
   - `gh api repos/pedroszdev/A3-SistemaCadastroAcademia/rules/branches/main` devolvia `[]` (regras desativadas não aparecem);
   - no PR #31, o botão de merge ficava liberado com o CI ainda rodando.

   Nesse período, o gate deixava o check vermelho, mas nada impedia o merge. A proteção foi refeita no mesmo dia, como o ruleset `26615335` descrito abaixo. Para não depender de uma configuração que pode ser desligada sem deixar rastro no código, as regras também ficam versionadas no repositório.

   **Configuração versionada.** O ruleset está em [`.github/rulesets/main.json`](../../../.github/rulesets/main.json). O arquivo é a fonte da verdade: qualquer mudança na proteção passa por PR nele e depois é aplicada por um admin com `PUT`, que atualiza o ruleset existente em vez de criar outro:

   ```bash
   gh api -X PUT repos/pedroszdev/A3-SistemaCadastroAcademia/rulesets/26615335 --input .github/rulesets/main.json
   ```

   Para conferir se o ruleset ativo continua igual ao arquivo (sem saída = iguais):

   ```bash
   diff <(jq -S '{name, target, enforcement, bypass_actors, conditions, rules}' .github/rulesets/main.json) \
        <(gh api repos/pedroszdev/A3-SistemaCadastroAcademia/rulesets/26615335 \
            | jq -S '{name, target, enforcement, bypass_actors, conditions, rules}')
   ```

   O ruleset aplica estas regras:
   - sem bypass (`bypass_actors` vazio);
   - PR obrigatório com 1 aprovação. Um push novo descarta as aprovações anteriores (`dismiss_stale_reviews_on_push`), e o último push precisa ser aprovado por outra pessoa (`require_last_push_approval`), então o diff final sempre passa por revisão;
   - merge só por merge commit ou rebase, nunca squash;
   - check `Lint, build e testes` obrigatório, rodado com a branch atualizada com a `main` (`strict_required_status_checks_policy`). Assim, o gate de cada PR é calculado sobre a `main` que ele vai encontrar no merge, e dois PRs aprovados separadamente não reprovam a `main` juntos;
   - sem force push nem exclusão da `main`.

   **Evidência da configuração.** Os comandos abaixo leem a configuração ativa e funcionam para qualquer pessoa com acesso de leitura:

   ```bash
   gh api repos/pedroszdev/A3-SistemaCadastroAcademia/branches/main --jq .protected   # true
   gh api repos/pedroszdev/A3-SistemaCadastroAcademia/rules/branches/main \
     --jq '.[] | {type, parameters}'                                                   # pull_request, required_status_checks, ...
   ```

   | Registro | Valor |
   | --- | --- |
   | Ruleset | "Sem merge até o CI rodar" (id `26615335`), `enforcement: active` |
   | Criado por | Pedro (admin do repositório), substituindo a proteção desativada; atualizado com `PUT` a partir do arquivo versionado |
   | Data | 05/11/2026, 10:10 (horário de Brasília; `created_at` do ruleset) |
   | Bypass | `bypass_actors: []`: ninguém pode ignorar as regras, nem admin |
   | `.protected` | `true` |
   | Regras ativas (`rules/branches/main`) | `deletion`, `non_fast_forward`, `pull_request` (1 aprovação, `dismiss_stale_reviews_on_push` e `require_last_push_approval` ligados, `allowed_merge_methods: ["merge", "rebase"]`), `required_status_checks` (`Lint, build e testes`, `integration_id` 15368, `strict_required_status_checks_policy: true`) |
   | Efeito no PR #31 | passou de mergeável com o CI rodando para `mergeStateStatus: BLOCKED`, `reviewDecision: REVIEW_REQUIRED` |
   | Print de *Settings → Rules → Rulesets* | `00-ruleset-main.png` (_a preencher_) |

O quality gate usado é o **Sonar way**, o padrão do SonarCloud. Ele vale para o código novo:

| Condição | Limite para reprovar |
| --- | --- |
| Reliability rating | pior que A |
| Security rating | pior que A |
| Maintainability rating | pior que A |
| Cobertura | menor que 80% |
| Linhas duplicadas | maior que 3% |
| Security hotspots revisados | menor que 100% |

## 2. Análise enviada × gate aprovado

| | Antes (de `d1041bf`, 14/10, até este PR) | Agora |
| --- | --- | --- |
| Passo do Sonar verde quando… | o relatório foi **enviado** ao SonarCloud | o gate foi **aprovado** |
| Gate reprovado | aparecia só no comentário do Sonar no PR, e o check do CI continuava verde | o passo falha e o check `Lint, build e testes` fica vermelho |
| `SONAR_TOKEN` ausente | o passo era pulado em silêncio em qualquer evento | falha o job em qualquer evento |

**Sem exceção para PR de fork.** O GitHub não entrega os secrets do Actions a workflows disparados por PR de fork nem pelo Dependabot. Se esses PRs pulassem a análise, o check exigido ficaria verde sem gate e o merge seria liberado. Por isso, faltar o token é erro em qualquer evento: PR de fork fica vermelho e precisa ser refeito a partir de uma branch do próprio repositório, que é como o grupo já trabalha. Se o Dependabot for ativado, o `SONAR_TOKEN` precisa ser cadastrado também como secret do Dependabot.

**Toda execução na `main` termina.** O `concurrency` do workflow só cancela execuções anteriores em PR, onde o push novo substitui o antigo. No push na `main` e na execução manual, cada execução tem grupo próprio, então dois merges seguidos não cancelam um ao outro e cada commit da `main` tem sua análise e seu gate.

## 3. Escopo da análise e exclusões

**Fontes analisadas:** `apps/api/src` e `apps/web/src` (`sonar.sources`). Ficam de fora:

- as migrations SQL geradas pelo Prisma, origem do falso positivo `plsql:CharVarchar` registrado no [antes](../sonar-antes/README.md);
- os arquivos de configuração das ferramentas, que ficam na raiz de cada app.

**Testes:** `*.spec.ts`, `*.e2e-spec.ts`, `*.test.ts` e `*.test.tsx` saem de `sonar.sources` e entram em `sonar.tests`. Assim, não contam como código a cobrir nem geram issues de código de produção.

**Relatórios de cobertura:** o Sonar lê o `lcov.info` da API (Jest) e o do web (Vitest), ambos gerados no CI antes do scan.

| Padrão | Onde | Por que fica de fora |
| --- | --- | --- |
| `**/generated/**` | Sonar (`exclusions`) e Jest | Client gerado pelo `prisma generate`, não escrito pelo grupo |
| `**/node_modules/**`, `**/*.d.ts`, `**/*.ico` | Sonar (`exclusions`) e Jest (`node_modules`) | Dependências, declarações de tipo e binários |
| `**/main.ts` | Sonar (`coverage.exclusions`) e Jest | Bootstrap do Nest, só sobe o servidor. A configuração da aplicação fica em `configurar-app.ts`, que **é** coberto pelo `configurar-app.spec.ts` e pelos e2e |
| `**/*.module.ts` | Sonar (`coverage.exclusions`) e Jest | Só ligam controllers e providers no container do Nest. Os e2e sobem o `AppModule` real e exercitam essa ligação |
| `**/dto/**` | Sonar (`coverage.exclusions`) e Jest | Classes declarativas com decorators do class-validator. As regras de validação são testadas pelos `*.http.spec.ts` e pelos e2e, e os validadores próprios (`common/validators`) **são** cobertos |
| `**/layout.tsx` | Sonar (`coverage.exclusions`) e Vitest | Shell do Next.js (html, body e fontes), sem lógica |
| `**/*.config.*` | Sonar (`coverage.exclusions`) | Configuração de ferramenta. Hoje já fica fora de `sonar.sources`, e a regra protege contra um config criado dentro de `src` |
| `src/**/*.test.{ts,tsx}` | Vitest | Os próprios testes do web |

As listas do Sonar e das ferramentas de teste coincidem no que cada ferramenta enxerga. O Jest roda com `rootDir: src` e o Vitest com `include: src/**`, então nenhuma das duas mede arquivos de configuração. A cobertura de 100% exibida pelo Sonar é, portanto, a mesma do `text-summary` impresso no CI.

## 4. O que as métricas medem

A cobertura e o gate valem **somente para o que está na `main`**. Funcionalidades planejadas não entram no cálculo: os 100% atuais não dizem nada sobre treinos, dashboard ou telas que ainda não existem.

Testes HTTP (`*.http.spec.ts`) sobem o controller com os guards e o `ValidationPipe` reais e o service mockado. Testes e2e sobem a aplicação inteira com o banco `academia_test`.

| Módulo (`apps/api/src`) | Rotas | Requisitos | Testes unitários / HTTP | e2e (`apps/api/test`) | Estado |
| --- | --- | --- | --- | --- | --- |
| `auth` | `POST /auth/login`, `GET /auth/me`, guards JWT e de cargo | seção 4.1 e matriz 4.2 | 8 specs, incluindo `auth.http.spec.ts` e `roles.guard.spec.ts` | `auth.e2e-spec.ts` | Na `main` |
| `funcionarios` | CRUD, desativar e reativar, só ADMIN | seção 4.2 | 5 specs | `funcionarios.e2e-spec.ts` | Na `main` |
| `membros` | CRUD, desativar e reativar | RF20 a RF24 | 6 specs, incluindo `membros.http.spec.ts` | `membros.e2e-spec.ts` | Na `main` (os `@Roles` de membros ficam para a issue #28) |
| `pagamentos` | lançar, listar, consultar, pagar, cancelar e `GET /membros/:id/situacao` | RF40 a RF45 | 8 specs, incluindo `pagamentos.http.spec.ts` e `pagamento-status.spec.ts` | — (o E2E-03 de inadimplência está no PR #26) | Na `main` |
| `historico` | `POST/GET /atividades`, `GET /atividades/:id`, `GET /membros/:id/atividades` | RF50 a RF52 | 6 specs, incluindo `historico.http.spec.ts` | `historico.e2e-spec.ts` | Na `main` |
| `common`, `prisma` | utilitários, validadores (CPF, datas), filtro de erros do Prisma, paginação | RN01, RN02 e validações | 15 specs | `utils.e2e-spec.ts` | Na `main` |
| web `src/lib`, `src/app/page.tsx` | cliente da API e página inicial | — | `api.test.ts`, `page.test.tsx` | — | Na `main` |
| Treinos | — | RF30 a RF35 | — | — | **Planejado**, fora da métrica |
| Dashboard | — | seção 4.7 | — | — | **Planejado**, fora da métrica |
| Portal do aluno, ficha do membro | — | RF25, RF26, RF35, RF53 | — | — | **Planejado**, fora da métrica |
| Telas do web (login, membros, pagamentos, atividades) | — | — | — | — | **Planejado**, fora da métrica |
| Fluxo principal (E2E-02) | — | CA01 a CA08 | — | `fluxo-principal.e2e-spec.ts` | **Planejado** (issue #29) |

## 5. Registros

Cada linha liga um commit à sua execução do CI, à análise do SonarCloud e ao artefato `cobertura` (os `lcov.info` da API e do web), que fica anexado à execução do CI.

| Data | Commit da `main` | CI | Análise Sonar | Gate | Cobertura | Linhas a cobrir / sem cobertura | Bugs / Vuln. / Hotspots / Smells | Duplicação | Testes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10/10/2026 | `4f97f4b` | — (Automatic Analysis) | [antes](../sonar-antes/README.md) | não calculado | sem dados | — | 1 / 0 / 0 / 0 | 0,0% | — |
| 04/11/2026 | `d823ab2` | [41853300624](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/runs/41853300624) | `9159046e` | OK | 100% | 502 / 0 | 0 / 0 / — / — | — | 538 unitários API, 2 arquivos web, 32 e2e |
| 04/11/2026 | `b70b666` | [41933291714](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/runs/41933291714) | `f259a521` | OK | 100% | 520 / 0 | 0 / 0 / 0 / 1 | 0,0% | 550 unitários API (50 suítes), 2 arquivos web, 50 e2e (6 suítes) |
| _a preencher_ | _merge deste PR_ | | | | | | | | |

**Origem dos números:**

- **Linha `d823ab2`:** são os números citados pelo professor na issue #30.
- **Linha `b70b666`:** a API pública do SonarCloud (`api/qualitygates/project_status`, `api/measures/component` e `api/project_analyses/search` com `project=pedroszdev_A3-SistemaCadastroAcademia`) e o log da execução do CI. O Sonar conta linhas a cobrir com critério próprio, por isso os 520 dele não batem exatamente com as 499 linhas da API mais as 8 do web do `text-summary` do Jest e do Vitest. Nos dois casos, nenhuma linha fica sem cobertura.

**Como acrescentar uma linha após cada merge relevante:**

```bash
gh run list --branch main --workflow ci.yml --limit 1          # id e commit da execução
gh run view <id> --log | grep -E "Tests:|Test Files|QUALITY GATE"
curl -s "https://sonarcloud.io/api/project_analyses/search?project=pedroszdev_A3-SistemaCadastroAcademia&ps=1"
curl -s "https://sonarcloud.io/api/measures/component?component=pedroszdev_A3-SistemaCadastroAcademia&metricKeys=coverage,lines_to_cover,uncovered_lines,bugs,vulnerabilities,security_hotspots,code_smells,duplicated_lines_density"
```

Antes de registrar, confira se o `revision` da análise do Sonar é o mesmo commit da execução do CI.

## 6. Prova do bloqueio

Roteiro reproduzível para demonstrar um gate reprovado barrando o merge. O PR é descartável e **nunca** é mergeado:

1. A partir da `main` atualizada, crie a branch `test/prova-quality-gate`.
2. Acrescente em `apps/api/src/common/utils/` um arquivo com **pelo menos 30 linhas de código** novas (por exemplo, uma função com vários `if`/`switch`), sem teste. A cobertura do código novo fica abaixo de 80%. O tamanho importa: com menos de 20 linhas novas, o SonarCloud ignora as condições de cobertura e duplicação do gate, e o gate passa.
3. Faça push e abra um PR para a `main` (**não** use draft, porque o draft já bloqueia o merge por conta própria e invalidaria a prova), com o título `[NÃO MERGEAR] prova do quality gate (#30)`.
4. Aguarde o CI e confira os resultados:
   - no log do passo "Análise do SonarCloud", aparece `QUALITY GATE STATUS: FAILED`;
   - o check `Lint, build e testes` fica vermelho;
   - o botão de merge mostra "Required statuses must pass before merging".
5. Salve os prints nesta pasta:
   - `01-check-vermelho.png`: a lista de checks do PR;
   - `02-merge-bloqueado.png`: a caixa de merge bloqueada;
   - `03-sonar-gate-failed.png`: o comentário ou o dashboard do SonarCloud com a condição reprovada.
6. Feche o PR **sem merge** e apague a branch.
7. Preencha a tabela abaixo.

| Print | PR | Execução do CI |
| --- | --- | --- |
| _a preencher_ | | |

## 7. Manutenção

- A cada módulo novo (treinos, dashboard, telas do web), mova a linha dele na seção 4 de "Planejado" para "Na `main`", com os specs e e2e correspondentes.
- A cada entrega relevante, e obrigatoriamente no code freeze de 23/11, acrescente uma linha na seção 5. O registro final é o "depois" da seção 2.12 do relatório.
- Exclusão nova de cobertura só entra com uma linha na tabela da seção 3 explicando o motivo.
