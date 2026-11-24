# Regressão manual pré-entrega (QA-04)

Roteiro para passar pelo sistema inteiro antes da entrega e conferir que nada quebrou. Ele cobre todas as telas, as três visões de funcionário (ADMIN, RECEPCIONISTA e INSTRUTOR) e o portal do aluno, sempre com o banco do seed.

Os testes automatizados (unitários, e2e e o CI em todo PR) já cobrem as regras uma a uma. Este roteiro confere o que eles não veem: as telas ligadas umas às outras, os menus e o que cada cargo enxerga no navegador.

Bug encontrado vira issue pelo template **Bug**, com a label `bug` e a do módulo, atribuída ao dono (fluxo da INF-01). A correção precisa entrar antes de 29/11.

## 1. Preparação

Requisitos e primeiros passos no [README](../../README.md). Para cada execução:

```bash
pnpm db:up
pnpm --filter api exec prisma migrate reset --force   # banco zerado, com as migrations aplicadas
pnpm db:seed                                         # dados fictícios do seed
pnpm dev                                             # API em :3000 e front em :3001
```

O `migrate reset` é necessário porque o roteiro cadastra um membro e um funcionário novos, que o seed não apaga. Como membro e funcionário não são excluídos (RN03), rodar de novo sem zerar o banco daria CPF e login repetidos.

Abrir `http://localhost:3001` numa janela anônima. A senha de todos os usuários do seed é `senha1234`.

| Quem | Como entra | Para que serve no roteiro |
| --- | --- | --- |
| Administrador | login `admin` | Visão ADMIN |
| Recepção | login `recepcao` | Visão RECEPCIONISTA |
| Instrutor | login `instrutor` | Visão INSTRUTOR |
| Ana Souza | aba Aluno, CPF `418.723.956-19` | Aluna com acesso liberado, com treinos e atividades |
| Bruno Lima | — | Inadimplente: pagamento atrasado há 15 dias (RN09) |
| Carla Mendes | aba Aluno, CPF `714.602.381-84` | Atrasada há 5 dias, ainda na tolerância; sem acesso ao portal |
| Isabela Moura e João Pereira | — | Membros inativos (RN03, RN04) |

Dados criados durante o roteiro (fictícios): o membro **Teste Regressão**, CPF `529.982.247-25`, e o funcionário **Recepção Regressão**, login `recepcaoregressao`.

## 2. Checklist

Os números do seed são relativos à data da execução: o Bruno sempre aparece com 15 dias de atraso, e as datas da tela mudam com o dia.

### Visão ADMIN (login `admin`)

