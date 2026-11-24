import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PagamentosPage from "./page";

vi.mock("@/features/pagamentos/tela-pagamentos", () => ({
  TelaPagamentos: ({ cabecalho }: { cabecalho?: { titulo: string; descricao?: string } }) => (
    <>
      <h1>{cabecalho?.titulo}</h1>
      <p>{cabecalho?.descricao}</p>
    </>
  ),
}));

describe("PagamentosPage", () => {
  it("passa o título e a descrição da página para a tela", () => {
    render(<PagamentosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Pagamentos" })).toBeInTheDocument();
    expect(screen.getByText("Mensalidades dos membros. Visível só para administrador e recepção.")).toBeInTheDocument();
  });
});
