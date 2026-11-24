import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MeusPagamentosPage from "./page";

vi.mock("@/features/aluno/meus-pagamentos", () => ({
  MeusPagamentos: () => <p>pagamentos</p>,
}));

describe("MeusPagamentosPage", () => {
  it("mostra o título e a lista", () => {
    render(<MeusPagamentosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Pagamentos" })).toBeInTheDocument();
    expect(screen.getByText("pagamentos")).toBeInTheDocument();
  });
});
