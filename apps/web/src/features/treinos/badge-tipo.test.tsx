import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BadgeTipoTreino } from "./badge-tipo";

describe("BadgeTipoTreino", () => {
  it.each([
    ["Musculação", "bg-lima-fundo"],
    ["Cardio", "bg-alerta-fundo"],
    ["Funcional", "bg-info-fundo"],
    ["Alongamento", "bg-roxo-fundo"],
    ["Crossfit", "bg-tinta"],
    ["Outro", "bg-neutro-fundo"],
  ])("pinta %s com a cor do design", (tipo, classe) => {
    render(<BadgeTipoTreino tipo={tipo} />);

    expect(screen.getByText(tipo)).toHaveClass(classe);
  });

  it("usa o tom neutro para um tipo desconhecido", () => {
    render(<BadgeTipoTreino tipo="Yoga" />);

    expect(screen.getByText("Yoga")).toHaveClass("bg-neutro-fundo");
  });
});
