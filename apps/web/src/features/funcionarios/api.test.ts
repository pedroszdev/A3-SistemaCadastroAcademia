import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  atualizarFuncionario,
  criarFuncionario,
  desativarFuncionario,
  listarFuncionarios,
  reativarFuncionario,
} from "./api";

const fetchMock = vi.fn<typeof fetch>();

function ultimaChamada() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, init };
}

describe("api de funcionários", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("lista só com page e pageSize quando não há filtro", async () => {
    await listarFuncionarios({ page: 1 });

    expect(ultimaChamada().url).toBe("/api/funcionarios?page=1&pageSize=20");
  });

  it("aceita outro pageSize", async () => {
    await listarFuncionarios({ page: 3 }, 100);

    expect(ultimaChamada().url).toBe("/api/funcionarios?page=3&pageSize=100");
  });

  it("inclui cargo e ativo=false no filtro", async () => {
    await listarFuncionarios({ cargo: "INSTRUTOR", ativo: false, page: 2 });

    expect(ultimaChamada().url).toBe(
      "/api/funcionarios?cargo=INSTRUTOR&ativo=false&page=2&pageSize=20",
    );
  });

  it("cria com POST e o body em JSON", async () => {
    const dados = { nome: "Ana Souza", login: "ana01", cargo: "ADMIN" as const, senha: "senha1234" };

    await criarFuncionario(dados);

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/funcionarios");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify(dados));
  });

  it("atualiza com PATCH sem o login", async () => {
    await atualizarFuncionario("id 1", { nome: "Ana Souza", cargo: "INSTRUTOR" });

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/funcionarios/id%201");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify({ nome: "Ana Souza", cargo: "INSTRUTOR" }));
  });

  it("desativa e reativa pelas sub-rotas", async () => {
    await desativarFuncionario("abc");
    await reativarFuncionario("abc");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/funcionarios/abc/desativar");
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PATCH");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/funcionarios/abc/reativar");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PATCH");
  });
});
