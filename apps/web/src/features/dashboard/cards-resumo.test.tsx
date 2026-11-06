import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatarMoeda } from "@/lib/format";
import { CardsResumo } from "./cards-resumo";

describe("CardsResumo", () => {
  it("mostra cada indicador com o seu valor", () => {
    render(
      <CardsResumo
        resumo={{
          membrosAtivos: 12,
          membrosInadimplentes: 3,
          pagamentosAtrasados: 5,
          receitaMes: 1234.5,
          atividadesHoje: 7,
        }}
      />,
    );

    const valorDe = (rotulo: string) =>
      screen.getByText(rotulo).nextElementSibling?.textContent;

    expect(valorDe("Membros ativos")).toBe("12");
    expect(valorDe("Inadimplentes")).toBe("3");
    expect(valorDe("Pagamentos atrasados")).toBe("5");
    expect(valorDe("Receita do mês")).toBe(formatarMoeda(1234.5));
    expect(valorDe("Atividades hoje")).toBe("7");
  });

  it("mostra zero quando não há movimento", () => {
    render(
      <CardsResumo
        resumo={{
          membrosAtivos: 0,
          membrosInadimplentes: 0,
          pagamentosAtrasados: 0,
          receitaMes: 0,
          atividadesHoje: 0,
        }}
      />,
    );

    expect(screen.getByText("Receita do mês").nextElementSibling?.textContent).toBe(
      formatarMoeda(0),
    );
  });
});
