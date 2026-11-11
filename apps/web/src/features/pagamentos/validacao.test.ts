import { describe, expect, it } from "vitest";
import { validarPagamento, vencimentoMinimo } from "./validacao";

const valido = { membroId: "m1", valor: 150.5, dataVencimento: "2026-11-20" };
// 23h de 11/11 em São Paulo já é 12/11 em UTC: o "hoje" tem de ser o da academia.
const agora = new Date("2026-11-12T02:00:00.000Z");

describe("validarPagamento", () => {
  it("aceita valores válidos", () => {
    expect(validarPagamento(valido, agora)).toEqual({});
  });

  it("exige o membro", () => {
    expect(validarPagamento({ ...valido, membroId: null }, agora).membro).toBe("Selecione o membro");
  });

  it("recusa valor abaixo do mínimo", () => {
    const mensagem = "valor deve ser no mínimo 0,01";

    expect(validarPagamento({ ...valido, valor: 0 }, agora).valor).toBe(mensagem);
    expect(validarPagamento({ ...valido, valor: 0.009 }, agora).valor).toBe(mensagem);
  });

  it("recusa valor acima do máximo", () => {
    expect(validarPagamento({ ...valido, valor: 10000.01 }, agora).valor).toBe(
      "valor deve ser no máximo 10.000",
    );
  });

  it("aceita os limites 0,01 e 10.000", () => {
    expect(validarPagamento({ ...valido, valor: 0.01 }, agora)).toEqual({});
    expect(validarPagamento({ ...valido, valor: 10000 }, agora)).toEqual({});
  });

  it.each(["", "20/11/2026", "2026-11-2"])("exige o vencimento no formato AAAA-MM-DD (%j)", (dataVencimento) => {
    expect(validarPagamento({ ...valido, dataVencimento }, agora).dataVencimento).toBe("Informe o vencimento");
  });

  it("junta todos os erros de uma vez", () => {
    expect(validarPagamento({ membroId: null, valor: 0, dataVencimento: "" }, agora)).toEqual({
      membro: "Selecione o membro",
      valor: "valor deve ser no mínimo 0,01",
      dataVencimento: "Informe o vencimento",
    });
  });

  it("aceita vencimento até 90 dias no passado e no futuro", () => {
    expect(validarPagamento({ ...valido, dataVencimento: "2026-08-13" }, agora)).toEqual({});
    expect(validarPagamento({ ...valido, dataVencimento: "2027-05-01" }, agora)).toEqual({});
  });

  it("recusa vencimento com mais de 90 dias no passado", () => {
    expect(validarPagamento({ ...valido, dataVencimento: "2026-08-12" }, agora).dataVencimento).toBe(
      "O vencimento não pode ter mais de 90 dias no passado",
    );
  });
});

describe("vencimentoMinimo", () => {
  it("conta 90 dias a partir do dia corrente em São Paulo", () => {
    expect(vencimentoMinimo(agora)).toBe("2026-08-13");
  });
});
