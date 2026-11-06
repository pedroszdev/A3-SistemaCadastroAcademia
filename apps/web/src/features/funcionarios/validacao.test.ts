import { describe, expect, it } from "vitest";
import { validarFuncionario } from "./validacao";

const valido = { nome: "Ana Souza", login: "ana01", cargo: "ADMIN", senha: "senha1234" };

describe("validarFuncionario", () => {
  it("aceita valores válidos nos dois modos", () => {
    expect(validarFuncionario(valido, "criar")).toEqual({});
    expect(validarFuncionario(valido, "editar")).toEqual({});
  });

  it.each([
    ["Al", true],
    ["Ana", false],
    ["a".repeat(100), false],
    ["a".repeat(101), true],
    ["  Al  ", true],
    // 99 letras + 1 emoji = 100 caracteres para a API, embora sejam 101 unidades UTF-16
    ["a".repeat(99) + "💪", false],
    // o seletor de variação (o ️ de "❤️") não conta para a API: são 2 caracteres
    ["❤️❤️", true],
    ["❤️❤️❤️", false],
  ])("nome %j (erro: %s)", (nome, comErro) => {
    const erros = validarFuncionario({ ...valido, nome }, "criar");

    expect(erros.nome === "nome deve ter entre 3 e 100 caracteres").toBe(comErro);
  });

  it("exige o cargo e recusa valor fora da lista", () => {
    expect(validarFuncionario({ ...valido, cargo: "" }, "criar").cargo).toBe("Selecione o cargo");
    expect(validarFuncionario({ ...valido, cargo: "X" }, "criar").cargo).toBe(
      "cargo deve ser ADMIN, RECEPCIONISTA ou INSTRUTOR",
    );
  });

  it.each([
    ["ab", "login deve ter entre 3 e 30 caracteres"],
    ["a".repeat(31), "login deve ter entre 3 e 30 caracteres"],
    ["ana.01", "login deve ter apenas letras e números"],
    // 16 emojis são 32 unidades UTF-16, mas 16 caracteres para a API
    ["😀".repeat(16), "login deve ter apenas letras e números"],
  ])("login %j recusado", (login, mensagem) => {
    expect(validarFuncionario({ ...valido, login }, "criar").login).toBe(mensagem);
  });

  it("ignora o login na edição", () => {
    expect(validarFuncionario({ ...valido, login: "a.b" }, "editar").login).toBeUndefined();
  });

  it("recusa senha com 7 caracteres e aceita com 8", () => {
    expect(validarFuncionario({ ...valido, senha: "1234567" }, "criar").senha).toBe(
      "senha deve ter no mínimo 8 caracteres",
    );
    expect(validarFuncionario({ ...valido, senha: "12345678" }, "criar").senha).toBeUndefined();
  });

  it("conta o mínimo da senha como a API: um emoji vale 1 caractere", () => {
    // 4 emojis são 8 unidades UTF-16, mas o MinLength(8) da API conta 4
    expect(validarFuncionario({ ...valido, senha: "😀😀😀😀" }, "criar").senha).toBe(
      "senha deve ter no mínimo 8 caracteres",
    );
    expect(validarFuncionario({ ...valido, senha: "😀".repeat(8) }, "criar").senha).toBeUndefined();
  });

  it("limita a senha a 72 bytes, não a 72 caracteres", () => {
    expect(validarFuncionario({ ...valido, senha: "ç".repeat(40) }, "criar").senha).toBe(
      "senha deve ter no máximo 72 bytes",
    );
    expect(validarFuncionario({ ...valido, senha: "a".repeat(72) }, "criar").senha).toBeUndefined();
  });

  it("senha vazia: recusada ao criar e aceita ao editar", () => {
    expect(validarFuncionario({ ...valido, senha: "" }, "criar").senha).toBeDefined();
    expect(validarFuncionario({ ...valido, senha: "" }, "editar").senha).toBeUndefined();
  });

  it("valida a senha na edição quando preenchida", () => {
    expect(validarFuncionario({ ...valido, senha: "123" }, "editar").senha).toBeDefined();
  });
});
