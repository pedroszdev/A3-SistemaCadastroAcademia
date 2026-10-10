# SonarCloud — análise "antes"

Primeira análise do projeto, feita pela **Automatic Analysis** do SonarCloud logo depois da importação, antes de a análise passar a ser feita pelo CI (INF-05). É a linha de base da seção 2.12 do relatório e do slide "Evolução do software".

- **Data:** 10/10/2026, 12:07 (horário de Brasília)
- **Commit analisado:** `4f97f4b` (`main`, após o merge dos PRs #1, #2 e #3)
- **Projeto:** [pedroszdev_A3-SistemaCadastroAcademia](https://sonarcloud.io/project/overview?id=pedroszdev_A3-SistemaCadastroAcademia)

## Métricas

| Métrica | Valor |
| --- | --- |
| Quality gate | Não calculado (sem análise de código novo ainda) |
| Linhas de código | 754 |
| Bugs | 1 |
| Vulnerabilidades | 0 |
| Security hotspots | 0 |
| Code smells | 0 |
| Duplicação | 0,0% |
| Cobertura | Sem dados (a Automatic Analysis não lê relatórios de cobertura) |
| Confiabilidade (Reliability) | **C** |
| Segurança (Security) | A |
| Revisão de segurança | A |
| Manutenibilidade (Maintainability) | A |

## Issue encontrada

| Tipo | Severidade | Regra | Arquivo | Mensagem |
| --- | --- | --- | --- | --- |
| Bug | Média | `plsql:CharVarchar` | `apps/api/prisma/migrations/20261010125652_init/migration.sql` (linha 8) | Use VARCHAR2 instead of CHAR. |

A regra é de **PL/SQL (Oracle)** e foi aplicada a uma migration gerada pelo Prisma para **PostgreSQL**, onde `CHAR(11)` é o tipo adequado para o CPF (sempre 11 dígitos, RN01). É um **falso positivo**. Ele foi tratado restringindo o escopo da análise ao código-fonte (`sonar.sources=apps/api/src,apps/web/src` no `sonar-project.properties`): migrations geradas não são código escrito pelo grupo.

## Prints

| Arquivo | Conteúdo |
| --- | --- |
| [01-overview.png](01-overview.png) | Visão geral: quality gate, issues, duplicação e cobertura |
| [02-security.png](02-security.png) | Segurança: rating A, 0 issues |
| [03-reliability.png](03-reliability.png) | Confiabilidade: rating C, 1 issue média |
| [04-issue-migration-sql.png](04-issue-migration-sql.png) | Detalhe da issue `plsql:CharVarchar` na migration |
