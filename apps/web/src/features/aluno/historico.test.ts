import { beforeEach, describe, expect, it, vi } from "vitest";
import { buscarResumoDoPeriodo, listarMinhasAtividades } from "./historico";

function respostaJson(corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const intervalo = { dataDe: "2026-10-11", dataAte: "2026-11-09" };

describe("api do histórico do aluno", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("buscarResumoDoPeriodo chama o resumo com as datas e devolve os totais", async () => {
    const resumo = { totalAtividades: 7, totalMinutos: 320 };
    fetchMock.mockResolvedValue(respostaJson(resumo));

    await expect(buscarResumoDoPeriodo(intervalo)).resolves.toEqual(resumo);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me/atividades/resumo?dataDe=2026-10-11&dataAte=2026-11-09",
      expect.any(Object),
    );
  });

  it("listarMinhasAtividades chama a lista com as datas, a página e o tamanho", async () => {
    const pagina = { data: [], total: 0, page: 2, pageSize: 20 };
    fetchMock.mockResolvedValue(respostaJson(pagina));

    await expect(listarMinhasAtividades(intervalo, 2)).resolves.toEqual(pagina);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me/atividades?dataDe=2026-10-11&dataAte=2026-11-09&page=2&pageSize=20",
      expect.any(Object),
    );
  });
});