| # | Tela | Passos | Resultado esperado | Regra |
| --- | --- | --- | --- | --- |
| 1 | Login | Entrar com `admin` e uma senha errada. Depois, com `senha1234` | Senha errada: "Login ou senha inválidos.", sem dizer qual dos dois está errado. Senha certa: abre o `/dashboard` | RN12 |
| 2 | Menu e dashboard | Conferir o menu e os cards | Menu com Dashboard, Membros, Treinos, Pagamentos, Histórico e Funcionários. Cinco cards (membros ativos, inadimplentes, pagamentos atrasados, receita do mês, atividades hoje) e a lista "Membros inadimplentes" só com o Bruno Lima, 15 dias | RN09, matriz 4.2 |
| 3 | Dashboard → ficha | Clicar em "Bruno Lima" na lista de inadimplentes | Abre a ficha `/membros/<id>` do Bruno, com os badges Ativo e Inadimplente ("1 em atraso, maior atraso de 15 dias"), o treino mais recente e as atividades dos últimos 30 dias | Issue #78 |
| 4 | Ficha: abas | Passar pelas abas Treinos, Pagamentos e Histórico | Treinos: o treino Funcional. Pagamentos: um atrasado (15 dias) e um pago. Histórico: as atividades do Bruno, sem a coluna de membro | WEB-G3, WEB-Y4 |
| 5 | Membros: busca e filtro | Em `/membros`, buscar "ana", depois "4187". Limpar e filtrar a situação por Inativos | "ana" e "4187" trazem só a Ana Souza (por nome e pelo início do CPF). Inativos: Isabela Moura e João Pereira | RN03 |
| 6 | Novo membro: validação | "Novo membro" e Salvar com tudo vazio. Depois, CPF `111.111.111-11`. Depois, o CPF da Ana (`418.723.956-19`) | Vazio: uma mensagem em cada campo. Sequência repetida: "cpf deve ser um CPF válido". CPF da Ana: "CPF já cadastrado" no próprio campo | RN01, RN02 |
| 7 | Novo membro: cadastro | Nome "Teste Regressão", CPF `529.982.247-25`, telefone `48999990099`, endereço "Rua Fictícia, 99". Salvar | CPF e telefone ganham máscara ao digitar. Aviso "Membro cadastrado." e volta para a lista, que mostra o membro novo como Ativo | RN01 |
| 8 | Editar membro | Na ficha do Teste Regressão, "Editar". Trocar o endereço para "Rua Fictícia, 100" e salvar | O CPF aparece desabilitado. Aviso "Membro atualizado." e o endereço novo na ficha | RN02 |
| 9 | Acesso do aluno | Na ficha, "Liberar acesso" com a senha `curta`. Depois, `aluno1234` nos dois campos | `curta`: "senha deve ter no mínimo 8 caracteres". `aluno1234`: o badge passa de "Sem acesso" para "Acesso liberado", com "Redefinir senha" e "Revogar acesso" | RN15, MEM-07 |
| 10 | Desativar e reativar | Na ficha, "Desativar" e confirmar. Abrir a aba Pagamentos. Depois, "Reativar" e confirmar | Inativo: o badge muda, "Liberar/Redefinir" dá lugar a "Membro inativo não pode receber acesso ao portal." e a aba Pagamentos mostra "Membro inativo não recebe novo pagamento." sem o botão. Reativar volta tudo a Ativo | RN03, RN04 |
| 11 | Treinos | Em `/treinos`, "Novo treino" para o Teste Regressão: Musculação, duração 301 e início ontem. Corrigir para 45 min e hoje, com a descrição "Treino da regressão" (obrigatória, de 3 a 500 caracteres). Editar para 50 min. Excluir. Filtrar o tipo por Cardio | 301 e ontem: "duracao deve ser no máximo 300 minutos" e "dataInicio não pode ser anterior a hoje". Correto: "Treino cadastrado." e a linha no topo. Na edição o membro não muda. A exclusão pede confirmação e a linha some. Cardio: só os 2 treinos de Cardio | RN05 |
| 12 | Pagamentos: lista e filtro | Em `/pagamentos`, filtrar o status por Atrasado | Só Carla Mendes ("Atrasado · 5 dias") e Bruno Lima ("Atrasado · 15 dias") | RN07 |
| 13 | Novo pagamento: validação | "Novo pagamento". Buscar "Isabela". Depois, escolher o Teste Regressão com valor `0`. Depois, valor 130,00 e vencimento em 01/01 do ano atual | Isabela: "Nenhum membro ativo encontrado". Valor 0: "valor deve ser no mínimo 0,01". Vencimento antigo: "O vencimento não pode ter mais de 90 dias no passado" | RN04, RN06 |
| 14 | Novo pagamento: cadastro e duplicado | Teste Regressão, R$ 120,00, vencimento daqui a 7 dias. Salvar. Lançar de novo o mesmo membro com o mesmo vencimento | O valor ganha a máscara "R$ 120,00" e a cobrança aparece como Pendente. A segunda é recusada com "Já existe um registro com esses dados." | RN06 |
| 15 | Pagar e cancelar | "Registrar pagamento" na cobrança do Teste Regressão, com a data em branco. "Cancelar" a cobrança pendente do Felipe Costa | Pagamento: confirmação com valor e vencimento; a linha vira Pago, com a data de hoje e sem ações. Cancelamento: a linha vira Cancelado, sem ações | RN07, RN08 |
| 16 | Histórico: inadimplente | Em `/atividades`, "Registrar atividade" e escolher o Bruno Lima | Aviso "Membro com pagamento em atraso" (maior atraso: 15 dias) assim que o membro é escolhido, com o Salvar desabilitado | RN09 |
| 17 | Histórico: registro | Trocar para a Ana Souza. Data de amanhã e tempo 601. Corrigir para hoje e 40 min, atividade "Leg press", treino Cardio. Salvar. Filtrar o funcionário por Administrador | O campo Treino lista só os treinos da Ana. Amanhã e 601: "data não pode ser uma data futura" e "tempoExecucao deve ser no máximo 600 minutos". Correto: "Atividade registrada." e a linha no topo com o funcionário Administrador. O filtro mostra só as atividades do Administrador | RN10, RN11 |
| 18 | Funcionários | Em `/funcionarios`, "Novo funcionário" com login `admin`. Depois, `recepcao.regressao`. Depois, nome "Recepção Regressão", login `recepcaoregressao`, Recepcionista. Editar o cargo para Instrutor. Desativar | `admin`: "Login já cadastrado". Com ponto: "login deve ter apenas letras e números". Cadastro: aparece Ativo. Na edição o login fica travado. Desativar: Inativo, com "Reativar" | RN03, RN13 |
| 19 | Funcionários: a si mesmo | "Desativar" na linha do Administrador e confirmar | Aviso "Você não pode desativar o próprio usuário", e o admin continua Ativo | RN13 |

