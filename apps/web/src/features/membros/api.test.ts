import { beforeEach, describe, expect, it, vi } from "vitest";
import { atualizarMembro, buscarMembro, criarMembro, listarMembros } from "./api";

const fetchMock = vi.fn<typeof fetch>();

function ultimaUrl() {
  return fetchMock.mock.calls[0][0];
}

function ultimoInit() {
  return fetchMock.mock.calls[0][1];
}

describe("api de membros", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("lista só com page e pageSize quando não há filtro", async () => {
    await listarMembros({ page: 1 });

    expect(ultimaUrl()).toBe("/api/membros?page=1&pageSize=20");
  });

  it("inclui busca e situação inativa na ordem esperada", async () => {
    await listarMembros({ busca: "ana", ativo: false, page: 2 });

    expect(ultimaUrl()).toBe("/api/membros?busca=ana&ativo=false&page=2&pageSize=20");
  });

  it("inclui a situação ativa", async () => {
    await listarMembros({ ativo: true, page: 1 });

    expect(ultimaUrl()).toBe("/api/membros?ativo=true&page=1&pageSize=20");
  });

  it("omite do filtro a busca vazia", async () => {
    await listarMembros({ busca: "", ativo: undefined, page: 3 });

    expect(ultimaUrl()).toBe("/api/membros?page=3&pageSize=20");
  });

  it("codifica a busca com caracteres especiais", async () => {
    await listarMembros({ busca: "joão & maria", page: 1 });

    expect(ultimaUrl()).toBe("/api/membros?busca=jo%C3%A3o+%26+maria&page=1&pageSize=20");
  });

  it("busca o membro por id codificando o caminho", async () => {
    await buscarMembro("a/b");

    expect(ultimaUrl()).toBe("/api/membros/a%2Fb");
    expect(ultimoInit()?.method).toBeUndefined();
  });

  it("cria o membro com POST e o corpo em JSON", async () => {
    const dados = {
      nome: "Ana Souza",
      cpf: "52998224725",
      telefone: "48999990000",
      endereco: "Rua Fictícia, 100",
    };

    await criarMembro(dados);

    expect(ultimaUrl()).toBe("/api/membros");
    expect(ultimoInit()?.method).toBe("POST");
    expect(JSON.parse(String(ultimoInit()?.body))).toEqual(dados);
  });

  it("atualiza o membro com PATCH e sem cpf no corpo", async () => {
    const dados = { nome: "Ana Souza", telefone: "48999990000", endereco: "Rua Fictícia, 100" };

    await atualizarMembro("m1", dados);

    expect(ultimaUrl()).toBe("/api/membros/m1");
    expect(ultimoInit()?.method).toBe("PATCH");
    expect(JSON.parse(String(ultimoInit()?.body))).toEqual(dados);
  });
});
