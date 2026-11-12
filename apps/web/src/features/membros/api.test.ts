import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  atualizarMembro,
  consultarResumo,
  criarMembro,
  desativarMembro,
  listarMembros,
  listarTreinosDoMembro,
  podeGerirMembros,
  reativarMembro,
} from "./api";

const fetchMock = vi.fn<typeof fetch>();

function ultimaChamada() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, init };
}

describe("api de membros", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("lista só com page e pageSize quando não há filtro", async () => {
    await listarMembros({ page: 1 });

    expect(ultimaChamada().url).toBe("/api/membros?page=1&pageSize=20");
  });

  it("inclui busca e ativo=false no filtro", async () => {
    await listarMembros({ busca: "ana", ativo: false, page: 2 });

    expect(ultimaChamada().url).toBe("/api/membros?busca=ana&ativo=false&page=2&pageSize=20");
  });

  it("codifica a busca e omite o que está vazio", async () => {
    await listarMembros({ busca: "ana & bia", ativo: undefined, page: 1 });

    expect(ultimaChamada().url).toBe("/api/membros?busca=ana+%26+bia&page=1&pageSize=20");
  });

  it("cria com POST e o body em JSON", async () => {
    const dados = {
      nome: "Ana Pereira",
      cpf: "52998224725",
      telefone: "48999991234",
      endereco: "Rua das Flores, 100",
    };

    await criarMembro(dados);

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/membros");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify(dados));
  });

  it("atualiza com PATCH e o id codificado", async () => {
    const dados = { nome: "Ana Paula", telefone: "48999991234", endereco: "Rua das Flores, 100" };

    await atualizarMembro("id 1", dados);

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/membros/id%201");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify(dados));
  });

  it("desativa e reativa pelas sub-rotas", async () => {
    await desativarMembro("abc");
    await reativarMembro("abc");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/membros/abc/desativar");
    expect(fetchMock.mock.calls[0][1]?.method).toBe("PATCH");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/membros/abc/reativar");
    expect(fetchMock.mock.calls[1][1]?.method).toBe("PATCH");
  });

  it("consulta o resumo do membro", async () => {
    await consultarResumo("abc");

    expect(ultimaChamada().url).toBe("/api/membros/abc/resumo");
  });

  it("lista os treinos do membro com a página", async () => {
    await listarTreinosDoMembro("abc", { page: 3 });

    expect(ultimaChamada().url).toBe("/api/membros/abc/treinos?page=3&pageSize=20");
  });
});

describe("podeGerirMembros", () => {
  it.each([
    [{ tipo: "FUNCIONARIO", cargo: "ADMIN" }, true],
    [{ tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" }, true],
    [{ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" }, false],
    [{ tipo: "ALUNO" }, false],
  ] as const)("%j → %s", (usuario, esperado) => {
    expect(podeGerirMembros(usuario)).toBe(esperado);
  });
});
