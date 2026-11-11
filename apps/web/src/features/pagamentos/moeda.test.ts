import { describe, expect, it } from "vitest";
import { mascaraMoeda, mascaraMoedaColada, valorDaMascara } from "./moeda";

describe("mascaraMoeda", () => {
  it("devolve vazio quando não há dígitos", () => {
    expect(mascaraMoeda("")).toBe("");
    expect(mascaraMoeda("abc")).toBe("");
  });

  it("preenche a partir dos centavos", () => {
    expect(mascaraMoeda("5")).toMatch(/^R\$\s0,05$/);
    expect(mascaraMoeda("15050")).toMatch(/^R\$\s150,50$/);
  });

  it("desloca os dígitos quando se digita sobre um valor já mascarado", () => {
    expect(mascaraMoeda("R$ 1.500,001")).toMatch(/^R\$\s15\.000,01$/);
  });

  it("descarta os zeros à esquerda", () => {
    expect(mascaraMoeda("0005")).toMatch(/^R\$\s0,05$/);
    expect(mascaraMoeda("000")).toBe("");
  });

  it("limita a 7 dígitos", () => {
    expect(mascaraMoeda("123456789")).toMatch(/^R\$\s12\.345,67$/);
  });
});

describe("valorDaMascara", () => {
  it("converte o texto mascarado em número", () => {
    expect(valorDaMascara("R$ 150,50")).toBe(150.5);
    expect(valorDaMascara("R$ 1.500,00")).toBe(1500);
  });

  it("devolve 0 quando vazio", () => {
    expect(valorDaMascara("")).toBe(0);
  });
});

describe("mascaraMoedaColada", () => {
  it.each([
    ["150", /^R\$\s150,00$/],
    ["1.234,5", /^R\$\s1\.234,50$/],
    ["R$ 1.234,56", /^R\$\s1\.234,56$/],
    ["150.5", /^R\$\s150,50$/],
    ["1.234", /^R\$\s1\.234,00$/],
    ["0,05", /^R\$\s0,05$/],
  ])("lê %j com as casas decimais escritas", (colado, esperado) => {
    expect(mascaraMoedaColada(colado)).toMatch(esperado);
  });

  it("devolve vazio quando não há valor", () => {
    expect(mascaraMoedaColada("abc")).toBe("");
    expect(mascaraMoedaColada("0,00")).toBe("");
  });
});
