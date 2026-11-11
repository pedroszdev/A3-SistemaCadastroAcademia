import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Cargo, UsuarioDoToken } from "@/lib/sessao";
import {
  consultarSituacao,
  listarAtividades,
  listarAtividadesDoMembro,
  listarFuncionariosParaFiltro,
  listarTreinosDoMembro,
  podeConsultarSituacao,
  podeFiltrarPorFuncionario,
  podeRegistrarAtividade,
  registrarAtividade,
} from "./api";

const fetchMock = vi.fn<typeof fetch>();

function ultimaChamada() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, init };
}

function funcionario(cargo: Cargo): UsuarioDoToken {
  return { tipo: "FUNCIONARIO", cargo };
}

const aluno: UsuarioDoToken = { tipo: "ALUNO" };

describe("api do histórico", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("lista só com page e pageSize quando não há filtro", async () => {
    await listarAtividades({ page: 1 });

    expect(ultimaChamada().url).toBe("/api/atividades?page=1&pageSize=20");
  });

  it("inclui todos os filtros na ordem esperada", async () => {
    await listarAtividades({
      membroId: "m1",
      funcionarioId: "f1",
      dataDe: "2026-11-01",
      dataAte: "2026-11-30",
      page: 2,
    });

    expect(ultimaChamada().url).toBe(
      "/api/atividades?membroId=m1&funcionarioId=f1&dataDe=2026-11-01&dataAte=2026-11-30&page=2&pageSize=20",
    );
  });

  it("omite do filtro os campos vazios", async () => {
    await listarAtividades({ membroId: undefined, dataDe: "", page: 3 });

    expect(ultimaChamada().url).toBe("/api/atividades?page=3&pageSize=20");
  });

  it("lista pela rota do membro com os outros filtros e sem membroId na query", async () => {
    const filtro = { membroId: "outro", funcionarioId: "f1", dataDe: "2026-11-01", page: 2 };

    await listarAtividadesDoMembro("m 1", filtro);

    expect(ultimaChamada().url).toBe(
      "/api/membros/m%201/atividades?funcionarioId=f1&dataDe=2026-11-01&page=2&pageSize=20",
    );
  });

  it("registra com POST e o body em JSON, com o treino quando há", async () => {
    const dados = {
      membroId: "m1",
      treinoId: "t1",
      atividade: "Esteira",
      data: "2026-11-09",
      tempoExecucao: 30,
    };

    await registrarAtividade(dados);

    const { url, init } = ultimaChamada();
    expect(url).toBe("/api/atividades");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(dados);
  });

  it("não manda treinoId quando está vazio ou ausente", async () => {
    const base = { membroId: "m1", atividade: "Esteira", data: "2026-11-09", tempoExecucao: 30 };

    await registrarAtividade({ ...base, treinoId: "" });
    await registrarAtividade({ ...base, treinoId: undefined });

    for (const [, init] of fetchMock.mock.calls) {
      expect(JSON.parse(String(init?.body))).toEqual(base);
    }
  });

  it("lista os treinos do membro e devolve só o data", async () => {
    const treinos = [{ id: "t1", tipo: "Hipertrofia", dataInicio: "2026-10-01T00:00:00.000Z" }];
    fetchMock.mockImplementation(async () =>
      Response.json({ data: treinos, total: 1, page: 1, pageSize: 100 }),
    );

    const resultado = await listarTreinosDoMembro("id 1");

    expect(ultimaChamada().url).toBe("/api/membros/id%201/treinos?page=1&pageSize=100");
    expect(resultado).toEqual(treinos);
  });

  it("consulta a situação financeira do membro", async () => {
    const situacao = { situacao: "INADIMPLENTE", pagamentosAtrasados: 2, maiorAtrasoDias: 12 };
    fetchMock.mockImplementation(async () => Response.json(situacao));

    const resultado = await consultarSituacao("id 1");

    expect(ultimaChamada().url).toBe("/api/membros/id%201/situacao");
    expect(resultado).toEqual(situacao);
  });

  it("lista até 100 funcionários e devolve id e nome", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({
        data: [{ id: "f1", nome: "Ana Souza", login: "ana", cargo: "INSTRUTOR", ativo: true }],
        total: 1,
        page: 1,
        pageSize: 100,
      }),
    );

    const resultado = await listarFuncionariosParaFiltro();

    expect(ultimaChamada().url).toBe("/api/funcionarios?page=1&pageSize=100");
    expect(resultado).toEqual([{ id: "f1", nome: "Ana Souza" }]);
  });
});

describe("permissões do histórico", () => {
  it("só ADMIN e INSTRUTOR registram atividade", () => {
    expect(podeRegistrarAtividade(funcionario("ADMIN"))).toBe(true);
    expect(podeRegistrarAtividade(funcionario("INSTRUTOR"))).toBe(true);
    expect(podeRegistrarAtividade(funcionario("RECEPCIONISTA"))).toBe(false);
    expect(podeRegistrarAtividade(aluno)).toBe(false);
  });

  it("só o ADMIN filtra por funcionário", () => {
    expect(podeFiltrarPorFuncionario(funcionario("ADMIN"))).toBe(true);
    expect(podeFiltrarPorFuncionario(funcionario("RECEPCIONISTA"))).toBe(false);
    expect(podeFiltrarPorFuncionario(funcionario("INSTRUTOR"))).toBe(false);
    expect(podeFiltrarPorFuncionario(aluno)).toBe(false);
  });

  it("só ADMIN e RECEPCIONISTA consultam a situação financeira", () => {
    expect(podeConsultarSituacao(funcionario("ADMIN"))).toBe(true);
    expect(podeConsultarSituacao(funcionario("RECEPCIONISTA"))).toBe(true);
    expect(podeConsultarSituacao(funcionario("INSTRUTOR"))).toBe(false);
    expect(podeConsultarSituacao(aluno)).toBe(false);
  });
});
