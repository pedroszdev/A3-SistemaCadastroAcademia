import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MeusTreinosPage from "./page";

vi.mock("@/features/aluno/meus-treinos", () => ({
  MeusTreinos: () => <p>painel</p>,
}));

describe("MeusTreinosPage", () => {
  it("mostra o título", () => {
    render(<MeusTreinosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Meus treinos" })).toBeInTheDocument();
  });

  it("renderiza o painel", () => {
    render(<MeusTreinosPage />);

    expect(screen.getByText("painel")).toBeInTheDocument();
  });
});
