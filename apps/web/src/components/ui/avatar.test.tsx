import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, iniciais, Pessoa } from "./avatar";

describe("iniciais", () => {
  it.each([
    ["Ana Souza", "AS"],
    ["Maria da Silva Lima", "ML"],
    ["Recepção", "R"],
    ["  joão  ", "J"],
    ["123", "?"],
    ["", "?"],
  ])("%s → %s", (nome, esperado) => {
    expect(iniciais(nome)).toBe(esperado);
  });
});

describe("Avatar e Pessoa", () => {
  it("o avatar é decorativo e mostra as iniciais", () => {
    const { container } = render(<Avatar nome="Ana Souza" />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(container).toHaveTextContent("AS");
  });

  it("Pessoa mostra o nome, ou o conteúdo no lugar dele", () => {
    const { rerender } = render(<Pessoa nome="Ana Souza" />);
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();

    rerender(
      <Pessoa nome="Ana Souza">
        <a href="/x">Ana</a>
      </Pessoa>,
    );
    expect(screen.getByRole("link", { name: "Ana" })).toBeInTheDocument();
  });
});
