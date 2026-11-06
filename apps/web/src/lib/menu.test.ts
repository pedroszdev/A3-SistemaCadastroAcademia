import { describe, expect, it } from "vitest";
import { itensDoMenu } from "./menu";
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
