import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PortalDoAlunoPage from "./page";

describe("PortalDoAlunoPage", () => {
  it("mostra o título e os atalhos do portal", () => {
    render(<PortalDoAlunoPage />);

    expect(screen.getByRole("heading", { name: "Portal do aluno" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Meus treinos" })).toHaveAttribute(
      "href",
      "/aluno/treinos",
    );
    expect(screen.getByRole("link", { name: "Meu histórico" })).toHaveAttribute(
      "href",
      "/aluno/historico",
    );
  });
});
