# Escopo — Sistema de Cadastro de Academia

**A3 Garantia e Qualidade de Software** · UNISUL · Prof. Jorge Werner

Primeira entrega da A3. Este documento é a fonte para as seções 2.1, 2.2 e 2.3 do relatório. As regras de negócio (RN01…RN17) e a matriz de permissões são as do [backlog](BACKLOG.md#4-contrato-compartilhado-regras-de-negócio-e-permissões).

**Responsáveis por seção**

| Seção | Responsável |
| --- | --- |
| 1 Problema atendido | Pedro |
| 2 Atores | Pedro |
| 3 Tecnologias | Pedro |
| 4.1 Autenticação | Pedro |
| 4.2 Funcionários | Pedro |
| 4.3 Membros | Gabriel |
| 4.4 Treinos | Gabriel |
| 4.5 Pagamentos | Yohan |
| 4.6 Histórico de atividades | Yohan |
| 4.7 Dashboard | Pedro |
| 5 Requisitos não funcionais | Pedro |
| 6 Regras de negócio | Pedro |
| 7 Fluxo principal e critérios de aceitação | Yohan |

---

## 1. Problema atendido

> A preencher — Pedro.

## 2. Atores

> A preencher — Pedro.

## 3. Tecnologias

> A preencher — Pedro.

## 4. Requisitos funcionais

Cada módulo tem uma faixa fixa de IDs para que os três escrevam em paralelo sem colisão: Autenticação RF01–RF09, Funcionários RF10–RF19, Membros RF20–RF29, Treinos RF30–RF39, Pagamentos RF40–RF49, Histórico RF50–RF59, Dashboard RF60–RF69. Cada tabela tem o ID do requisito, o que o usuário faz, os perfis que acessam (matriz da seção 4.2 do backlog) e as regras de negócio que se aplicam (seção 4.1 do backlog).

### 4.1 Autenticação

> A preencher — Pedro.

### 4.2 Funcionários

> A preencher — Pedro.

### 4.3 Membros

> A preencher — Gabriel.

### 4.4 Treinos

> A preencher — Gabriel.

### 4.5 Pagamentos

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF40** | Lançar mensalidade para um membro ativo, com valor de **0,01 a 10.000** (2 casas decimais) e data de vencimento obrigatória | ADMIN, RECEPCIONISTA | RN04, RN06 |
| **RF41** | Listar pagamentos com paginação e filtros por membro, status (PENDENTE, PAGO, ATRASADO, CANCELADO) e período de vencimento; cada item traz o status calculado e os dias em atraso | ADMIN, RECEPCIONISTA | RN07 |
| **RF42** | Consultar um pagamento pelo identificador (inexistente → 404) | ADMIN, RECEPCIONISTA | RN07 |
| **RF43** | Registrar o pagamento de uma mensalidade, com data do pagamento opcional (padrão: hoje; não pode ser futura) | ADMIN, RECEPCIONISTA | RN08 |
| **RF44** | Cancelar uma mensalidade que ainda não foi paga (já paga → 409) | ADMIN, RECEPCIONISTA | RN08 |
| **RF45** | Consultar a situação financeira de um membro: em dia ou inadimplente, quantidade de pagamentos atrasados e maior atraso em dias | ADMIN, RECEPCIONISTA | RN07, RN09 |

O INSTRUTOR e o ALUNO não acessam pagamentos (403).

### 4.6 Histórico de atividades

| ID | Requisito | Perfis | Regras |
| --- | --- | --- | --- |
| **RF50** | Registrar atividade de um membro (descrição de **3 a 120** caracteres, data não futura, tempo de **1 a 600 min**, treino opcional do mesmo membro); o funcionário logado é gravado automaticamente | ADMIN, INSTRUTOR | RN04, RN09, RN10, RN11 |
| **RF51** | Listar atividades com paginação e filtros por membro, funcionário e período | ADMIN, RECEPCIONISTA, INSTRUTOR | — |
| **RF52** | Consultar uma atividade pelo identificador (inexistente → 404) e o histórico de um membro | ADMIN, RECEPCIONISTA, INSTRUTOR | — |
| **RF53** | O aluno consulta o próprio histórico (lista com filtro de período, detalhe e resumo do período), sem ver dados de outros membros nem do funcionário além do nome | ALUNO | RN16, RN17 |

A RECEPCIONISTA só consulta; quem registra é o INSTRUTOR ou o ADMIN.

### 4.7 Dashboard

> A preencher — Pedro.

## 5. Requisitos não funcionais

> A preencher — Pedro.

## 6. Regras de negócio

> A preencher — Pedro. Copiar a tabela da seção 4.1 do backlog.

## 7. Fluxo principal e critérios de aceitação

O fluxo principal é o caminho que a demo e o teste e2e `test/fluxo-principal.e2e-spec.ts` (E2E-02) percorrem. Os cenários de inadimplência são cobertos pelo E2E-03.

1. Login do funcionário
2. Cadastrar membro
3. Criar treino
4. Lançar pagamento
5. Registrar o pagamento
6. Registrar atividade
7. Consultar o histórico do membro
8. Conferir o dashboard

### 7.1 Critérios de aceitação do fluxo principal

**CA01 · Login do funcionário**

- **Dado** um funcionário ativo com login e senha válidos
- **Quando** ele faz login
- **Então** recebe um token válido por 8 horas, e `GET /auth/me` com esse token devolve o seu cargo

**CA02 · Cadastrar membro**

- **Dado** uma recepcionista logada e um CPF válido ainda não cadastrado
- **Quando** ela cadastra o membro
- **Então** o membro fica ativo e aparece na lista de membros

**CA03 · Criar treino**

- **Dado** um instrutor logado e um membro ativo
- **Quando** ele cria um treino com tipo da lista, duração entre 1 e 300 min e início a partir de hoje
- **Então** o treino fica vinculado ao membro

**CA04 · Lançar pagamento**

- **Dado** uma recepcionista logada e um membro ativo
- **Quando** ela lança uma mensalidade de R$ 100,00 com vencimento futuro
- **Então** o pagamento é criado com status PENDENTE

**CA05 · Registrar pagamento**

- **Dado** um pagamento PENDENTE
- **Quando** a recepcionista registra o pagamento sem informar a data
- **Então** o status passa a PAGO, com a data de hoje

**CA06 · Registrar atividade**

- **Dado** um instrutor logado, um membro ativo e em dia, e o treino do CA03
- **Quando** ele registra uma atividade de 60 min com data de hoje
- **Então** a atividade é gravada com o instrutor como responsável

**CA07 · Consultar histórico**

- **Dado** o membro com a atividade do CA06
- **Quando** a recepcionista consulta o histórico do membro
- **Então** a atividade aparece no histórico do membro, com o nome do instrutor e os 60 minutos

**CA08 · Conferir o dashboard**

- **Dado** o membro, o pagamento e a atividade dos CA02 a CA06
- **Quando** a recepcionista consulta o dashboard
- **Então** o membro conta nos membros ativos, os R$ 100,00 entram na receita do mês e a atividade entra nas atividades de hoje

### 7.2 Cenários alternativos (inadimplência, RN09)

O limite da tolerância (atraso de 10 dias ainda em dia, de 11 dias inadimplente) é verificado nos unitários PAG-02 e PAG-06; os cenários abaixo usam 15 e 5 dias, como o E2E-03.

**CA09 · Atraso acima da tolerância**

- **Dado** um membro com pagamento vencido há 15 dias e não pago
- **Quando** o instrutor tenta registrar uma atividade
- **Então** recebe 422 "Membro com pagamento em atraso" e nada é gravado

**CA10 · Atraso dentro da tolerância**

- **Dado** um membro com pagamento vencido há 5 dias (dentro da tolerância de 10 dias)
- **Quando** o instrutor registra uma atividade
- **Então** a atividade é gravada

**CA11 · Regularização do atraso**

- **Dado** o membro do CA09
- **Quando** a recepcionista registra o pagamento atrasado e o instrutor tenta de novo
- **Então** a atividade é gravada (201)

**CA12 · Membro inativo**

- **Dado** um membro inativo
- **Quando** a recepcionista tenta lançar um pagamento ou o instrutor tenta registrar uma atividade
- **Então** recebe 422

### 7.3 Rastreabilidade

Quem preencher as seções 4.1, 4.3, 4.4 e 4.7 troca o "(a preencher)" da sua linha pelos RFs correspondentes.

| Critério | RFs | RNs | Teste |
| --- | --- | --- | --- |
| **CA01** | 4.1 (a preencher) | RN14 | E2E-02 |
| **CA02** | 4.3 (a preencher) | RN01, RN02 | E2E-02 |
| **CA03** | 4.4 (a preencher) | RN05 | E2E-02 |
| **CA04** | RF40 | RN06, RN07 | E2E-02 |
| **CA05** | RF43 | RN08 | E2E-02 |
| **CA06** | RF50 | RN04, RN09, RN10, RN11 | E2E-02 |
| **CA07** | RF52 | — | E2E-02 |
| **CA08** | 4.7 (a preencher) | — | E2E-02 |
| **CA09** | RF50 | RN09 | E2E-03 |
| **CA10** | RF50 | RN09 | E2E-03 |
| **CA11** | RF43, RF50 | RN09 | E2E-03 |
| **CA12** | RF40, RF50 | RN04 | PAG-06 / HIS-04 (unitário) |
| Limite de 10/11 dias | RF45 | RN09 | PAG-02 / PAG-06 (unitário) |
