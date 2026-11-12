import { describe, expect, it } from "vitest";
import { validarMembro } from "./validacao";

const valido = {
  nome: "Ana Pereira",
  cpf: "529.982.247-25",
  telefone: "(48) 99999-1234",
  endereco: "Rua das Flores, 100",
};

describe("validarMembro", () => {
  it("aceita valores válidos nos dois modos", () => {
    expect(validarMembro(valido, "criar")).toEqual({});
    expect(validarMembro(valido, "editar")).toEqual({});
  });

  it("aceita telefone fixo com 10 dígitos", () => {
    expect(validarMembro({ ...valido, telefone: "(48) 3333-4444" }, "criar")).toEqual({});
  });

  it.each([
    ["Al", true],
    ["Ana", false],
    ["a".repeat(120), false],
    ["a".repeat(121), true],
    ["  Al  ", true],
  ])("nome %j (erro: %s)", (nome, comErro) => {
    expect("nome" in validarMembro({ ...valido, nome }, "criar")).toBe(comErro);
  });

  it.each([
    ["Rua", true],
    ["Rua A", false],
    ["b".repeat(200), false],
    ["b".repeat(201), true],
  ])("endereço %j (erro: %s)", (endereco, comErro) => {
    expect("endereco" in validarMembro({ ...valido, endereco }, "criar")).toBe(comErro);
  });

  it.each([
    ["999991234", true],
    ["(48) 99999-1234", false],
    ["489999912345", true],
    ["", true],
  ])("telefone %j (erro: %s)", (telefone, comErro) => {
    expect("telefone" in validarMembro({ ...valido, telefone }, "criar")).toBe(comErro);
  });

  it("recusa CPF inválido ou vazio ao criar", () => {
    expect(validarMembro({ ...valido, cpf: "529.982.247-26" }, "criar").cpf).toBe("CPF inválido");
    expect(validarMembro({ ...valido, cpf: "" }, "criar").cpf).toBe("CPF inválido");
  });

  it("não valida o CPF ao editar (RN02)", () => {
    expect(validarMembro({ ...valido, cpf: "" }, "editar")).toEqual({});
  });

  it("junta todos os erros de uma vez", () => {
    expect(validarMembro({ nome: "", cpf: "", telefone: "", endereco: "" }, "criar")).toEqual({
      nome: "nome deve ter entre 3 e 120 caracteres",
      cpf: "CPF inválido",
      telefone: "telefone deve ter 10 ou 11 dígitos, com o DDD",
      endereco: "endereco deve ter entre 5 e 200 caracteres",
    });
  });
});
