import { describe, expect, it } from "vitest";
import { validarMinhaAtividade } from "./validacao-atividade";

const HOJE = "2026-11-24";
const valido = { treinoId: "t1", atividade: "", data: HOJE, tempoExecucao: "45" };

describe("validarMinhaAtividade (RN19)", () => {
  it("aceita treino, data e tempo, com o texto em branco", () => {
    expect(validarMinhaAtividade(valido, HOJE)).toEqual({});
  });

  it("exige o treino", () => {
    expect(validarMinhaAtividade({ ...valido, treinoId: "" }, HOJE)).toEqual({
      treino: "Escolha um dos seus treinos",
    });
  });

  it.each([
    [{ atividade: "ab" }, "atividade", "atividade deve ter entre 3 e 120 caracteres"],
    [{ data: "2026-11-25" }, "data", "data não pode ser uma data futura"],
    [{ data: "" }, "data", "data deve ser uma data válida no formato AAAA-MM-DD"],
  ] as const)("recusa %o", (extra, campo, mensagem) => {
    expect(validarMinhaAtividade({ ...valido, ...extra }, HOJE)[campo]).toBe(mensagem);
  });

  it("recusa tempo fora de 1 a 600", () => {
    expect(validarMinhaAtividade({ ...valido, tempoExecucao: "0" }, HOJE).tempoExecucao).toBeTruthy();
  });

  it("usa hoje em São Paulo por padrão", () => {
    expect(validarMinhaAtividade({ ...valido, data: "2000-01-01" })).toEqual({});
  });
});
