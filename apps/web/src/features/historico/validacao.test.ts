import { describe, expect, it } from "vitest";
import { hojeEmSaoPaulo, validarAtividade } from "./validacao";

const HOJE = "2026-11-10";

const valido: Parameters<typeof validarAtividade>[0] = {
  membroId: "m1",
  atividade: "Esteira",
  data: HOJE,
  tempoExecucao: "30",
};

function validar(extra: Partial<typeof valido> = {}) {
  return validarAtividade({ ...valido, ...extra }, HOJE);
}

describe("hojeEmSaoPaulo", () => {
  it("usa o dia de São Paulo, não o de UTC", () => {
    expect(hojeEmSaoPaulo(new Date("2026-11-10T02:30:00Z"))).toBe("2026-11-09");
    expect(hojeEmSaoPaulo(new Date("2026-11-10T12:00:00Z"))).toBe("2026-11-10");
  });
});

describe("validarAtividade", () => {
  it("aceita valores válidos", () => {
    expect(validar()).toEqual({});
  });

  it("exige o membro", () => {
    expect(validar({ membroId: null }).membro).toBe("Selecione o membro");
  });

  it("limita a atividade a 3..120 caracteres", () => {
    const mensagem = "atividade deve ter entre 3 e 120 caracteres";

    expect(validar({ atividade: "ab" }).atividade).toBe(mensagem);
    expect(validar({ atividade: "abc" }).atividade).toBeUndefined();
    expect(validar({ atividade: "a".repeat(120) }).atividade).toBeUndefined();
    expect(validar({ atividade: "a".repeat(121) }).atividade).toBe(mensagem);
  });

  it("apara os espaços antes de contar a atividade", () => {
    expect(validar({ atividade: "  ab  " }).atividade).toBe(
      "atividade deve ter entre 3 e 120 caracteres",
    );
  });

  it("conta um emoji como 1 caractere", () => {
    expect(validar({ atividade: "💪💪" }).atividade).toBeDefined();
    expect(validar({ atividade: "💪💪💪" }).atividade).toBeUndefined();
  });

  it("aceita a data de hoje e recusa a de amanhã", () => {
    expect(validar({ data: HOJE }).data).toBeUndefined();
    expect(validar({ data: "2026-11-11" }).data).toBe("data não pode ser uma data futura");
  });

  it("recusa data vazia ou fora do formato", () => {
    const mensagem = "data deve ser uma data válida no formato AAAA-MM-DD";

    expect(validar({ data: "" }).data).toBe(mensagem);
    expect(validar({ data: "10/11/2026" }).data).toBe(mensagem);
  });

  it("recusa tempo vazio ou não inteiro", () => {
    const mensagem = "tempoExecucao deve ser um número inteiro de minutos";

    expect(validar({ tempoExecucao: "" }).tempoExecucao).toBe(mensagem);
    expect(validar({ tempoExecucao: "30.5" }).tempoExecucao).toBe(mensagem);
    expect(validar({ tempoExecucao: "abc" }).tempoExecucao).toBe(mensagem);
  });

  it("limita o tempo a 1..600 minutos", () => {
    expect(validar({ tempoExecucao: "0" }).tempoExecucao).toBe(
      "tempoExecucao deve ser no mínimo 1 minuto",
    );
    expect(validar({ tempoExecucao: "1" }).tempoExecucao).toBeUndefined();
    expect(validar({ tempoExecucao: "600" }).tempoExecucao).toBeUndefined();
    expect(validar({ tempoExecucao: "601" }).tempoExecucao).toBe(
      "tempoExecucao deve ser no máximo 600 minutos",
    );
  });

  it("junta os erros de todos os campos", () => {
    const erros = validarAtividade(
      { membroId: null, atividade: "", data: "", tempoExecucao: "" },
      HOJE,
    );

    expect(Object.keys(erros).sort()).toEqual(["atividade", "data", "membro", "tempoExecucao"]);
  });
});
