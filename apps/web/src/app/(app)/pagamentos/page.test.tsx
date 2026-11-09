import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PagamentosPage from "./page";

vi.mock("@/features/pagamentos/tela-pagamentos", () => ({
  TelaPagamentos: () => <p>tela</p>,
}));

describe("PagamentosPage", () => {
  it("mostra o título e a tela", () => {
    render(<PagamentosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Pagamentos" })).toBeInTheDocument();
    expect(screen.getByText("tela")).toBeInTheDocument();
  });
});
