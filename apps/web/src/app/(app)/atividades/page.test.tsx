import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AtividadesPage from "./page";

vi.mock("@/features/historico/tela-historico", () => ({
  TelaHistorico: () => <p>tela</p>,
}));

describe("AtividadesPage", () => {
  it("mostra o título e a tela", () => {
    render(<AtividadesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Histórico de atividades" }),
    ).toBeInTheDocument();
    expect(screen.getByText("tela")).toBeInTheDocument();
  });
});
