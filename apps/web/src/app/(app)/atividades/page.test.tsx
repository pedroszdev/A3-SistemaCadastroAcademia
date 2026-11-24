import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AtividadesPage from "./page";

vi.mock("@/features/historico/tela-historico", () => ({
  TelaHistorico: ({ cabecalho }: { cabecalho?: { titulo: string; descricao?: string } }) => (
    <>
      <h1>{cabecalho?.titulo}</h1>
      <p>{cabecalho?.descricao}</p>
    </>
  ),
}));

describe("AtividadesPage", () => {
  it("passa o título e a descrição da página para a tela", () => {
    render(<AtividadesPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Histórico de atividades" })).toBeInTheDocument();
    expect(screen.getByText("Cada execução de treino registrada pelos instrutores.")).toBeInTheDocument();
  });
});
