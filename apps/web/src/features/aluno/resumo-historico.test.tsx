import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResumoHistorico } from "./resumo-historico";

describe("ResumoHistorico", () => {
  it("mostra o total de atividades e de minutos do período", () => {
    render(<ResumoHistorico resumo={{ totalAtividades: 7, totalMinutos: 320 }} />);

    expect(screen.getByText("Atividades").nextElementSibling?.textContent).toBe("7");
    expect(screen.getByText("Minutos").nextElementSibling?.textContent).toBe("320");
  });

  it("mostra zero quando não há atividade", () => {
    render(<ResumoHistorico resumo={{ totalAtividades: 0, totalMinutos: 0 }} />);

    expect(screen.getByText("Atividades").nextElementSibling?.textContent).toBe("0");
    expect(screen.getByText("Minutos").nextElementSibling?.textContent).toBe("0");
  });
});
