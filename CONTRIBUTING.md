# Como contribuir

Resumo das regras do grupo. A versão completa, com as tasks e as regras de negócio, está no [backlog](docs/BACKLOG.md).

## Regras que afetam a nota

A nota individual da A3 é medida pelos **commits de código-fonte** de cada um, na **última versão** do repositório.

1. **Cada um commita só o próprio código, com a própria conta do GitHub.** Ninguém commita nem dá push por outra pessoa.
2. **Só código-fonte conta** (`.ts` e `.tsx`, de código e de teste). README, docs, configs e `package.json` não contam.
3. **Arquivos que não existem na última versão não contam.** Não criem arquivos para apagar depois e evitem renomear perto da entrega.
4. Confiram se o e-mail do git é o mesmo da conta do GitHub. Commit que aparece como "unknown" não conta.

## Commits

- **Pequenos e atômicos**: um propósito por commit, vários por dia de trabalho.
- **Conventional Commits, em português**:
  ```
  feat(membros): adiciona validação de CPF no cadastro
  test(membros): cobre CPF duplicado no MembrosService
  fix(pagamentos): corrige cálculo de atraso no último dia do mês
  refactor(auth): extrai geração de token para método próprio
  ```
- Escopos: `api`, `web`, `auth`, `funcionarios`, `membros`, `treinos`, `pagamentos`, `historico`, `dashboard`, `ci`, `e2e`.

## Fluxo de trabalho

1. Crie uma branch a partir da `main` atualizada: `feat/membros-service`, `test/pagamentos-status`, `fix/historico-data-futura`.
2. Abra um PR para a `main` e preencha o template (o que muda, como testar, DoD, `Closes #`).
3. O PR só entra com:
   - o check **"Lint, build e testes"** verde (lint, build, testes unitários e e2e);
   - o comentário do SonarCloud no PR sem bug, vulnerabilidade ou hotspot novo, e cobertura do código novo ≥ 80%. O quality gate do Sonar é conferido nesse comentário, não faz parte do check do CI;
   - **1 aprovação** de outro integrante. Revisem os PRs abertos em até 24h.
4. Merge com **"Create a merge commit"** ou **"Rebase and merge"**. **Nunca "Squash"**: ele junta os commits e apaga o histórico que o professor avalia.

A `main` é protegida: ninguém, nem admin, dá push direto nela.

## Código e testes

- **Teste junto com o código**, no mesmo PR. Meta de cobertura: **≥ 80%** no código novo.
- **API**: siga o padrão da [seção 4.3 do backlog](docs/BACKLOG.md#43-padrão-de-código-de-cada-módulo-da-api) (`dto/`, controller, service e specs). O módulo de funcionários (FUN-01) é a referência desse padrão. Testes unitários em `src/<modulo>/*.spec.ts` com o `PrismaService` mockado; e2e em `test/<modulo>.e2e-spec.ts` com banco real.
- **Web**: `page.tsx` fino. Validação, formatação e chamadas à API ficam em `lib/` ou `features/<modulo>/`, com testes `*.test.ts(x)` ao lado.
- **Dados fictícios sempre** (LGPD): nada de CPF, telefone ou endereço reais em seed, testes ou prints.

## Comandos

Requisitos: Node.js ≥ 24, pnpm (`corepack enable`) e Docker.

```bash
pnpm db:up                     # PostgreSQL local
pnpm db:migrate                # aplica as migrations no banco local
pnpm test                      # testes unitários da API e do web
pnpm --filter api test:cov     # cobertura da API (apps/api/coverage)
pnpm --filter web test:cov     # cobertura do web (apps/web/coverage)
pnpm --filter api test:e2e     # e2e da API (precisa do banco no ar e migrado)
pnpm lint                      # ESLint em tudo
```

## Bugs e issues

- Abra a issue pelo template **Bug**, com passos para reproduzir e evidência.
- Coloque o label do tipo (`bug`, `sonar`, `professor`…) e o do módulo (`membros`, `pagamentos`…) e atribua ao dono do módulo.
- A correção vai num PR com `Closes #<número>` na descrição, para a issue fechar sozinha no merge.
