# Pipeline de CI (GitHub Actions)

Responde à INF-04 do [backlog](../../BACKLOG.md). Este documento liga cada item da tarefa a um passo do workflow, ao check obrigatório do ruleset e a execuções reais, e traz o roteiro dos prints.

Relação com a A3: itens 2.7 (ferramentas) e 2.13 (controle de versão).

## 1. O que o workflow roda

O workflow é [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml), disparado em `push` na `main`, em `pull_request` e manualmente (`workflow_dispatch`). Tudo roda no job `Lint, build e testes`.

| Item da INF-04 | Passo no ci.yml |
| --- | --- |
| 1. Checkout com `fetch-depth: 0`, pnpm, Node 24 com cache e `pnpm install --frozen-lockfile` | `Checkout`, `Setup do pnpm`, `Setup do Node`, `Instalar dependências` |
| 2. `pnpm lint` | `Lint` |
| 3. `pnpm build` | `Build` |
| 4. Testes unitários com cobertura | `Testes unitários da API (cobertura)`, `Testes unitários do web (cobertura)` |
| 5. e2e com service `postgres:17-alpine`, `DATABASE_URL` apontando para ele, `prisma migrate deploy` e `test:e2e` | `Configurar DATABASE_URL`, `Aplicar migrations`, `Testes e2e da API` |
| 6. Scan do SonarCloud com os dois `lcov.info` | `Verificar SONAR_TOKEN`, `Análise do SonarCloud` |

O scan acha os dois `lcov.info` pelo `sonar.javascript.lcov.reportPaths` do [`sonar-project.properties`](../../../sonar-project.properties). O último passo, `Publicar relatórios de cobertura`, não faz parte do scan: só guarda as pastas de cobertura como artefato da execução.

O badge do CI está no topo do [README](../../../README.md). O detalhe do quality gate do Sonar está em [quality-gate](../quality-gate/README.md).

## 2. Como o check barra o merge

O ruleset `26615335` da `main` exige o check `Lint, build e testes`. Se qualquer passo ficar vermelho (teste, e2e, lint, build ou gate do Sonar), o check fica vermelho e o merge fica bloqueado.

Para conferir o que está ativo hoje:

```bash
gh api repos/pedroszdev/A3-SistemaCadastroAcademia/rules/branches/main --jq '.[] | select(.type=="required_status_checks") | .parameters'
```

## 3. Prints

Capturados em 06/11/2026. Para refazer, em cada linha da tabela: abra a URL logado no GitHub, deixe visível o que a última coluna pede, capture e salve nesta pasta com o nome indicado. Os três endereços mostram só PR e Actions, sem dados de alunos.

| Print | Onde | Execução do CI | O que mostra |
| --- | --- | --- | --- |
| [01-pr-check-verde.png](01-pr-check-verde.png) | [PR #41](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/41), capturado enquanto está aberto (PR mergeado não mostra a caixa de merge) | [42258834933](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/runs/42258834933) | Caixa de merge com `Lint, build e testes` verde e marcado como Required |
| [02-aba-actions.png](02-aba-actions.png) | [Aba Actions, workflow CI](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/workflows/ci.yml) | - | Histórico de execuções em PRs e na `main` |
| [03-execucao-teste-quebrado.png](03-execucao-teste-quebrado.png) | [PR #35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) | [42148445130](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/runs/42148445130) | Job vermelho no passo `Testes e2e da API` |

**O que a execução 42148445130 mostra:**
- falhou no passo `Testes e2e da API` do PR #35, e o check obrigatório `Lint, build e testes` ficou vermelho;
- a falha veio de `test/seguranca.e2e-spec.ts`, no teste "toda rota não pública está na MATRIZ": a rota `GET /dashboard` não estava na matriz de permissões (1 teste falhou, 196 passaram);
- o PR só foi mergeado depois da correção, com o check verde.

Para a execução verde de referência na `main`, veja o run [42253331964](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/runs/42253331964), do push do merge do PR #39.
