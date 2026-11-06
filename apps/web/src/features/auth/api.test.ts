import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MENSAGEM_CPF_INVALIDO,
  MENSAGEM_FALHA_LOGIN,
  MENSAGEM_LOGIN_INVALIDO,
  entrar,
  entrarAluno,
  sair,
} from "./api";

describe("entrar", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const credenciais = { login: "maria01", senha: "senha1234" };

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("envia as credenciais para /api/sessao", async () => {
    fetchMock.mockResolvedValue(Response.json({ funcionario: {} }));

    await entrar(credenciais);

    expect(fetchMock).toHaveBeenCalledWith("/api/sessao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais),
    });
  });

  it("resolve quando o login dá certo", async () => {
    fetchMock.mockResolvedValue(Response.json({ funcionario: {} }));

    await expect(entrar(credenciais)).resolves.toBeUndefined();
  });

  it("lança a mensagem genérica num 401", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 401 }));

    await expect(entrar(credenciais)).rejects.toThrow(MENSAGEM_LOGIN_INVALIDO);
  });

  it("lança a mensagem de falha quando a API está fora", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 502 }));

    await expect(entrar(credenciais)).rejects.toThrow(MENSAGEM_FALHA_LOGIN);
  });

  it("lança a mensagem de falha sem rede", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(entrar(credenciais)).rejects.toThrow(MENSAGEM_FALHA_LOGIN);
  });
});

describe("entrarAluno", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const credenciais = { cpf: "52998224725", senha: "senha1234" };

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("envia cpf e senha para /api/sessao/aluno", async () => {
    fetchMock.mockResolvedValue(Response.json({ aluno: {} }));

    await expect(entrarAluno(credenciais)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith("/api/sessao/aluno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais),
    });
  });

  it("lança a mensagem de CPF ou senha num 401", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 401 }));

    await expect(entrarAluno(credenciais)).rejects.toThrow(MENSAGEM_CPF_INVALIDO);
  });

  it("lança a mensagem de falha quando a API está fora", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 500 }));

    await expect(entrarAluno(credenciais)).rejects.toThrow(MENSAGEM_FALHA_LOGIN);
  });

  it("lança a mensagem de falha sem rede", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(entrarAluno(credenciais)).rejects.toThrow(MENSAGEM_FALHA_LOGIN);
  });
});

describe("sair", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("apaga a sessão com DELETE /api/sessao", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await sair();

    expect(fetchMock).toHaveBeenCalledWith("/api/sessao", { method: "DELETE" });
  });

  it("lança erro quando não consegue sair", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(sair()).rejects.toThrow("Não foi possível sair");
  });
});
