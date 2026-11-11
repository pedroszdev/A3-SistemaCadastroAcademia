import { describe, expect, it } from "vitest";
import { intervaloDoPeriodo } from "./periodo";

describe("intervaloDoPeriodo", () => {
  const agora = new Date("2026-11-09T15:00:00Z");

  it("7 dias vai de hoje-6 até hoje", () => {
    expect(intervaloDoPeriodo("7dias", agora)).toEqual({
      dataDe: "2026-11-03",
      dataAte: "2026-11-09",
    });
  });

  it("30 dias vai de hoje-29 até hoje", () => {
    expect(intervaloDoPeriodo("30dias", agora)).toEqual({
      dataDe: "2026-10-11",
      dataAte: "2026-11-09",
    });
  });

  it("mês atual vai do dia 1 até hoje", () => {
    expect(intervaloDoPeriodo("mes", agora)).toEqual({
      dataDe: "2026-11-01",
      dataAte: "2026-11-09",
    });
  });

  it("atravessa a virada de mês e de ano", () => {
    const viradaDeAno = new Date("2026-01-03T15:00:00Z");

    expect(intervaloDoPeriodo("7dias", viradaDeAno)).toEqual({
      dataDe: "2025-12-28",
      dataAte: "2026-01-03",
    });
    expect(intervaloDoPeriodo("mes", viradaDeAno)).toEqual({
      dataDe: "2026-01-01",
      dataAte: "2026-01-03",
    });
  });

  it("usa o dia de São Paulo, não o de UTC", () => {
    const noiteEmSaoPaulo = new Date("2026-11-10T02:00:00Z");

    expect(intervaloDoPeriodo("7dias", noiteEmSaoPaulo).dataAte).toBe("2026-11-09");
  });

  it("sem argumento usa o relógio e devolve datas AAAA-MM-DD", () => {
    const { dataDe, dataAte } = intervaloDoPeriodo("30dias");

    expect(dataDe).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dataAte).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
