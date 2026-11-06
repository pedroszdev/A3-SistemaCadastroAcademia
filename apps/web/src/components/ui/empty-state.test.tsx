import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("mostra só o título", () => {
    render(<EmptyState titulo="Nada aqui" />);

    expect(screen.getByText("Nada aqui")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("mostra descrição e ação", () => {
    render(
      <EmptyState
        titulo="Nada aqui"
        descricao="Cadastre um membro"
        acao={<button>Novo</button>}
      />,
    );

    expect(screen.getByText("Cadastre um membro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo" })).toBeInTheDocument();
  });
});
