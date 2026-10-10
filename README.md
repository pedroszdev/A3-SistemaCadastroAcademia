# Sistema de Cadastro de Academia

[![CI](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/workflows/ci.yml/badge.svg)](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/workflows/ci.yml)

Monorepo gerenciado com **pnpm workspaces**.

```
.
├── apps/
│   ├── api/            # Back-end NestJS + Prisma (PostgreSQL) — porta 3000
│   └── web/            # Front-end Next.js + Tailwind — porta 3001
├── packages/           # Pacotes compartilhados (tipos, utilitários…)
├── docker-compose.yml  # PostgreSQL local
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js >= 24
- pnpm (`corepack enable`)
- Docker (para o banco local)

## Primeiros passos

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:up          # sobe o PostgreSQL
pnpm db:migrate     # aplica as migrations
pnpm dev            # API em :3000 e front em :3001
```

## Scripts da raiz

| Script            | O que faz                              |
| ----------------- | -------------------------------------- |
| `pnpm dev`        | API + front em paralelo                |
| `pnpm dev:api`    | Só a API em modo watch                 |
| `pnpm dev:web`    | Só o front                             |
| `pnpm build`      | Build de todos os apps                 |
| `pnpm lint`       | ESLint em todos os apps                |
| `pnpm format`     | Prettier na API                        |
| `pnpm db:up`      | Sobe o PostgreSQL via Docker           |
| `pnpm db:down`    | Derruba os containers                  |
| `pnpm db:migrate` | `prisma migrate dev` na API            |
| `pnpm db:studio`  | Abre o Prisma Studio                   |

## Modelo de dados

- **Membro** 1:N **Treino**
- **Membro** 1:N **Pagamento**
- **Membro** 1:N **HistoricoAtividade**
- **Funcionario** 1:N **HistoricoAtividade** (funcionário responsável pela atividade)
- **Treino** 1:N **HistoricoAtividade** (opcional: a atividade pode pertencer a um treino)

Convenções:

- IDs são **UUID v7** (gerados pelo Prisma Client, ordenados por tempo).
- **Membros e funcionários não são apagados**: desative com `ativo = false`. O banco
  bloqueia a exclusão de quem tem pagamentos, treinos ou histórico.
- **Pagamento** tem `dataVencimento`; `dataPagamento` fica nula até o pagamento ser feito.
- **Cargo** do funcionário é fixo: `ADMIN`, `RECEPCIONISTA` ou `INSTRUTOR`.

O schema fica em `apps/api/prisma/schema.prisma`.
