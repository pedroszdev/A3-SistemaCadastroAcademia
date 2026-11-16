import { describe, expect, it } from "vitest";
import { MENSAGEM_TELEFONE, validarMembro } from "./validacao";

const valido = {
  nome: "Ana Souza",
  cpf: "529.982.247-25",
  telefone: "(48) 99999-0000",
  endereco: "Rua Fictícia, 100",
};

describe("validarMembro", () => {
  it("aceita valores válidos nos dois modos", () => {
    expect(validarMembro(valido, "criar")).toEqual({});
    expect(validarMembro(valido, "editar")).toEqual({});
  });

  it("devolve a mensagem de cada campo inválido", () => {
    const erros = validarMembro({ nome: "", cpf: "", telefone: "", endereco: "" }, "criar");

    expect(erros).toEqual({
      nome: "nome deve ter entre 3 e 120 caracteres",
      cpf: "cpf deve ser um CPF válido",
      telefone: "telefone deve ter 10 ou 11 dígitos, com o DDD",
      endereco: "endereco deve ter entre 5 e 200 caracteres",
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
});
