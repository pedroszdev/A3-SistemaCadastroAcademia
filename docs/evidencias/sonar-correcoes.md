# SonarCloud — correções das issues (QA-01)

Registro das issues do Sonar corrigidas por cada um no próprio código: problema → regra → como foi corrigido → commit. É a parte "depois" da seção 2.12 do relatório, ao lado da [análise "antes"](sonar-antes/README.md).

## Pedro

- **Análise de partida:** `main` em `83565f4`, 16/11/2026 (11:05, horário de Brasília), mais o PR #75
- **Situação:** quality gate aprovado, 0 bugs, 0 vulnerabilidades, 0 security hotspots (100% revisados), duplicação 0,7%, cobertura 99,2% e **2 code smells**; o PR #75 trazia mais 1. As 3 linhas são minhas (`git blame`)
- **Onde foi corrigido:** PR #75

| # | Tipo · severidade | Regra | Arquivo | Problema | Como foi corrigido | Commit |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Code smell · Major | `typescript:S6848` | `apps/web/src/components/ui/dialog.tsx` (linha 29) | O fundo escuro do `Dialog` é um `div` com `onClick` (fecha ao clicar fora) e sem papel, e o Sonar o trata como um elemento interativo que não é nativo | `role="presentation"` no fundo. Ele é só decorativo: quem usa teclado fecha com Escape, que o `Dialog` já trata, e o papel `dialog` continua no conteúdo | `ce45d2d` |
| 2 | Code smell · Blocker | `typescript:S2699` | `apps/api/test/membros.e2e-spec.ts` (linha 89) | O teste "redefinir: a senha antiga para de logar" só usava o `.expect(200)` do supertest, que o Sonar não conta como assertion | `expect` de que o login com a senha nova devolve um `accessToken` | `d824d84` |
| 3 | Code smell · Blocker | `typescript:S2699` | `apps/api/test/membros-treinos.e2e-spec.ts` (linha 309) | O teste "RN05 · dataInicio de hoje → 201" também só tinha o `.expect(201)` do supertest | `expect` de que o treino criado volta com o `membroId` e a `dataInicio` de hoje | `7f32e39` |

## Gabriel

- **Análise de partida:** `main` em `7a220b1`, 18/11/2026 (15:29, horário de Brasília), mais o PR #84 (WEB-G5)
- **Situação:** quality gate aprovado, 0 bugs, 0 vulnerabilidades, 0 code smells, 0 security hotspots (100% revisados), duplicação 0,6% e cobertura 98,8%. A análise do PR #84 também não trouxe nenhuma issue
- **Meu código:** membros e treinos na API (`apps/api/src/membros`, `apps/api/src/treinos`, `/me/treinos`) e as telas de membros e treinos no front (`apps/web/src/features/membros`, `apps/web/src/features/treinos`)
- **Resultado:** nenhuma issue para corrigir. Das 3 issues já fechadas no histórico do Sonar, nenhuma estava em linha minha: as 2 do PR #75 estão na tabela do Pedro e a de `auth.http.spec.ts` (06/11) é do módulo de auth

Nenhuma issue foi resolvida desligando a regra, com `NOSONAR` ou marcando como falso positivo.
