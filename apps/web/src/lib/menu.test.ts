import { describe, expect, it } from "vitest";
import { ITENS_MENU_ALUNO, estaAtivo, itensDoMenu, temAcessoFinanceiro } from "./menu";
import type { Cargo, UsuarioDoToken } from "./sessao";

const ESPERADO: [Cargo, string[]][] = [
  [
    "ADMIN",
    ["Dashboard", "Membros", "Treinos", "Pagamentos", "Histórico", "Funcionários", "Meus dados"],
  ],
  [
    "RECEPCIONISTA",
    ["Dashboard", "Membros", "Treinos", "Pagamentos", "Histórico", "Meus dados"],
  ],
  ["INSTRUTOR", ["Dashboard", "Membros", "Treinos", "Histórico", "Meus dados"]],
];

describe("itensDoMenu", () => {
  it.each(ESPERADO)("mostra os itens do cargo %s", (cargo, rotulos) => {
    expect(itensDoMenu(cargo).map((item) => item.rotulo)).toEqual(rotulos);
  });

  it("devolve lista vazia sem cargo", () => {
    expect(itensDoMenu(null)).toEqual([]);
  });
});

describe("ITENS_MENU_ALUNO", () => {
  it("lista treinos, histórico, pagamentos e dados do portal", () => {
    expect(ITENS_MENU_ALUNO).toEqual([
      { rotulo: "Meus treinos", href: "/aluno/treinos" },
      { rotulo: "Meu histórico", href: "/aluno/historico" },
      { rotulo: "Pagamentos", href: "/aluno/pagamentos" },
      { rotulo: "Meus dados", href: "/aluno/dados" },
    ]);
  });
});

describe("estaAtivo", () => {
  it.each([
    ["/aluno/treinos", true],
    ["/aluno/treinos/42", true],
    ["/aluno/treinosx", false],
    ["/aluno", false],
  ])("em %s dá %s", (pathname, esperado) => {
    expect(estaAtivo(pathname, "/aluno/treinos")).toBe(esperado);
  });
});

describe("temAcessoFinanceiro", () => {
  it.each<[UsuarioDoToken, boolean]>([
    [{ tipo: "FUNCIONARIO", cargo: "ADMIN" }, true],
    [{ tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" }, true],
    [{ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" }, false],
    [{ tipo: "ALUNO" }, false],
  ])("temAcessoFinanceiro(%o) é %s", (usuario, esperado) => {
    expect(temAcessoFinanceiro(usuario)).toBe(esperado);
  });
});