### Visão RECEPCIONISTA (login `recepcao`)

| # | Tela | Passos | Resultado esperado | Regra |
| --- | --- | --- | --- | --- |
| 20 | Menu, dashboard e telas | Entrar. Conferir o menu e o dashboard. Abrir `/funcionarios` pela URL. Abrir `/membros`, `/pagamentos`, `/treinos` e `/atividades` | Menu sem Funcionários. Dashboard com a lista de inadimplentes. `/funcionarios`: "Acesso restrito". Membros com "Novo membro" e Pagamentos com "Novo pagamento". Treinos sem "Novo treino", "Editar" e "Excluir". Histórico sem "Registrar atividade" | Matriz 4.2 |
| 21 | Ficha | Abrir a ficha do Bruno Lima | Igual à do ADMIN: Inadimplente, Editar, Desativar, acesso do aluno e as três abas | Matriz 4.2 |

### Visão INSTRUTOR (login `instrutor`)

| # | Tela | Passos | Resultado esperado | Regra |
| --- | --- | --- | --- | --- |
| 22 | Menu, dashboard e telas | Entrar. Conferir o menu e o dashboard. Abrir `/pagamentos`, `/funcionarios` e `/membros/novo` pela URL. Abrir `/membros` e `/treinos` | Menu só com Dashboard, Membros, Treinos e Histórico. Dashboard com os cards, sem a lista de inadimplentes. As três URLs mostram "Acesso restrito". Membros sem "Novo membro". Treinos com "Novo treino", "Editar" e "Excluir" | Matriz 4.2 |
| 23 | Ficha e inadimplente | Abrir a ficha do Bruno Lima. Em `/atividades`, registrar uma atividade de hoje para ele | Ficha sem situação financeira, sem a contagem de atividades, sem Editar e Desativar, sem os botões de acesso e sem a aba Pagamentos. Atividade: o aviso "Membro com pagamento em atraso" só aparece depois do Salvar (a API responde 422) e o Salvar fica desabilitado | RN09, matriz 4.2 |

### Portal do aluno e sessão

