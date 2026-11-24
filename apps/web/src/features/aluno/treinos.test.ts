import { beforeEach, describe, expect, it, vi } from "vitest";
import { listarMeusTreinos } from "./treinos";

function respostaJson(corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api dos treinos do aluno", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const pagina = { data: [], total: 0, page: 1, pageSize: 20 };

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("chama a lista sem tipo quando não há filtro", async () => {
    fetchMock.mockResolvedValue(respostaJson(pagina));

    await expect(listarMeusTreinos(undefined, 1)).resolves.toEqual(pagina);
    expect(fetchMock).toHaveBeenCalledWith("/api/me/treinos?page=1&pageSize=20", expect.any(Object));
  });

  it("chama a lista com o tipo, a página e o tamanho", async () => {
    fetchMock.mockResolvedValue(respostaJson(pagina));

    await listarMeusTreinos("Cardio", 2);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me/treinos?tipo=Cardio&page=2&pageSize=20",
      expect.any(Object),
    );
  });

  it("pede o tamanho recebido", async () => {
    fetchMock.mockResolvedValue(respostaJson(pagina));

    await listarMeusTreinos(undefined, 1, 100);

    expect(fetchMock).toHaveBeenCalledWith("/api/me/treinos?page=1&pageSize=100", expect.any(Object));
  });
});
