import { describe, expect, it } from "vitest";
import { FORMATO_DATA, validarMinutos } from "./validacao";

describe("FORMATO_DATA", () => {
  it("aceita só AAAA-MM-DD", () => {
    expect(FORMATO_DATA.test("2026-11-16")).toBe(true);
    expect(FORMATO_DATA.test("16/11/2026")).toBe(false);
    expect(FORMATO_DATA.test("")).toBe(false);
  });
});

describe("validarMinutos", () => {
  it("aceita inteiros dentro dos limites", () => {
    expect(validarMinutos("duracao", "1", 1, 300)).toBeUndefined();
    expect(validarMinutos("duracao", "300", 1, 300)).toBeUndefined();
  });

  it.each(["", "  ", "abc", "1.5"])("recusa %o por não ser inteiro", (texto) => {
    expect(validarMinutos("duracao", texto, 1, 300)).toBe(
      "duracao deve ser um número inteiro de minutos",
    );
  });

  it("usa o nome do campo e os limites nas mensagens", () => {
    expect(validarMinutos("tempoExecucao", "0", 1, 600)).toBe(
      "tempoExecucao deve ser no mínimo 1 minuto",
    );
    expect(validarMinutos("tempoExecucao", "601", 1, 600)).toBe(
      "tempoExecucao deve ser no máximo 600 minutos",
    );
    expect(validarMinutos("x", "4", 5, 10)).toBe("x deve ser no mínimo 5 minutos");
  });
});
