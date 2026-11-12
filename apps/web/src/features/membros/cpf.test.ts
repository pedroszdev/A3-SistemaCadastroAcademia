import { describe, expect, it } from "vitest";
import { isCpfValido, normalizarCpf } from "./cpf";

describe("normalizarCpf", () => {
  it("tira a máscara e os espaços das pontas", () => {
    expect(normalizarCpf(" 529.982.247-25 ")).toBe("52998224725");
  });

  it("mantém o que já vem só com números", () => {
    expect(normalizarCpf("52998224725")).toBe("52998224725");
  });
});

describe("isCpfValido", () => {
  it.each(["529.982.247-25", "52998224725", "  529.982.247-25 "])("aceita %j", (cpf) => {
    expect(isCpfValido(cpf)).toBe(true);
  });

  it.each([
    ["dígito verificador errado", "529.982.247-26"],
    ["segundo dígito errado", "529.982.247-24"],
    ["sequência repetida", "111.111.111-11"],
    ["poucos dígitos", "5299822472"],
    ["dígitos demais", "529982247255"],
    ["letras", "529.982.247-2a"],
    ["vazio", ""],
  ])("recusa %s", (_descricao, cpf) => {
    expect(isCpfValido(cpf)).toBe(false);
  });

  it("recusa o que não é texto", () => {
    expect(isCpfValido(52998224725)).toBe(false);
    expect(isCpfValido(undefined)).toBe(false);
    expect(isCpfValido(null)).toBe(false);
  });
});
