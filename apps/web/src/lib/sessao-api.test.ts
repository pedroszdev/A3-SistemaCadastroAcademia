import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function carregar(apiUrl?: string) {
  vi.resetModules();
  vi.stubEnv("API_URL", apiUrl);
  return import("./sessao-api");
}

function tokenComExp(exp: number) {
  const payload = btoa(
    JSON.stringify({ sub: "1", tipo: "FUNCIONARIO", cargo: "ADMIN", exp }),
  ).replaceAll("=", "");
  return `cabecalho.${payload}.assinatura`;
}

function login(corpo: unknown = { login: "maria01", senha: "senha1234" }) {
  return new Request("http://localhost:3001/api/sessao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

describe("criarSessao", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const agora = new Date("2026-11-06T12:00:00.000Z");
  const agoraEmSegundos = agora.getTime() / 1000;
  const funcionario = { id: "1", nome: "Maria", cargo: "ADMIN" };

  beforeEach(() => {
    vi.useFakeTimers({ now: agora });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("chama o /auth/login da API só com login e senha", async () => {
    const { criarSessao } = await carregar("https://api.exemplo.com");
    fetchMock.mockResolvedValue(
      Response.json({ accessToken: tokenComExp(agoraEmSegundos + 60), funcionario }),
    );

    await criarSessao(login({ login: "maria01", senha: "senha1234", extra: 1 }));

    expect(fetchMock).toHaveBeenCalledWith("https://api.exemplo.com/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: "maria01", senha: "senha1234" }),
    });
  });

  it("usa http://localhost:3000 quando API_URL não está definida", async () => {
    const { criarSessao } = await carregar();
    fetchMock.mockResolvedValue(
      Response.json({ accessToken: tokenComExp(agoraEmSegundos + 60), funcionario }),
    );

    await criarSessao(login());

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/auth/login");
  });

  it("grava o token no cookie httpOnly até o exp e não devolve o token", async () => {
    const { criarSessao } = await carregar();
    const token = tokenComExp(agoraEmSegundos + 28_800);
    fetchMock.mockResolvedValue(Response.json({ accessToken: token, funcionario }));

    const res = await criarSessao(login());

    expect(res.status).toBe(200);
    expect(res.headers.get("Set-Cookie")).toBe(
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`,
    );
    const corpo = await res.json();
    expect(corpo).toEqual({ funcionario });
    expect(JSON.stringify(corpo)).not.toContain(token);
  });

  it.each([400, 401])(
    "responde 401 com mensagem genérica quando a API dá %i",
    async (status) => {
      const { criarSessao, MENSAGEM_CREDENCIAL_INVALIDA } = await carregar();
      fetchMock.mockResolvedValue(Response.json({ message: "detalhe" }, { status }));

      const res = await criarSessao(login());

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        statusCode: 401,
        message: MENSAGEM_CREDENCIAL_INVALIDA,
        error: "Unauthorized",
      });
      expect(res.headers.has("Set-Cookie")).toBe(false);
    },
  );

  it("manda credenciais vazias quando o corpo não é JSON", async () => {
    const { criarSessao } = await carregar();
    fetchMock.mockResolvedValue(Response.json({}, { status: 400 }));

    const res = await criarSessao(login("não é json"));

    expect(fetchMock.mock.calls[0][1]?.body).toBe("{}");
    expect(res.status).toBe(401);
  });

  it.each(["text/plain", "application/x-www-form-urlencoded", "multipart/form-data"])(
    "recusa com 415 o corpo enviado como %s, sem chamar a API",
    async (tipo) => {
      const { criarSessao } = await carregar();
      fetchMock.mockResolvedValue(
        Response.json({ accessToken: tokenComExp(agoraEmSegundos + 3600), funcionario }),
      );

      const res = await criarSessao(
        new Request("http://localhost:3001/api/sessao", {
          method: "POST",
          headers: { "Content-Type": tipo },
          body: JSON.stringify({ login: "maria01", senha: "senha1234" }),
        }),
      );

      expect(res.status).toBe(415);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(res.headers.has("Set-Cookie")).toBe(false);
    },
  );

  it("aceita application/json com charset", async () => {
    const { criarSessao } = await carregar();
    fetchMock.mockResolvedValue(
      Response.json({ accessToken: tokenComExp(agoraEmSegundos + 3600), funcionario }),
    );

    const res = await criarSessao(
      new Request("http://localhost:3001/api/sessao", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ login: "maria01", senha: "senha1234" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("devolve 502 quando a API não responde", async () => {
    const { criarSessao } = await carregar();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const res = await criarSessao(login());

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ message: "API indisponível" });
  });

  it("devolve 502 quando a API dá erro interno", async () => {
    const { criarSessao } = await carregar();
    fetchMock.mockResolvedValue(new Response("erro", { status: 500 }));

    const res = await criarSessao(login());

    expect(res.status).toBe(502);
  });
});

describe("criarSessaoAluno", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const agora = new Date("2026-11-06T12:00:00.000Z");
  const agoraEmSegundos = agora.getTime() / 1000;
  const aluno = { id: "1", nome: "Joana" };
  const credenciais = { cpf: "52998224725", senha: "senha1234" };

  function loginAluno(corpo: unknown = credenciais, contentType = "application/json") {
    return new Request("http://localhost:3001/api/sessao/aluno", {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: JSON.stringify(corpo),
    });
  }

  beforeEach(() => {
    vi.useFakeTimers({ now: agora });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("chama o /auth/login-aluno da API só com cpf e senha", async () => {
    const { criarSessaoAluno } = await carregar("https://api.exemplo.com");
    fetchMock.mockResolvedValue(
      Response.json({ accessToken: tokenComExp(agoraEmSegundos + 60), aluno }),
    );

    await criarSessaoAluno(loginAluno({ ...credenciais, extra: 1 }));

    expect(fetchMock).toHaveBeenCalledWith("https://api.exemplo.com/auth/login-aluno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais),
    });
  });

  it("grava o token no cookie httpOnly até o exp e não devolve o token", async () => {
    const { criarSessaoAluno } = await carregar();
    const token = tokenComExp(agoraEmSegundos + 60);
    fetchMock.mockResolvedValue(Response.json({ accessToken: token, aluno }));

    const res = await criarSessaoAluno(loginAluno());

    expect(res.status).toBe(200);
    expect(res.headers.get("Set-Cookie")).toBe(
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=60`,
    );
    const corpo = await res.json();
    expect(corpo).toEqual({ aluno });
    expect(JSON.stringify(corpo)).not.toContain(token);
  });

  it.each([400, 401])(
    "responde 401 com mensagem genérica quando a API dá %i",
    async (status) => {
      const { criarSessaoAluno, MENSAGEM_CREDENCIAL_ALUNO_INVALIDA } = await carregar();
      fetchMock.mockResolvedValue(Response.json({ message: "detalhe" }, { status }));

      const res = await criarSessaoAluno(loginAluno());

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        statusCode: 401,
        message: MENSAGEM_CREDENCIAL_ALUNO_INVALIDA,
        error: "Unauthorized",
      });
      expect(res.headers.has("Set-Cookie")).toBe(false);
    },
  );

  it("devolve 502 quando a API dá erro interno", async () => {
    const { criarSessaoAluno } = await carregar();
    fetchMock.mockResolvedValue(new Response("erro", { status: 500 }));

    const res = await criarSessaoAluno(loginAluno());

    expect(res.status).toBe(502);
  });

  it("devolve 502 quando a API não responde", async () => {
    const { criarSessaoAluno } = await carregar();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const res = await criarSessaoAluno(loginAluno());

    expect(res.status).toBe(502);
  });

  it("devolve 502 e não grava cookie quando a API responde sem accessToken", async () => {
    const { criarSessaoAluno } = await carregar();
    fetchMock.mockResolvedValue(Response.json({ aluno: { id: "1", nome: "Joana" } }));

    const res = await criarSessaoAluno(loginAluno());

    expect(res.status).toBe(502);
    expect(res.headers.has("Set-Cookie")).toBe(false);
  });

  it("recusa com 415 o corpo que não é JSON, sem chamar a API", async () => {
    const { criarSessaoAluno } = await carregar();

    const res = await criarSessaoAluno(loginAluno(credenciais, "text/plain"));

    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("encerrarSessao", () => {
  it("apaga o cookie do token e responde 204", async () => {
    const { encerrarSessao } = await carregar();

    const res = encerrarSessao();

    expect(res.status).toBe(204);
    expect(res.headers.get("Set-Cookie")).toBe(
      "token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
    );
  });
});
