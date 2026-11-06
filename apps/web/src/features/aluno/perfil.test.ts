import { beforeEach, describe, expect, it, vi } from "vitest";

async function carregar(apiUrl?: string) {
  vi.resetModules();
  vi.stubEnv("API_URL", apiUrl);
  return import("./perfil");
}

describe("buscarPerfilDoAluno", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("chama o /auth/me da API com o Bearer e devolve o nome", async () => {
    const { buscarPerfilDoAluno } = await carregar("https://api.exemplo.com");
    fetchMock.mockResolvedValue(Response.json({ id: "1", nome: "Joana Souza" }));

    const perfil = await buscarPerfilDoAluno("token-abc");

    expect(perfil).toEqual({ nome: "Joana Souza", semAcesso: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.exemplo.com/auth/me");
    expect(init?.headers).toEqual({ Authorization: "Bearer token-abc" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("usa http://localhost:3000 quando API_URL não está definida", async () => {
    const { buscarPerfilDoAluno } = await carregar();
    fetchMock.mockResolvedValue(Response.json({ nome: "Joana Souza" }));

    await buscarPerfilDoAluno("token-abc");

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/auth/me");
  });

  it("marca sem acesso quando a API recusa o token (401)", async () => {
    const { buscarPerfilDoAluno } = await carregar();
    fetchMock.mockResolvedValue(Response.json({}, { status: 401 }));

    expect(await buscarPerfilDoAluno("token-abc")).toEqual({
      nome: null,
      semAcesso: true,
    });
  });

  it("fica sem nome, mas com acesso, quando a API dá outro erro", async () => {
    const { buscarPerfilDoAluno } = await carregar();
    fetchMock.mockResolvedValue(Response.json({}, { status: 500 }));

    expect(await buscarPerfilDoAluno("token-abc")).toEqual({
      nome: null,
      semAcesso: false,
    });
  });

  it("fica sem nome quando a API não responde ou estoura o tempo", async () => {
    const { buscarPerfilDoAluno } = await carregar();
    fetchMock.mockRejectedValue(new DOMException("timeout", "TimeoutError"));

    expect(await buscarPerfilDoAluno("token-abc")).toEqual({
      nome: null,
      semAcesso: false,
    });
  });

  it("fica sem nome quando o corpo não tem nome", async () => {
    const { buscarPerfilDoAluno } = await carregar();
    fetchMock.mockResolvedValue(Response.json({ id: "1" }));

    expect(await buscarPerfilDoAluno("token-abc")).toEqual({
      nome: null,
      semAcesso: false,
    });
  });
});
