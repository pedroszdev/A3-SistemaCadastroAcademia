import { describe, expect, it } from "vitest";
import { ehTipoTreino, MENSAGEM_TIPO_TREINO, OPCOES_TIPO_TREINO, TIPOS_TREINO } from "./tipos";

describe("tipos de treino", () => {
  it("são os da RN05, na ordem da API", () => {
    expect(TIPOS_TREINO).toEqual([
      "Musculação",
      "Cardio",
      "Funcional",
      "Alongamento",
      "Crossfit",
      "Outro",
    ]);
  });

  it("a mensagem lista todos os tipos, igual à da API", () => {
    expect(MENSAGEM_TIPO_TREINO).toBe(
      "tipo deve ser um destes: Musculação, Cardio, Funcional, Alongamento, Crossfit, Outro",
    );
  });

  it("as opções do select usam o tipo como valor e como rótulo", () => {
    expect(OPCOES_TIPO_TREINO).toHaveLength(TIPOS_TREINO.length);
    expect(OPCOES_TIPO_TREINO[0]).toEqual({ valor: "Musculação", rotulo: "Musculação" });
  });

  it("ehTipoTreino aceita só o texto exato de um tipo da lista", () => {
    expect(ehTipoTreino("Cardio")).toBe(true);
    expect(ehTipoTreino("cardio")).toBe(false);
    expect(ehTipoTreino("")).toBe(false);
    expect(ehTipoTreino("Hipertrofia")).toBe(false);
  });
});
