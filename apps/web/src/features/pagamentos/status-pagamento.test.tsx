import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BadgeStatusPagamento, OPCOES_STATUS_PAGAMENTO, rotuloAtraso } from "./status-pagamento";

describe("BadgeStatusPagamento", () => {
  it.each([
    ["PENDENTE", "Pendente"],
    ["PAGO", "Pago"],
    ["CANCELADO", "Cancelado"],
  ] as const)("mostra %s como %s", (status, texto) => {
    render(<BadgeStatusPagamento pagamento={{ status, diasEmAtraso: 0 }} />);

    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it("mostra ATRASADO com 1 dia no singular", () => {
    render(<BadgeStatusPagamento pagamento={{ status: "ATRASADO", diasEmAtraso: 1 }} />);

    expect(screen.getByText("Atrasado · 1 dia")).toBeInTheDocument();
  });

  it("mostra ATRASADO com os dias no plural", () => {
    render(<BadgeStatusPagamento pagamento={{ status: "ATRASADO", diasEmAtraso: 12 }} />);

    expect(screen.getByText("Atrasado · 12 dias")).toBeInTheDocument();
  });
});

describe("rotuloAtraso", () => {
  it("usa dia só quando é exatamente 1", () => {
    expect(rotuloAtraso(1)).toBe("Atrasado · 1 dia");
    expect(rotuloAtraso(2)).toBe("Atrasado · 2 dias");
  });
});

describe("OPCOES_STATUS_PAGAMENTO", () => {
  it("lista os quatro status", () => {
    expect(OPCOES_STATUS_PAGAMENTO.map((o) => o.valor)).toEqual([
      "PENDENTE",
      "PAGO",
      "ATRASADO",
      "CANCELADO",
    ]);
  });
});
