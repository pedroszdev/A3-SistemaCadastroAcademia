import { describe, expect, it } from "vitest";
import { validarPagamento } from "./validacao";

const valido = { membroId: "m1", valor: 150.5, dataVencimento: "2026-11-20" };

describe("validarPagamento", () => {
  it("aceita valores válidos", () => {
    expect(validarPagamento(valido)).toEqual({});
  });

  it("exige o membro", () => {
    expect(validarPagamento({ ...valido, membroId: null }).membro).toBe("Selecione o membro");
  });

  it("recusa valor abaixo do mínimo", () => {
    const mensagem = "valor deve ser no mínimo 0,01";

    expect(validarPagamento({ ...valido, valor: 0 }).valor).toBe(mensagem);
    expect(validarPagamento({ ...valido, valor: 0.009 }).valor).toBe(mensagem);
  });

  it("recusa valor acima do máximo", () => {
    expect(validarPagamento({ ...valido, valor: 10000.01 }).valor).toBe(
      "valor deve ser no máximo 10.000",
    );
  });

  it("aceita os limites 0,01 e 10.000", () => {
    expect(validarPagamento({ ...valido, valor: 0.01 })).toEqual({});
    expect(validarPagamento({ ...valido, valor: 10000 })).toEqual({});
  });

  it.each(["", "20/11/2026", "2026-11-2"])("exige o vencimento no formato AAAA-MM-DD (%j)", (dataVencimento) => {
    expect(validarPagamento({ ...valido, dataVencimento }).dataVencimento).toBe("Informe o vencimento");
  });

  it("junta todos os erros de uma vez", () => {
    expect(validarPagamento({ membroId: null, valor: 0, dataVencimento: "" })).toEqual({
      membro: "Selecione o membro",
      valor: "valor deve ser no mínimo 0,01",
      dataVencimento: "Informe o vencimento",
    });
  });
});
