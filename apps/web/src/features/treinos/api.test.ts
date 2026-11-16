import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Cargo, UsuarioDoToken } from "@/lib/sessao";
import {
  atualizarTreino,
  criarTreino,
  excluirTreino,
  listarTreinos,
  podeEditarTreino,
} from "./api";

const fetchMock = vi.fn<typeof fetch>();

function ultimaChamada() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, init };
}

function funcionario(cargo: Cargo): UsuarioDoToken {
  return { tipo: "FUNCIONARIO", cargo };
}

describe("api de treinos", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("lista só com page e pageSize quando não há filtro", async () => {
    await listarTreinos({ page: 1 });

    expect(ultimaChamada().url).toBe("/api/treinos?page=1&pageSize=20");
  });

  it("inclui os filtros de membro e tipo na ordem esperada", async () => {
    await listarTreinos({ membroId: "m1", tipo: "Cardio", page: 2 });

    expect(ultimaChamada().url).toBe("/api/treinos?membroId=m1&tipo=Cardio&page=2&pageSize=20");
  });

  it("codifica o tipo com acento na query", async () => {
    await listarTreinos({ tipo: "Musculação", page: 1 });

    expect(ultimaChamada().url).toBe("/api/treinos?tipo=Muscula%C3%A7%C3%A3o&page=1&pageSize=20");
  });

  it("omite do filtro os campos vazios", async () => {
    await listarTreinos({ membroId: "", tipo: undefined, page: 3 });

    expect(ultimaChamada().url).toBe("/api/treinos?page=3&pageSize=20");
  });

  it("cria com POST e o body em JSON", async () => {
    const dados = {
      membroId: "m1",
      tipo: "Funcional" as const,
      descricao: "Circuito de corpo inteiro",
      duracao: 45,
      dataInicio: "2026-11-20",
    };

    await criarTreino(dados);

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/treinos");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify(dados));
  });

  it("edita com PATCH no id codificado e o body em JSON", async () => {
    const dados = {
      tipo: "Cardio" as const,
      descricao: "Esteira e bicicleta",
      duracao: 30,
      dataInicio: "2026-11-20",
    };

    await atualizarTreino("id 1", dados);

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/treinos/id%201");
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify(dados));
  });

  it("exclui com DELETE, sem body, e aceita a resposta 204", async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));

    await expect(excluirTreino("id 1")).resolves.toBeUndefined();

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/treinos/id%201");
    expect(init?.method).toBe("DELETE");
    expect(init?.body).toBeUndefined();
  });

  it("propaga a mensagem da API quando a exclusão falha", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({ statusCode: 404, message: "Treino não encontrado" }, { status: 404 }),
    );

    await expect(excluirTreino("x")).rejects.toThrow("Treino não encontrado");
  });
});

describe("podeEditarTreino", () => {
  it("só ADMIN e INSTRUTOR criam, editam e excluem", () => {
    expect(podeEditarTreino(funcionario("ADMIN"))).toBe(true);
    expect(podeEditarTreino(funcionario("INSTRUTOR"))).toBe(true);
    expect(podeEditarTreino(funcionario("RECEPCIONISTA"))).toBe(false);
    expect(podeEditarTreino({ tipo: "ALUNO" })).toBe(false);
  });
});
