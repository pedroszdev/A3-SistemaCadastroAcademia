import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FuncionariosPage from "./page";

vi.mock("@/features/funcionarios/tela-funcionarios", () => ({
  TelaFuncionarios: () => <p>tela</p>,
}));

describe("FuncionariosPage", () => {
  it("mostra o título e a tela", () => {
    render(<FuncionariosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Funcionários" })).toBeInTheDocument();
    expect(screen.getByText("tela")).toBeInTheDocument();
  });
});
