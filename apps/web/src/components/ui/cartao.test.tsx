import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cartao, DuasColunas } from "./cartao";

describe("Cartao e DuasColunas", () => {
  it("mostra título, descrição, ação e conteúdo", () => {
    render(
      <Cartao titulo="Atalhos" descricao="Mais usados" acao={<a href="/x">Ver</a>}>
        corpo
      </Cartao>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Atalhos" })).toBeInTheDocument();
    expect(screen.getByText("Mais usados")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver" })).toBeInTheDocument();
    expect(screen.getByText("corpo")).toBeInTheDocument();
  });

  it("sem título, só o conteúdo, com o padding compacto", () => {
    const { container } = render(<Cartao espaco="compacto">corpo</Cartao>);

    expect(screen.queryByRole("heading")).toBeNull();
    expect(container.firstChild).toHaveClass("p-5");
  });

  it("DuasColunas mostra a lateral só quando existe", () => {
    const { rerender } = render(<DuasColunas principal={<p>tabela</p>} lateral={<p>form</p>} />);
    expect(screen.getByText("form")).toBeInTheDocument();

    rerender(<DuasColunas principal={<p>tabela</p>} lateral={false} larguraLateral="360px" />);
    expect(screen.getByText("tabela")).toBeInTheDocument();
    expect(screen.queryByText("form")).toBeNull();
  });
});
