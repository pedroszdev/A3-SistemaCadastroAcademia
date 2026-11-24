import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it.each([
    ["PENDENTE", "Pendente"],
    ["PAGO", "Pago"],
    ["ATRASADO", "Atrasado"],
    ["CANCELADO", "Cancelado"],
    ["ATIVO", "Ativo"],
    ["INATIVO", "Inativo"],
  ] as const)("mostra o rótulo de %s", (status, texto) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it("usa a cor do status", () => {
    render(<StatusBadge status="PAGO" />);

    expect(screen.getByText("Pago")).toHaveClass("bg-sucesso-fundo");
  });

  it("deixa o rotulo substituir o texto", () => {
    render(<StatusBadge status="ATRASADO" rotulo="Atrasado há 12 dias" />);

    expect(screen.getByText("Atrasado há 12 dias")).toBeInTheDocument();
    expect(screen.queryByText("Atrasado")).toBeNull();
  });
});

describe("Badge", () => {
  it("aplica o tom", () => {
    render(<Badge tom="roxo">Alongamento</Badge>);

    expect(screen.getByText("Alongamento")).toHaveClass("bg-roxo-fundo");
  });
});
