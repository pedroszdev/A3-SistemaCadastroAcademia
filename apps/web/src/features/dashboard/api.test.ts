import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarInadimplentes, buscarResumo } from "./api";

function respostaJson(corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api do dashboard", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("buscarResumo chama /api/dashboard e devolve o resumo", async () => {
    const resumo = {
      membrosAtivos: 10,
      membrosInadimplentes: 2,
      pagamentosAtrasados: 3,
      receitaMes: 1500,
      atividadesHoje: 4,
    };
    fetchMock.mockResolvedValue(respostaJson(resumo));

    await expect(buscarResumo()).resolves.toEqual(resumo);
    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard", expect.any(Object));
  });

  it("buscarInadimplentes chama /api/dashboard/inadimplentes e devolve a lista", async () => {
    const lista = [{ id: "m1", nome: "Maria Souza", maiorAtrasoDias: 15 }];
    fetchMock.mockResolvedValue(respostaJson(lista));

    await expect(buscarInadimplentes()).resolves.toEqual(lista);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dashboard/inadimplentes",
      expect.any(Object),
    );
  });
});
