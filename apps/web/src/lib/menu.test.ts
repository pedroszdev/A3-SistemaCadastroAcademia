import { describe, expect, it } from "vitest";
import { ITENS_MENU_ALUNO, estaAtivo, itensDoMenu } from "./menu";
import type { Cargo } from "./sessao";

const ESPERADO: [Cargo, string[]][] = [
  [
    "ADMIN",
    ["Dashboard", "Membros", "Treinos", "Pagamentos", "Histórico", "Funcionários"],
  ],
  [
    "RECEPCIONISTA",
    ["Dashboard", "Membros", "Treinos", "Pagamentos", "Histórico"],
  ],
  ["INSTRUTOR", ["Dashboard", "Membros", "Treinos", "Histórico"]],
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
  it("lista treinos e histórico do portal", () => {
    expect(ITENS_MENU_ALUNO).toEqual([
      { rotulo: "Meus treinos", href: "/aluno/treinos" },
      { rotulo: "Meu histórico", href: "/aluno/historico" },
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
