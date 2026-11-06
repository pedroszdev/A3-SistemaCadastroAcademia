import { describe, expect, it } from "vitest";
import {
  apenasDigitos,
  formatarData,
  formatarMoeda,
  mascaraCpf,
  mascaraTelefone,
} from "./format";

describe("formatarMoeda", () => {
  it("formata em reais", () => {
    expect(formatarMoeda(1234.5)).toBe("R$ 1.234,50");
  });

  it("formata zero", () => {
    expect(formatarMoeda(0)).toBe("R$ 0,00");
  });
});

describe("formatarData", () => {
  it("formata a data ISO em UTC", () => {
    expect(formatarData("2026-11-05T00:00:00.000Z")).toBe("05/11/2026");
  });

  it("aceita Date", () => {
    expect(formatarData(new Date("2026-01-31T00:00:00.000Z"))).toBe(
      "31/01/2026",
    );
  });

  it("devolve vazio para data inválida", () => {
    expect(formatarData("não é data")).toBe("");
  });
});

describe("apenasDigitos", () => {
  it("remove o que não é dígito", () => {
    expect(apenasDigitos("a1.b2-3")).toBe("123");
  });
});

describe("mascaraCpf", () => {
  it.each([
    ["", ""],
    ["123", "123"],
    ["1234", "123.4"],
    ["1234567", "123.456.7"],
    ["1234567890", "123.456.789-0"],
    ["12345678909", "123.456.789-09"],
  ])("aplica a máscara progressiva em %s", (entrada, esperado) => {
    expect(mascaraCpf(entrada)).toBe(esperado);
  });

  it("ignora letras e pontuação e corta em 11 dígitos", () => {
    expect(mascaraCpf("123.abc456.789-09999")).toBe("123.456.789-09");
  });
});

describe("mascaraTelefone", () => {
  it.each([
    ["", ""],
    ["4", "(4"],
    ["48", "(48"],
    ["483", "(48) 3"],
    ["4833334444", "(48) 3333-4444"],
    ["48999991234", "(48) 99999-1234"],
  ])("aplica a máscara progressiva em %s", (entrada, esperado) => {
    expect(mascaraTelefone(entrada)).toBe(esperado);
  });

  it("ignora letras e corta em 11 dígitos", () => {
    expect(mascaraTelefone("(48) 99999-1234 x99")).toBe("(48) 99999-1234");
  });
});
