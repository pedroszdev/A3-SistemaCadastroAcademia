# Evidências

Índice do material visual do relatório e dos slides (QA-05). Cada pasta tem o próprio README, que diz o que cada print mostra, onde foi capturado e a que commit ou execução se refere.

## O que tem em cada pasta

| Pasta | O que comprova | Relatório | Slide |
| --- | --- | --- | --- |
| [`sonar-antes/`](sonar-antes/README.md) | Primeira análise do SonarCloud (10/10, `4f97f4b`): métricas, ratings e a única issue, que era um falso positivo | 2.7, 2.12 (antes) | Evolução do software |
| `sonar-depois/` | Análise da `main` no code freeze: as mesmas telas do "antes", para comparar | 2.10, 2.12 (depois) | Evolução do software |
| [`sonar-correcoes.md`](sonar-correcoes.md) | Issues do Sonar corrigidas por cada um: problema → regra → correção → commit (QA-01; o arquivo chega com o PR #75) | 2.12 | Evolução do software |
| [`ci/`](ci/README.md) | Workflow do GitHub Actions: PR com o check verde, aba Actions e execução vermelha por teste quebrado | 2.4 (regressão), 2.7, 2.13 | Demo de integração contínua |
| [`quality-gate/`](quality-gate/README.md) | Gate do Sonar reprovado barrando o merge na `main` (PR #34) e o escopo das métricas (issue #30) | 2.7, 2.10, 2.12 | Demo de integração contínua |
| [`cobertura/`](cobertura/) | Cobertura geral e por módulo, exclusões com justificativa (QA-02) e prints do relatório HTML da API e do web | 2.9, 2.10, 2.12 | Evolução do software |
| [`permissoes/`](permissoes/README.md) | Matriz de permissões 4.2 ligada ao código e ao teste HTTP de cada linha (issue #28) | 2.4 (segurança), 2.10 | Demo de controle de acesso |
| [`issues/`](issues/README.md) | Issues do professor fechadas, com os PRs que resolveram cada uma | 2.10, 2.11 | Principais issues |

## Itens da QA-05

| Item | Onde está | Situação |
| --- | --- | --- |
| Prints do Sonar antes | [`sonar-antes/`](sonar-antes/README.md) | ✅ |
| Prints do Sonar depois | `sonar-depois/` | ⏳ no code freeze (23/11), depois do merge dos PRs da Sprint 3 |
| Prints do Actions: um PR barrado e um verde | [`ci/01-pr-check-verde.png`](ci/01-pr-check-verde.png), [`ci/03-execucao-teste-quebrado.png`](ci/03-execucao-teste-quebrado.png), [`quality-gate/01-prova-gate-reprovado.png`](quality-gate/01-prova-gate-reprovado.png) | ✅ |
| Relatório de cobertura | [`cobertura/01-api-lcov.png`](cobertura/01-api-lcov.png), [`cobertura/02-web-lcov.png`](cobertura/02-web-lcov.png); números e exclusões no README da pasta, que chega com o PR #76 | ✅ (prints de 16/11; refazer no code freeze) |
| Prints de issues fechadas | [`issues/`](issues/README.md) | ✅ #28, #29 e #30; falta a #69, que fecha com o PR #74 |

## O que falta no code freeze (23/11)

1. **`sonar-depois/`:** as mesmas telas do [`sonar-antes/`](sonar-antes/README.md) (overview, segurança, confiabilidade), mais manutenibilidade e duplicação, com um README no mesmo formato: data, commit e tabela de métricas lado a lado com o "antes". Tirar à mão, logado no SonarCloud.
2. **Cobertura:** refazer os dois prints do relatório HTML na `main` final (`pnpm --filter api test:cov` e `pnpm --filter web test:cov`, depois abrir `apps/*/coverage/lcov-report/index.html`). Os prints de 16/11 são da `main` em `83565f4`, antes do PR #76, por isso a API aparece sem os DTOs.
3. **Issues:** print da #69 fechada e da lista de issues fechadas atualizada.
