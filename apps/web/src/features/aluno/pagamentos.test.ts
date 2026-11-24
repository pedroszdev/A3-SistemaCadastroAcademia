import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarResumoDosPagamentos, listarMeusPagamentos } from "./pagamentos";

const fetchMock = vi.fn<typeof fetch>();

describe("api dos pagamentos do aluno", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("busca o resumo", async () => {
    await buscarResumoDosPagamentos();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/me/pagamentos/resumo");
  });

  it("lista sem status, só com a página", async () => {
    await listarMeusPagamentos(undefined, 1);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/me/pagamentos?page=1&pageSize=20");
  });

  it("lista com o status, sem membroId (RN16)", async () => {
    await listarMeusPagamentos("ATRASADO", 2);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/me/pagamentos?status=ATRASADO&page=2&pageSize=20",
    );
  });
});
