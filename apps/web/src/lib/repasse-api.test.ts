import { beforeEach, describe, expect, it, vi } from "vitest";

async function carregar(apiUrl?: string) {
  vi.resetModules();
  vi.stubEnv("API_URL", apiUrl);
  return import("./repasse-api");
}

function requisicao(url: string, init?: RequestInit) {
  return new Request(`http://localhost:3001${url}`, init);
}

describe("repassarParaApi", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("usa http://localhost:3000 quando API_URL não está definida", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(requisicao("/api/health"), ["health"]);

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/health");
  });

  it("usa API_URL quando definida", async () => {
    const { repassarParaApi } = await carregar("https://api.exemplo.com");

    await repassarParaApi(requisicao("/api/membros"), ["membros"]);

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.exemplo.com/membros");
  });

  it("repassa o caminho e a query string", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(requisicao("/api/membros/1?page=2&q=ana"), [
      "membros",
      "1",
    ]);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/membros/1?page=2&q=ana",
    );
  });

  it("manda Authorization quando o cookie do token veio", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(
      requisicao("/api/membros", { headers: { cookie: "a=1; token=abc" } }),
      ["membros"],
    );

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer abc");
  });

  it("manda sem Authorization e sem outros headers do navegador", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(
      requisicao("/api/membros", { headers: { "x-outro": "1" } }),
      ["membros"],
    );

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.has("x-outro")).toBe(false);
  });

  it("repassa método, corpo e Content-Type no POST", async () => {
    const { repassarParaApi } = await carregar();
    const corpo = JSON.stringify({ nome: "Fulano" });

    await repassarParaApi(
      requisicao("/api/membros", {
        method: "POST",
        body: corpo,
        headers: { "Content-Type": "application/json" },
      }),
      ["membros"],
    );

    const init = fetchMock.mock.calls[0][1];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(corpo);
    expect(new Headers(init?.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("repassa sem Authorization quando o cookie do token está malformado", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(
      requisicao("/api/membros", { headers: { cookie: "token=%E0" } }),
      ["membros"],
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.has("Authorization")).toBe(false);
  });

  it("não manda corpo no GET", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(requisicao("/api/membros"), ["membros"]);

    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it("devolve status, corpo e Content-Type da API", async () => {
    const { repassarParaApi } = await carregar();
    fetchMock.mockResolvedValue(
      new Response("CPF já cadastrado", {
        status: 409,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    const res = await repassarParaApi(requisicao("/api/membros"), ["membros"]);

    expect(res.status).toBe(409);
    expect(await res.text()).toBe("CPF já cadastrado");
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(res.headers.has("Set-Cookie")).toBe(false);
  });

  it("repassa Content-Disposition e Retry-After e não repassa Set-Cookie da API", async () => {
    const { repassarParaApi } = await carregar();
    fetchMock.mockResolvedValue(
      new Response("nome\nAna", {
        status: 429,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="membros.csv"',
          "Retry-After": "30",
          "Set-Cookie": "outro=1",
        },
      }),
    );

    const res = await repassarParaApi(requisicao("/api/membros"), ["membros"]);

    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="membros.csv"',
    );
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(res.headers.has("Set-Cookie")).toBe(false);
  });

  it("repassa corpo binário sem alterar", async () => {
    const { repassarParaApi } = await carregar();
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([0xff, 0x00, 0x80]), {
        headers: { "Content-Type": "application/octet-stream" },
      }),
    );

    const res = await repassarParaApi(requisicao("/api/membros"), ["membros"]);

    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual([
      0xff, 0x00, 0x80,
    ]);
  });

  it("devolve 204 sem corpo", async () => {
    const { repassarParaApi } = await carregar();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const res = await repassarParaApi(
      requisicao("/api/membros/1", { method: "DELETE" }),
      ["membros", "1"],
    );

    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });

  it("apaga o cookie do token num 401", async () => {
    const { repassarParaApi } = await carregar();
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    const res = await repassarParaApi(requisicao("/api/membros"), ["membros"]);

    expect(res.status).toBe(401);
    expect(res.headers.get("Set-Cookie")).toBe(
      "token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
    );
  });

  it.each([["login"], ["login-aluno"]])(
    "recusa auth/%s com 404 sem chamar a API",
    async (rota) => {
      const { repassarParaApi } = await carregar();

      const res = await repassarParaApi(
        requisicao(`/api/auth/${rota}`, { method: "POST", body: "{}" }),
        ["auth", rota],
      );

      expect(res.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    [["AUTH", "Login"]],
    [["membros", "..", "auth", "login"]],
    [["."]],
  ])("recusa o caminho %j com 404 sem chamar a API", async (caminho) => {
    const { repassarParaApi } = await carregar();

    const res = await repassarParaApi(requisicao("/api/x"), caminho);

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa com 403 um POST de outra origem sem chamar a API", async () => {
    const { repassarParaApi } = await carregar();

    const res = await repassarParaApi(
      requisicao("/api/membros", {
        method: "POST",
        body: "{}",
        headers: {
          origin: "http://site-malicioso.exemplo",
          cookie: "token=abc",
        },
      }),
      ["membros"],
    );

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa com 403 um POST com Origin null", async () => {
    const { repassarParaApi } = await carregar();

    const res = await repassarParaApi(
      requisicao("/api/membros", {
        method: "POST",
        body: "{}",
        headers: { origin: "null", cookie: "token=abc" },
      }),
      ["membros"],
    );

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repassa POST da mesma origem", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(
      requisicao("/api/membros", {
        method: "POST",
        body: "{}",
        headers: { origin: "http://localhost:3001", cookie: "token=abc" },
      }),
      ["membros"],
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("usa x-forwarded-host para conferir a origem", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(
      requisicao("/api/membros", {
        method: "POST",
        body: "{}",
        headers: {
          origin: "https://academia.exemplo.com",
          "x-forwarded-host": "academia.exemplo.com",
          cookie: "token=abc",
        },
      }),
      ["membros"],
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("repassa GET mesmo com Origin de outro site", async () => {
    const { repassarParaApi } = await carregar();

    await repassarParaApi(
      requisicao("/api/membros", {
        headers: { origin: "http://site-malicioso.exemplo" },
      }),
      ["membros"],
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("devolve 502 quando a API não responde", async () => {
    const { repassarParaApi } = await carregar();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const res = await repassarParaApi(requisicao("/api/membros"), ["membros"]);

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({
      statusCode: 502,
      message: "API indisponível",
      error: "Bad Gateway",
    });
  });
});
