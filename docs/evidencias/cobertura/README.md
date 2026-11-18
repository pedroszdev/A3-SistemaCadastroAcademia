# Cobertura de testes — consolidação (QA-02)

Conferência da cobertura geral e das exclusões, feita pelo Pedro. É a evidência da seção 2.12 do relatório (cobertura) e complementa a tabela da 2.9.

- **Data:** 16/11/2026
- **Commit medido:** `main` em `83565f4` (depois do merge do PR #73)
- **Projeto:** [pedroszdev_A3-SistemaCadastroAcademia](https://sonarcloud.io/project/overview?id=pedroszdev_A3-SistemaCadastroAcademia)

## Número geral no Sonar

| Métrica | Valor |
| --- | --- |
| Cobertura | **99,2%** (exigido: 80% no quality gate, mínimo 75% no enunciado) |
| Linhas | 100,0% (2.028 a cobrir, 1 sem cobertura) |
| Condições (branches) | 97,7% (1.052 a cobrir, 24 sem cobertura) |
| Arquivo com menos cobertura | 94,2% (`form-funcionario.tsx` e `meu-historico.tsx`) |

Nenhum módulo está abaixo de 80%, então ninguém precisou completar testes para a QA-02.

## Por módulo

Números locais do `test:cov`, já sem a exclusão dos DTOs (veja abaixo).

### API (Jest): 768 testes, 100% de statements, branches, funções e linhas

| Módulo (`apps/api/src`) | Dono | Linhas | Branches |
| --- | --- | --- | --- |
| `auth` | Pedro | 139/139 (100%) | 54/54 (100%) |
| `funcionarios` | Pedro | 84/84 (100%) | 20/20 (100%) |
| `dashboard` | Pedro | 25/25 (100%) | — |
| `common`, `prisma`, `app.*` | Pedro | 141/141 (100%) | 44/44 (100%) |
| `membros` | Gabriel (acesso do aluno: Pedro; resumo: Yohan) | 141/141 (100%) | 23/23 (100%) |
| `treinos` | Gabriel | 107/107 (100%) | 8/8 (100%) |
| `pagamentos` | Yohan | 138/138 (100%) | 45/45 (100%) |
| `historico` | Yohan | 103/103 (100%) | 12/12 (100%) |

### Web (Vitest): 777 testes, linhas 99,91%, branches 97,17%

| Pasta (`apps/web/src`) | Dono | Linhas | Branches |
| --- | --- | --- | --- |
| `features/auth` | Pedro | 75/75 (100%) | 34/37 (91,9%) |
| `features/dashboard` | Pedro | 27/27 (100%) | 13/14 (92,9%) |
| `features/funcionarios` | Pedro | 106/107 (99,1%) | 87/91 (95,6%) |
| `features/aluno` | Pedro (portal) e Yohan (Meu histórico) | 70/70 (100%) | 51/55 (92,7%) |
| `features/membros` | Yohan (lista e formulário) | 125/125 (100%) | 74/78 (94,9%) |
| `features/treinos` | Gabriel | 106/106 (100%) | 66/70 (94,3%) |
| `features/pagamentos` | Yohan | 178/178 (100%) | 141/142 (99,3%) |
| `features/historico` | Yohan | 160/160 (100%) | 123/126 (97,6%) |
| `components`, `lib`, `app`, `proxy.ts` | Pedro | 100% | 100% |

## Exclusões

Ficam fora da cobertura (`sonar.coverage.exclusions`, `coveragePathIgnorePatterns` do Jest e `exclude` do Vitest) só arquivos sem lógica própria:

| Padrão | Por que fica de fora |
| --- | --- |
| `main.ts` | Só sobe a aplicação (`NestFactory`, pipes globais e porta) |
| `*.module.ts` | Só declaram a injeção de dependências do Nest, sem nenhum `if` |
| `layout.tsx` | Só montam os providers e o `Suspense`. A decisão de redirecionar está em `lib/protecao-rotas.ts` e em `features/aluno/portal-do-aluno.tsx`, que são testados (100%) |
| `*.config.*` | Configuração das ferramentas (Next, Vitest, Prisma, ESLint) |
| `generated/`, `*.d.ts` | Cliente do Prisma e tipos gerados, que não são código do grupo |
| testes (`*.spec.ts`, `*.test.tsx`...) | São os próprios testes |

**Exclusão retirada:** os DTOs (`/dto/` no Jest e `**/dto/**` no Sonar) estavam fora da cobertura desde a configuração inicial. Eles têm lógica (o `@Transform` e o `@Type`, que aparam o texto, deixam só os números do CPF e do telefone e convertem os filtros em número e booleano), então não deveriam ficar de fora. Como cada DTO já tem o seu `.dto.spec.ts`, incluí-los não mudou o número: a API continua com 100%.

## Como reproduzir

```bash
pnpm --filter api test:cov   # resumo no terminal; relatório em apps/api/coverage
pnpm --filter web test:cov   # resumo no terminal; relatório em apps/web/coverage
```

O CI roda os dois em todo PR e manda o `lcov.info` para o Sonar.
