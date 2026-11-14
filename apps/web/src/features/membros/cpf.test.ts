import { describe, expect, it } from "vitest";
import { isCpfValido, normalizarCpf } from "./cpf";

describe("isCpfValido", () => {
  it.each(["52998224725", "529.982.247-25", " 529.982.247-25 ", "11144477735"])(
    "aceita o CPF válido %j",
    (cpf) => {
      expect(isCpfValido(cpf)).toBe(true);
    },
  );

  it.each([
    ["primeiro dígito verificador errado", "52998224735"],
    ["segundo dígito verificador errado", "52998224724"],
    ["sequência repetida", "11111111111"],
    ["sequência repetida com máscara", "000.000.000-00"],
    ["10 dígitos", "5299822472"],
    ["12 dígitos", "529982247250"],
    ["com letras", "5299822472a"],
    ["com espaço no meio", "529.982.247 25"],
    ["vazio", ""],
  ])("recusa CPF com %s", (_, cpf) => {
    expect(isCpfValido(cpf)).toBe(false);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["número", 52998224725],
    ["objeto", {}],
  ])("recusa valor que não é texto (%s)", (_, valor) => {
    expect(isCpfValido(valor)).toBe(false);
  });
});

describe("normalizarCpf", () => {
  it("apara os espaços e tira pontos e hífen", () => {
    expect(normalizarCpf(" 529.982.247-25 ")).toBe("52998224725");
  });

  it("mantém o que não é ponto nem hífen", () => {
    expect(normalizarCpf("529.982.247 25")).toBe("529982247 25");
  });
});
