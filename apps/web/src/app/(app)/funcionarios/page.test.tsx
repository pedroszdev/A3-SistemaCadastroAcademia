import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FuncionariosPage from "./page";

vi.mock("@/features/funcionarios/tela-funcionarios", () => ({
  TelaFuncionarios: () => <p>tela</p>,
}));

describe("FuncionariosPage", () => {
  // O título fica dentro da tela, junto do botão de ação que depende do cargo.
  it("renderiza a tela", () => {
    render(<FuncionariosPage />);

    expect(screen.getByText("tela")).toBeInTheDocument();
  });
});