| # | Tela | Passos | Resultado esperado | Regra |
| --- | --- | --- | --- | --- |
| 24 | Sem sessão | Sair. Abrir `/membros` e `/aluno/treinos` pela URL | As duas voltam para o `/login` | RN14 |
| 25 | Login do aluno | Aba Aluno: CPF da Carla. Depois, CPF da Ana com senha errada. Depois, o Teste Regressão com `aluno1234` | Carla (sem acesso) e senha errada: a mesma mensagem, "CPF ou senha inválidos.". Teste Regressão: entra no portal com o próprio nome, porque o acesso foi liberado no passo 9 | RN12, RN15 |
| 26 | Meus treinos | Sair e entrar como Ana Souza. Abrir "Meus treinos". Filtrar Cardio. Voltar para todos e clicar no card de Musculação | Só os 2 treinos da Ana, do mais recente para o mais antigo. Cardio: só 1. O card abre o detalhe com a descrição inteira | RN16, WEB-G6 |
| 27 | Meu histórico | Abrir "Meu histórico". Trocar o período para 7 dias e Mês atual | Cards de atividades e minutos do período, e a lista só com as atividades da Ana, incluindo a "Leg press" do passo 17. Os números mudam com o período | RN16, WEB-Y6 |
| 28 | Isolamento das áreas | Como Ana, abrir `/dashboard` e `/membros` pela URL. Sair, entrar como `instrutor` e abrir `/aluno/treinos` | O aluno volta para `/aluno` e o funcionário para `/dashboard`. Nenhum vê a área do outro | RN17, WEB-05 |
| 29 | Celular | Como Ana, abrir o portal numa largura de celular (390 px, pelo modo responsivo do navegador) | "Meus treinos" e "Meu histórico" em coluna única, sem rolagem horizontal | WEB-05 |

## 3. Execuções

Na rodada final, depois do code freeze, refazer o roteiro inteiro na `main` final e acrescentar uma linha aqui.

| Data | Commit da `main` | Ambiente | Passos | Bugs | Executado por |
| --- | --- | --- | --- | --- | --- |
| 18/11/2026 | `c59cc21` (depois do PR #79, com a ficha) | Local, `pnpm dev`, PostgreSQL 17 no Docker, Google Chrome, banco do seed | 29 de 29 ✅ | 0 | Yohan Nascimento da Costa (Testador) |
| 23/11/2026 (rodada final, code freeze) | `7a220b1` (depois do PR #80) | Local, `pnpm dev`, PostgreSQL 17 no Docker, Google Chrome 158, banco novo só com as migrations e o seed | 29 de 29 ✅ | 0 | Yohan Nascimento da Costa (Testador) |

### Observações da execução de 18/11

Nenhuma das observações abaixo é bug, porque o comportamento bate com as regras e com o que o backlog descreve. Elas ficam registradas para quem quiser melhorar e para a rodada final.

- **Passo 14:** o 409 do vencimento repetido chega com a mensagem genérica do filtro de erros do Prisma ("Já existe um registro com esses dados."). A regra funciona, mas uma mensagem como "Este membro já tem uma cobrança com esse vencimento" seria mais clara.
- **Passo 8:** depois de editar, a tela volta para a lista de membros, e não para a ficha. É o comportamento descrito na WEB-G2, que deixou a troca do destino como opcional para a WEB-G3.
- **Só no modo de desenvolvimento:** o selo "1 Insight" do Next.js fica no canto inferior esquerdo, por cima do botão "Sair" do menu. O console também mostra o aviso `instant-shell-url-data` ao abrir `/membros/<id>` e `/membros/<id>/editar`. Nada disso aparece no build de produção, e as telas funcionam normalmente.

### Observações da rodada final de 23/11

Entre `c59cc21` e `7a220b1` só mudaram arquivos de `docs/`, então o código testado é o mesmo de 18/11, agora como `main` do code freeze. Não há PR de código aberto. Os 29 passos passaram de novo, sem bug e sem issue aberta.

- **Passo 11:** o roteiro não pedia a descrição do treino, que é obrigatória (de 3 a 500 caracteres). Sem ela, o formulário mostra "descricao deve ter entre 3 e 500 caracteres" junto dos outros erros. O passo foi corrigido acima e agora informa a descrição.
- **Passo 24:** o selo do Next.js do modo de desenvolvimento ainda cobre quase todo o botão "Sair". O clique funciona na borda direita do botão. No build de produção o selo não existe.
- **Passo 27:** em 23/11, "30 dias" e "Mês atual" mostram os mesmos números (7 atividades e 310 minutos), porque todas as atividades da Ana nos últimos 30 dias caem em novembro. "7 dias" muda para 5 atividades e 225 minutos. Não é bug, é a data da execução.
- **Passos 14 e 18:** o 409 (cobrança repetida e login já cadastrado) aparece no rodapé do formulário, com o modal aberto, e não num toast. O resultado esperado do roteiro não diz onde a mensagem aparece, então o passo conta como ok.
