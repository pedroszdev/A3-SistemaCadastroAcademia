# Matriz de permissões verificável

Responde à issue [#28](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/issues/28). Este documento liga cada linha da [matriz 4.2 do backlog](../../BACKLOG.md#42-matriz-de-permissões-rbac) ao código que a aplica e ao teste HTTP que a comprova, e separa o que já está na `main` do que ainda está em PR aberto ou planejado.

Relação com a A3: itens 2.4 (estratégia de testes, testes de segurança), 2.10 (critérios de aceitação) e 2.12 (relatórios de métricas).

## 1. Como a autorização funciona

```
requisição
  └─ JwtAuthGuard (global)   → rota sem @Public e sem token válido → 401
       └─ RolesGuard (global) → cargo do banco fora do @Roles da rota → 403
            └─ pipes, guards da rota e controller → 2xx / 400 / 404 / 409 / 422
```

- Os dois guards são registrados como `APP_GUARD` em [`app.module.ts`](../../../apps/api/src/app.module.ts), nessa ordem. Por isso, sem token a resposta é sempre 401, antes de olhar o cargo.
- O cargo vem do banco a cada requisição ([`jwt.strategy.ts`](../../../apps/api/src/auth/jwt.strategy.ts)), não do token. Um funcionário rebaixado ou desativado perde o acesso na hora.
- O `@Roles(...)` pode ficar na classe e ser sobrescrito no método ([`roles.guard.ts`](../../../apps/api/src/auth/roles.guard.ts), `getAllAndOverride`). Exemplo: em `/atividades`, a classe libera a consulta para os 3 cargos e o `POST` restringe a ADMIN e INSTRUTOR.
- A autorização roda antes da validação do corpo: um cargo sem permissão recebe 403 mesmo com o corpo inválido, sem descobrir nada sobre o formato esperado.
- **Nenhuma rota fica sem declaração.** O teste `cobertura da matriz` percorre todas as rotas registradas no `AppModule` e falha se alguma não tiver `@Roles` nem `@Public`, ou se uma rota protegida não estiver na `MATRIZ` do teste. Uma rota nova (treinos, `/me` do aluno) só passa no CI com a linha dela na matriz. As rotas públicas também têm lista fechada (`GET /health`, `POST /auth/login` e `POST /auth/login-aluno`): um `@Public()` novo faz o teste falhar até ser incluído de propósito.

## 2. Matriz verificável

Legenda de status: ✅ na `main` · 🔄 em PR aberto (não conta como concluído) · ⏳ planejado.

Todos os testes estão em [`apps/api/test/seguranca.e2e-spec.ts`](../../../apps/api/test/seguranca.e2e-spec.ts). Cada linha gera três tipos de caso, com estes nomes na saída do Jest:

- `sem token → 401 › <MÉTODO> <rota> → 401`;
- `por papel › <PAPEL> <MÉTODO> <rota> → 403` para cada papel sem permissão (os 3 cargos e o ALUNO), conferindo também o corpo `{ statusCode: 403, message: 'Você não tem permissão para acessar este recurso', error: 'Forbidden' }`;
- `por papel › <PAPEL> <MÉTODO> <rota> → 2xx` para cada papel permitido, com dados válidos.

| Recurso (4.2) | Rotas | ADMIN | RECEP | INSTR | ALUNO | Implementação | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Funcionários (CRUD) | `GET/POST /funcionarios`, `GET/PATCH /funcionarios/:id`, `PATCH /funcionarios/:id/desativar` e `/reativar` | ✅ | ❌ | ❌ | ❌ | PR [#27](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/27), merge `b70b666` | ✅ |
| Membros — listar/ver | `GET /membros`, `GET /membros/:id` | ✅ | ✅ | ✅ | ❌ | PR [#35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) (`feat(membros)`), merge `4c21808` | ✅ |
| Membros — criar/editar/desativar | `POST /membros`, `PATCH /membros/:id`, `PATCH /membros/:id/desativar` e `/reativar` | ✅ | ✅ | ❌ | ❌ | PR [#35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) (`feat(membros)`), merge `4c21808` | ✅ |
| Membros — liberar/redefinir acesso do aluno | `PATCH /membros/:id/acesso`, `DELETE /membros/:id/acesso` | ✅ | ✅ | ❌ | ❌ | MEM-07 (Pedro) | 🔄 |
| Treinos — listar/ver (todos) | `GET /treinos`, `GET /treinos/:id`, `GET /membros/:id/treinos` | ✅ | ✅ | ✅ | ❌ | PR [#55](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/55) (TRE-03/TRE-05), merge `f7b06b3` | ✅ |
| Treinos — criar/editar/excluir | `POST /treinos`, `PATCH /treinos/:id`, `DELETE /treinos/:id` | ✅ | ❌ | ✅ | ❌ | PR [#55](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/55) (TRE-03/TRE-05), merge `f7b06b3` | ✅ |
| Treinos — os próprios (`/me/treinos`) | `GET /me/treinos`, `GET /me/treinos/:id` | ❌ | ❌ | ❌ | ✅ | PR [#55](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/55) (TRE-03/TRE-05), merge `f7b06b3` | ✅ |
| Pagamentos — tudo | `GET/POST /pagamentos`, `GET /pagamentos/:id`, `PATCH /pagamentos/:id/pagar` e `/cancelar` | ✅ | ✅ | ❌ | ❌ | PR [#35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) (`feat(pagamentos)`), merge `4c21808` | ✅ |
| Situação financeira (RF45) | `GET /membros/:id/situacao` | ✅ | ✅ | ❌ | ❌ | PR [#35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) (`feat(pagamentos)`), merge `4c21808` | ✅ |
| Membros — resumo da ficha | `GET /membros/:id/resumo` | ✅ | ✅ | ✅ | ❌ | MEM-06 (Gabriel); linha na `MATRIZ` no mesmo PR; o INSTRUTOR recebe `situacaoFinanceira: null` | ✅ |
| Histórico — listar/ver (todos) | `GET /atividades`, `GET /atividades/:id`, `GET /membros/:id/atividades` | ✅ | ✅ | ✅ | ❌ | PR [#35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) (`feat(historico)`), merge `4c21808` | ✅ |
| Histórico — registrar | `POST /atividades` | ✅ | ❌ | ✅ | ❌ | PR [#35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) (`feat(historico)`), merge `4c21808` | ✅ |
| Histórico — o próprio (`/me/atividades`) | `GET /me/atividades`, `GET /me/atividades/resumo`, `GET /me/atividades/:id` | ❌ | ❌ | ❌ | ✅ | PR [#46](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/46) (HIS-05), merge `f921ce2` | ✅ |
| Dashboard — indicadores | `GET /dashboard` | ✅ | ✅ | ✅ | ❌ | PR [#33](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/33) (DASH-01), merge `6565f38`; linha na `MATRIZ` no PR [#35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) | ✅ |
| Dashboard — membros inadimplentes | `GET /dashboard/inadimplentes` | ✅ | ✅ | ❌ | ❌ | PR [#40](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/40) (WEB-04), merge `0950cb8`; linha na `MATRIZ` no mesmo PR | ✅ |
| Meus dados | `GET /auth/me` | ✅ | ✅ | ✅ | ✅ | PR [#32](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/32), merge `e9240a7`; `@Roles` testado no PR [#35](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/35) | ✅ |

O login do aluno (AUTH-04) entrou na `main` com o PR #32 (`e9240a7`). O `RolesGuard` nega ao aluno toda rota que não tenha `@Roles('ALUNO')` (RN17), e a `MATRIZ` testa a coluna ALUNO com um token de aluno real, obtido pelo `POST /auth/login-aluno`. O ❌ do ALUNO nas rotas de funcionário é um 403 testado. Acesso revogado, membro inativo e `senhaHash` fora do login estão no [`auth.e2e-spec.ts`](../../../apps/api/test/auth.e2e-spec.ts) da AUTH-04, e o `senhaHash` fora de toda resposta de sucesso está na `MATRIZ`.

### Casos que a issue pede explicitamente

| Pedido da #28 | Teste |
| --- | --- |
| INSTRUTOR não acessa pagamentos nem situação financeira | `contrato da issue #28 › INSTRUTOR não acessa pagamentos nem a situação financeira` (6 rotas → 403; nenhum pagamento gravado) |
| RECEPCIONISTA não registra atividades | `contrato da issue #28 › RECEPCIONISTA não registra atividade: 403 e nada gravado` |
| Somente ADMIN gerencia funcionários | `contrato da issue #28 › só ADMIN gerencia funcionários` (6 rotas × RECEPCIONISTA e INSTRUTOR → 403; nada criado) |
| ALUNO é somente leitura (RN17) | `contrato da issue #28 › ALUNO só lê os próprios dados: 403 em toda rota de funcionário e nada gravado (RN17)` |
| RN16: aluno A × aluno B → 404 | `contrato da issue #28 › ALUNO não vê a atividade...`, `... não vê o treino...` e `... dois alunos logados: nenhum vê o treino nem a atividade do outro, nos dois sentidos (RN16)` |
| `senhaHash` nunca na resposta (RN12) | `senhaHash fora das respostas (RN12)` (um caso por rota da `MATRIZ`) e, no `auth.e2e-spec.ts`, o login e o `/auth/me` |
| 401 sem autenticação | `sem token → 401` (as 38 rotas) e `token › malformado / assinado com outro segredo / expirado → 401` |

## 3. Como reproduzir

Com o Postgres do `docker-compose` no ar e o banco de teste criado (veja "Banco de teste" no [CONTRIBUTING](../../../CONTRIBUTING.md)):

```bash
export DATABASE_URL="postgresql://academia:academia@localhost:5432/academia_test?schema=public"
export JWT_SECRET="$(openssl rand -hex 32)"
pnpm --filter api exec prisma migrate deploy
pnpm --filter api test:e2e -- seguranca
```

Resultado na `main`, no commit `f921ce2` (merge do PR #46), na [execução do CI de 09/11/2026](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/actions/runs/42621050893), job `Lint, build e testes`:

```
PASS test/seguranca.e2e-spec.ts
Tests:       237 passed, 237 total      # todos os e2e da API (10 suítes)
Tests:       678 passed, 678 total      # unitários da API, 100% de cobertura
```

No `f921ce2`, a suíte de segurança tinha 152 casos: 28 de 401, 112 por papel (28 rotas × 4 papéis), 6 do contrato da issue, 3 de token e 3 de cobertura da matriz. Com as 8 rotas de treinos do PR [#55](https://github.com/pedroszdev/A3-SistemaCadastroAcademia/pull/55), passa a ter 194 casos: 36 de 401, 144 por papel (36 rotas × 4 papéis), 8 do contrato da issue, 3 de token e 3 de cobertura da matriz. Na branch `test/e2e-05-seguranca`, com o caso do RN16 com dois alunos logados e os 36 casos de `senhaHash fora das respostas (RN12)`, são 231 casos nessa suíte, e a suíte e2e inteira tem 325 testes em 11 suítes (medido localmente no banco `academia_test`). Na branch `feat/membros-acesso-aluno`, com as 2 rotas novas do acesso do aluno (2 de 401, 8 por papel e 2 de `senhaHash`), são 243 casos nessa suíte, e a suíte e2e inteira tem 343 testes em 11 suítes (medido localmente no banco `academia_test`). Os PRs que fecharam as linhas da matriz entraram na `main` com estes merges: #27 (`b70b666`), #32 (`e9240a7`), #33 (`6565f38`), #35 (`4c21808`), #40 (`0950cb8`) e #46 (`f921ce2`).

Na branch `feat/rbac-matriz`, em 06/11/2026, antes do merge do #35, eram 131 casos (24 rotas). Depois entraram o `GET /dashboard/inadimplentes` do #40 (136 casos e 25 rotas em `5823a81`) e as três rotas `/me/atividades` do #46, com o caso do RN16 no contrato da issue.

**Prova de que o teste pega a falha.** Com os `@Roles` novos removidos (o estado da `main` revisada pelo professor), a versão do arquivo só com os cargos de funcionário falha em 15 casos, exatamente as violações apontadas na issue:

```
INSTRUTOR POST /membros → 403
INSTRUTOR PATCH /membros/:id → 403
INSTRUTOR PATCH /membros/:id/desativar → 403
INSTRUTOR PATCH /membros/:id/reativar → 403
INSTRUTOR GET /membros/:id/situacao → 403
INSTRUTOR GET /pagamentos → 403
INSTRUTOR POST /pagamentos → 403
INSTRUTOR GET /pagamentos/:id → 403
INSTRUTOR PATCH /pagamentos/:id/pagar → 403
INSTRUTOR PATCH /pagamentos/:id/cancelar → 403
RECEPCIONISTA POST /atividades → 403
INSTRUTOR não acessa pagamentos nem a situação financeira
RECEPCIONISTA não registra atividade: 403 e nada gravado
corpo inválido com cargo sem permissão → 403, não 400
toda rota declara @Roles ou @Public
```

No CI, o mesmo arquivo roda no passo de e2e do job `Lint, build e testes`, que a proteção da `main` exige (veja [quality-gate](../quality-gate/README.md)).

## 4. O que falta e quando

Toda linha da matriz 4.2 tem rota e teste; a última, a do acesso do aluno, fica 🔄 até o merge da MEM-07.
