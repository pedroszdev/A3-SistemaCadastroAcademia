import { describe, expect, it } from "vitest";
import { MENSAGEM_TELEFONE, validarMembro } from "./validacao";

const valido = {
  nome: "Ana Souza",
  cpf: "529.982.247-25",
  telefone: "(48) 99999-0000",
  endereco: "Rua Fictícia, 100",
  valorMensalidade: "R$ 120,00",
  diaVencimento: "10",
};

describe("validarMembro", () => {
  it("aceita valores válidos nos dois modos", () => {
    expect(validarMembro(valido, "criar")).toEqual({});
    expect(validarMembro(valido, "editar")).toEqual({});
  });

  it("devolve a mensagem de cada campo inválido", () => {
    const erros = validarMembro(
      {
        nome: "",
        cpf: "",
        telefone: "",
        endereco: "",
        valorMensalidade: "",
        diaVencimento: "",
      },
      "criar",
    );

    expect(erros).toEqual({
      nome: "nome deve ter entre 3 e 120 caracteres",
      cpf: "cpf deve ser um CPF válido",
      telefone: "telefone deve ter 10 ou 11 dígitos, com o DDD",
      endereco: "endereco deve ter entre 5 e 200 caracteres",
      valorMensalidade: "valorMensalidade deve ser no mínimo 0,01",
    });
    expect(erros.telefone).toBe(MENSAGEM_TELEFONE);
  });

  it.each([
    ["Al", true],
    ["Ana", false],
    ["a".repeat(120), false],
    ["a".repeat(121), true],
    ["   ", true],
    ["  Al  ", true],
  ])("nome %j (erro: %s)", (nome, comErro) => {
    const erros = validarMembro({ ...valido, nome }, "criar");

    expect(erros.nome === "nome deve ter entre 3 e 120 caracteres").toBe(comErro);
  });

  it.each([
    ["Rua", true],
    ["Rua ", true],
    ["Rua A", false],
    ["a".repeat(200), false],
    ["a".repeat(201), true],
    ["      ", true],
  ])("endereço %j (erro: %s)", (endereco, comErro) => {
    const erros = validarMembro({ ...valido, endereco }, "criar");

    expect(erros.endereco === "endereco deve ter entre 5 e 200 caracteres").toBe(comErro);
  });

  it.each([
    ["4899990000", false],
    ["48999990000", false],
    ["(48) 9999-0000", false],
    ["(48) 99999-0000", false],
    ["489999000", true],
    ["489999900001", true],
    ["", true],
    ["abc", true],
  ])("telefone %j (erro: %s)", (telefone, comErro) => {
    const erros = validarMembro({ ...valido, telefone }, "criar");

    expect(erros.telefone === MENSAGEM_TELEFONE).toBe(comErro);
  });

  it("recusa CPF inválido na criação", () => {
    expect(validarMembro({ ...valido, cpf: "52998224724" }, "criar").cpf).toBe(
      "cpf deve ser um CPF válido",
    );
  });

  it("não valida o CPF na edição, porque ele não muda", () => {
    expect(validarMembro({ ...valido, cpf: "" }, "editar")).toEqual({});
  });

  describe("mensalidade (RN18)", () => {
    it("na edição, o valor em branco não é erro", () => {
      expect(validarMembro({ ...valido, valorMensalidade: "" }, "editar")).toEqual({});
    });

    it("recusa valor acima de 10.000", () => {
      expect(
        validarMembro({ ...valido, valorMensalidade: "R$ 10.000,01" }, "criar").valorMensalidade,
      ).toBe("valorMensalidade deve ser no máximo 10.000");
    });

    it.each([
      ["", false],
      ["1", false],
      ["31", false],
      ["0", true],
      ["32", true],
      ["5.5", true],
    ])("dia %j (erro: %s)", (diaVencimento, comErro) => {
      const erros = validarMembro({ ...valido, diaVencimento }, "criar");

      expect(erros.diaVencimento === "diaVencimento deve ser entre 1 e 31").toBe(comErro);
    });
  });
});
