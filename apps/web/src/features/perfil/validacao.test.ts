import { describe, expect, it } from "vitest";
import { MENSAGEM_TELEFONE } from "@/features/membros/validacao";
import {
  validarDadosDoAluno,
  validarDadosDoFuncionario,
  validarTrocaDeSenha,
} from "./validacao";

describe("validarDadosDoAluno", () => {
  it("aceita telefone com DDD e endereço de 5 a 200", () => {
    expect(validarDadosDoAluno("(48) 99999-0000", "Rua Nova, 10")).toEqual({});
  });

  it("recusa telefone curto e endereço curto", () => {
    expect(validarDadosDoAluno("999", " Rua ")).toEqual({
      telefone: MENSAGEM_TELEFONE,
      endereco: "endereco deve ter entre 5 e 200 caracteres",
    });
  });
});

describe("validarDadosDoFuncionario", () => {
  it.each([
    ["Ana", {}],
    ["  ab ", { nome: "nome deve ter entre 3 e 100 caracteres" }],
    ["a".repeat(101), { nome: "nome deve ter entre 3 e 100 caracteres" }],
  ])("nome %j", (nome, esperado) => {
    expect(validarDadosDoFuncionario(nome)).toEqual(esperado);
  });
});

describe("validarTrocaDeSenha", () => {
  it("aceita senha atual e nova confirmada", () => {
    expect(validarTrocaDeSenha("atual", "nova-senha", "nova-senha")).toEqual({});
  });

  it("aponta cada problema", () => {
    expect(validarTrocaDeSenha("", "curta", "outra")).toEqual({
      senhaAtual: "senhaAtual é obrigatória",
      novaSenha: "novaSenha deve ter no mínimo 8 caracteres",
      confirmacao: "As senhas não conferem",
    });
  });

  it("recusa nova senha com mais de 72 bytes", () => {
    const longa = "ç".repeat(37);
    expect(validarTrocaDeSenha("atual", longa, longa).novaSenha).toBe(
      "novaSenha deve ter no máximo 72 bytes",
    );
  });
});
