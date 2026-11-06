import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListaInadimplentes } from "./lista-inadimplentes";

describe("ListaInadimplentes", () => {
  it("mostra cada membro com link para a ficha e os dias de atraso", () => {
    render(
      <ListaInadimplentes
        membros={[
          { id: "m1", nome: "Maria Souza", maiorAtrasoDias: 15 },
          { id: "m2", nome: "Carlos Lima", maiorAtrasoDias: 32 },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Membros inadimplentes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Maria Souza" })).toHaveAttribute(
      "href",
      "/membros/m1",
    );
    expect(screen.getByRole("link", { name: "Carlos Lima" })).toHaveAttribute(
      "href",
      "/membros/m2",
    );
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
  });

  it("mostra o estado vazio quando não há inadimplentes", () => {
    render(<ListaInadimplentes membros={[]} />);

    expect(screen.getByText("Nenhum membro inadimplente")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
