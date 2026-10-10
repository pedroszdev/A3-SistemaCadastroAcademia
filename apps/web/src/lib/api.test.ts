import { beforeEach, describe, expect, it, vi } from "vitest";

async function carregarApi(apiUrl?: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", apiUrl);
  return import("./api");
}

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("devolve o JSON da resposta quando a requisição dá certo", async () => {
    const { api } = await carregarApi();
    fetchMock.mockResolvedValue(respostaJson({ status: "ok" }));

    await expect(api("/health")).resolves.toEqual({ status: "ok" });
  });

  it("usa http://localhost:3000 quando NEXT_PUBLIC_API_URL não está definida", async () => {
    const { api } = await carregarApi();
    fetchMock.mockResolvedValue(respostaJson({}));

    await api("/health");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/health",
      expect.any(Object),
    );
  });

  it("usa NEXT_PUBLIC_API_URL quando definida", async () => {
    const { api } = await carregarApi("https://api.exemplo.com");
    fetchMock.mockResolvedValue(respostaJson({}));

    await api("/membros");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.exemplo.com/membros",
      expect.any(Object),
    );
  });

  it("envia JSON e mescla as opções e os headers extras", async () => {
    const { api } = await carregarApi();
    fetchMock.mockResolvedValue(respostaJson({ id: "1" }, 201));
    const body = JSON.stringify({ nome: "Fulano" });

    await api("/membros", {
      method: "POST",
      body,
      headers: { Authorization: "Bearer token" },
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/membros", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
    });
  });

  it("lança ApiError com o status e o texto da resposta quando falha", async () => {
    const { api, ApiError } = await carregarApi();
    fetchMock.mockResolvedValue(
      new Response("CPF já cadastrado", { status: 409 }),
    );

    const erro = await api("/membros").catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({ status: 409, message: "CPF já cadastrado" });
  });
});
