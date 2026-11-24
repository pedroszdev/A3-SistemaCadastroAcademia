import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TreinosPage from "./page";

vi.mock("@/features/treinos/tela-treinos", () => ({
  TelaTreinos: ({ cabecalho }: { cabecalho?: { titulo: string; descricao?: string } }) => (
    <>
      <h1>{cabecalho?.titulo}</h1>
      <p>{cabecalho?.descricao}</p>
    </>
  ),
}));

describe("TreinosPage", () => {
  it("passa o título e a descrição da página para a tela", () => {
    render(<TreinosPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Treinos" })).toBeInTheDocument();
    expect(screen.getByText("Fichas de treino dos membros, criadas pelos instrutores.")).toBeInTheDocument();
  });
});
