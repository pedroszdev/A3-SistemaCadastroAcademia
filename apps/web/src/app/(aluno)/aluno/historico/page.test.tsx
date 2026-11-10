import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MeuHistoricoPage from "./page";

vi.mock("@/features/aluno/meu-historico", () => ({
  MeuHistorico: () => <p>painel</p>,
}));

describe("MeuHistoricoPage", () => {
  it("mostra o título", () => {
    render(<MeuHistoricoPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Meu histórico" })).toBeInTheDocument();
  });

  it("renderiza o painel", () => {
    render(<MeuHistoricoPage />);

    expect(screen.getByText("painel")).toBeInTheDocument();
  });
});
