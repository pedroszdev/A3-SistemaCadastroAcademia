import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelarPagamento,
  estaEmAberto,
  listarPagamentos,
  type Pagamento,
  podeGerirPagamentos,
  registrarPagamento,
  type StatusPagamento,
} from "./api";

const fetchMock = vi.fn<typeof fetch>();

function ultimaChamada() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, init };
}

function pagamentoComStatus(status: StatusPagamento): Pagamento {
  return {
    id: "p1",
    membroId: "m1",
    valor: 150,
    dataVencimento: "2026-11-01T00:00:00.000Z",
    dataPagamento: null,
    status,
    diasEmAtraso: 0,
    membro: { id: "m1", nome: "Fulano Silva" },
  };
}

describe("api de pagamentos", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("lista só com page e pageSize quando não há filtro", async () => {
    await listarPagamentos({ page: 1 });

    expect(ultimaChamada().url).toBe("/api/pagamentos?page=1&pageSize=20");
  });

  it("inclui todos os filtros na ordem esperada", async () => {
    await listarPagamentos({
      membroId: "m1",
      status: "ATRASADO",
      vencimentoDe: "2026-11-01",
      vencimentoAte: "2026-11-30",
      page: 2,
    });

    expect(ultimaChamada().url).toBe(
      "/api/pagamentos?membroId=m1&status=ATRASADO&vencimentoDe=2026-11-01&vencimentoAte=2026-11-30&page=2&pageSize=20",
    );
  });

  it("omite do filtro os campos vazios", async () => {
    await listarPagamentos({ status: undefined, vencimentoDe: "", page: 3 });

    expect(ultimaChamada().url).toBe("/api/pagamentos?page=3&pageSize=20");
  });

  it("registra com PATCH e body vazio quando não há data", async () => {
    await registrarPagamento("id 1");

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/pagamentos/id%201/pagar");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe("{}");
  });

  it("registra com a data informada", async () => {
    await registrarPagamento("id 1", "2026-11-05");

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/pagamentos/id%201/pagar");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify({ dataPagamento: "2026-11-05" }));
  });

  it("cancela com PATCH e sem body", async () => {
    await cancelarPagamento("id 1");

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/pagamentos/id%201/cancelar");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBeUndefined();
  });
});

describe("podeGerirPagamentos", () => {
  it("libera ADMIN e RECEPCIONISTA", () => {
    expect(podeGerirPagamentos({ tipo: "FUNCIONARIO", cargo: "ADMIN" })).toBe(true);
    expect(podeGerirPagamentos({ tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" })).toBe(true);
  });

  it("barra INSTRUTOR e aluno", () => {
    expect(podeGerirPagamentos({ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" })).toBe(false);
    expect(podeGerirPagamentos({ tipo: "ALUNO" })).toBe(false);
  });
});

describe("estaEmAberto", () => {
  it("é verdadeiro para PENDENTE e ATRASADO", () => {
    expect(estaEmAberto(pagamentoComStatus("PENDENTE"))).toBe(true);
    expect(estaEmAberto(pagamentoComStatus("ATRASADO"))).toBe(true);
  });

  it("é falso para PAGO e CANCELADO", () => {
    expect(estaEmAberto(pagamentoComStatus("PAGO"))).toBe(false);
    expect(estaEmAberto(pagamentoComStatus("CANCELADO"))).toBe(false);
  });
});
