import { describe, expect, it } from "vitest";
import { isCpfValido, normalizarCpf } from "./cpf";
import {
  isCpfValido as isCpfValidoApi,
  normalizarCpf as normalizarCpfApi,
} from "../../../../api/src/common/validators/cpf";

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

// A cópia não pode se afastar da regra da API (RN01): este teste roda as duas
// com as mesmas entradas e falha se alguém mudar só uma delas.
describe("cpf.ts igual ao da API", () => {
  const entradas = [
    "52998224725",
    "529.982.247-25",
    " 529.982.247-25 ",
    "529 982 247 25",
    "529/982/247-25",
    "52998224724",
    "11111111111",
    "5299822472",
    "529982247250",
    "",
    "abc",
  ];

  it.each(entradas)("concorda com a API em %j", (cpf) => {
    expect(isCpfValido(cpf)).toBe(isCpfValidoApi(cpf));
    expect(normalizarCpf(cpf)).toBe(normalizarCpfApi(cpf));
  });

  it("concorda com a API em todos os dígitos verificadores de 50 bases", () => {
    let validos = 0;
    for (let i = 0; i < 50; i++) {
      const base = String(100_000_000 + i * 17_957_311).slice(0, 9);
      for (let dv = 0; dv < 100; dv++) {
        const cpf = base + String(dv).padStart(2, "0");
        expect(isCpfValido(cpf)).toBe(isCpfValidoApi(cpf));
        if (isCpfValido(cpf)) validos++;
      }
    }
    // Cada base tem exatamente um par de dígitos verificadores certo.
    expect(validos).toBe(50);
  });

  it("concorda com a API em valores que não são texto", () => {
    for (const valor of [undefined, null, 52998224725]) {
      expect(isCpfValido(valor)).toBe(isCpfValidoApi(valor));
    }
  });
});
