import { describe, expect, it } from "vitest";
import { MENSAGEM_TIPO_TREINO } from "./tipos";
import { DURACAO_MAXIMA, DURACAO_MINIMA, validarTreino } from "./validacao";

const HOJE = "2026-11-11";

const valido: Parameters<typeof validarTreino>[0] = {
  membroId: "m1",
  tipo: "Cardio",
  descricao: "Esteira e bicicleta",
  duracao: "45",
  dataInicio: HOJE,
};

function validar(extra: Partial<typeof valido> = {}) {
  return validarTreino({ ...valido, ...extra }, { hoje: HOJE });
}

describe("validarTreino", () => {
  it("aceita valores válidos", () => {
    expect(validar()).toEqual({});
  });

  it("exige o membro na criação", () => {
    expect(validar({ membroId: null }).membro).toBe("Selecione o membro");
  });

  it("não exige o membro na edição", () => {
    const erros = validarTreino(
      { ...valido, membroId: null },
      { hoje: HOJE, salvo: { dataInicio: HOJE } },
    );

    expect(erros.membro).toBeUndefined();
  });

  it("recusa tipo fora da RN05", () => {
    expect(validar({ tipo: "" }).tipo).toBe(MENSAGEM_TIPO_TREINO);
    expect(validar({ tipo: "Hipertrofia" }).tipo).toBe(MENSAGEM_TIPO_TREINO);
  });

  it("limita a descrição a 3..500 caracteres", () => {
    const mensagem = "descricao deve ter entre 3 e 500 caracteres";

    expect(validar({ descricao: "ab" }).descricao).toBe(mensagem);
    expect(validar({ descricao: "   a  " }).descricao).toBe(mensagem);
    expect(validar({ descricao: "abc" }).descricao).toBeUndefined();
    expect(validar({ descricao: "a".repeat(500) }).descricao).toBeUndefined();
    expect(validar({ descricao: "a".repeat(501) }).descricao).toBe(mensagem);
  });

  it("limita a duração a 1..300 minutos inteiros", () => {
    expect(DURACAO_MINIMA).toBe(1);
    expect(DURACAO_MAXIMA).toBe(300);
    expect(validar({ duracao: "0" }).duracao).toBe("duracao deve ser no mínimo 1 minuto");
    expect(validar({ duracao: "-5" }).duracao).toBe("duracao deve ser no mínimo 1 minuto");
    expect(validar({ duracao: "1" }).duracao).toBeUndefined();
    expect(validar({ duracao: "300" }).duracao).toBeUndefined();
    expect(validar({ duracao: "301" }).duracao).toBe("duracao deve ser no máximo 300 minutos");
  });

  it("recusa duração vazia ou fracionada", () => {
    const mensagem = "duracao deve ser um número inteiro de minutos";

    expect(validar({ duracao: "" }).duracao).toBe(mensagem);
    expect(validar({ duracao: "  " }).duracao).toBe(mensagem);
    expect(validar({ duracao: "1.5" }).duracao).toBe(mensagem);
    expect(validar({ duracao: "abc" }).duracao).toBe(mensagem);
  });

  it("recusa data de início vazia ou em formato errado", () => {
    const mensagem = "dataInicio deve ser uma data válida no formato AAAA-MM-DD";

    expect(validar({ dataInicio: "" }).dataInicio).toBe(mensagem);
    expect(validar({ dataInicio: "11/11/2026" }).dataInicio).toBe(mensagem);
  });

  it("RN05: a data de início não pode ser anterior a hoje", () => {
    expect(validar({ dataInicio: "2026-11-10" }).dataInicio).toBe(
      "dataInicio não pode ser anterior a hoje",
    );
    expect(validar({ dataInicio: HOJE }).dataInicio).toBeUndefined();
    expect(validar({ dataInicio: "2026-11-12" }).dataInicio).toBeUndefined();
  });

  it("na edição, reenviar a data já salva no passado passa, mas outra data passada não", () => {
    const contexto = { hoje: HOJE, salvo: { dataInicio: "2026-10-01" } };

    expect(
      validarTreino({ ...valido, dataInicio: "2026-10-01" }, contexto).dataInicio,
    ).toBeUndefined();
    expect(validarTreino({ ...valido, dataInicio: "2026-10-02" }, contexto).dataInicio).toBe(
      "dataInicio não pode ser anterior a hoje",
    );
  });

  it("sem o contexto usa o dia de hoje em São Paulo", () => {
    expect(validarTreino({ ...valido, dataInicio: "2000-01-01" }).dataInicio).toBe(
      "dataInicio não pode ser anterior a hoje",
    );
  });
});
