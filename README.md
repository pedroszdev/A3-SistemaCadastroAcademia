# Sistema de Cadastro de Academia

[![CI](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/workflows/ci.yml/badge.svg)](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=pedroszdev_A3-SistemaCadastroAcademia&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=pedroszdev_A3-SistemaCadastroAcademia)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=pedroszdev_A3-SistemaCadastroAcademia&metric=coverage)](https://sonarcloud.io/summary/new_code?id=pedroszdev_A3-SistemaCadastroAcademia)

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
cp apps/api/.env.example apps/api/.env   # defina JWT_SECRET com 32+ caracteres: openssl rand -hex 32
cp apps/web/.env.example apps/web/.env.local
pnpm db:up          # sobe o PostgreSQL
pnpm db:migrate     # aplica as migrations
pnpm db:seed        # cria os dados fictícios de desenvolvimento
pnpm dev            # API em :3000 e front em :3001
```

## Scripts da raiz

| Script            | O que faz                               |
| ----------------- | --------------------------------------- |
| `pnpm dev`        | API + front em paralelo                 |
| `pnpm dev:api`    | Só a API em modo watch                  |
| `pnpm dev:web`    | Só o front                              |
| `pnpm build`      | Build de todos os apps                  |
| `pnpm lint`       | ESLint em todos os apps                 |
| `pnpm format`     | Prettier na API                         |
| `pnpm db:up`      | Sobe o PostgreSQL via Docker            |
| `pnpm db:down`    | Derruba os containers                   |
| `pnpm db:migrate` | `prisma migrate dev` na API             |
| `pnpm db:studio`  | Abre o Prisma Studio                    |
| `pnpm db:seed`    | Cria dados fictícios de desenvolvimento |

## Logins de desenvolvimento

O `pnpm db:seed` cria dados fictícios, só para uso local (a senha de todos é `senha1234`).

| Login       | Cargo           |
| ----------- | --------------- |
| `admin`     | `ADMIN`         |
| `recepcao`  | `RECEPCIONISTA` |
| `instrutor` | `INSTRUTOR`     |

Dois membros têm acesso de aluno (login em `POST /auth/login-aluno`, senha `senha1234`):

| Aluno      | CPF              | Situação     |
| ---------- | ---------------- | ------------ |
| Ana Souza  | `418.723.956-19` | em dia       |
| Bruno Lima | `153.509.460-56` | inadimplente |

O seed também cria:

- 10 membros, 2 deles inativos; Carla Mendes tem 5 dias de atraso, ainda na tolerância (em dia);
- 9 treinos, 15 pagamentos nos 4 status (PAGO, PENDENTE, ATRASADO, CANCELADO) e 30 atividades, 3 delas hoje;
- todas as datas são relativas a hoje, então a demonstração vale em qualquer dia.

Rodar de novo não duplica nada: os funcionários que já existem ficam como estão (senha incluída) e os 10 membros do seed voltam ao estado de demonstração, com treinos, pagamentos e atividades recriados. O seed reconhece os membros dele pelo CPF, então membros com outros CPFs não são tocados.

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
