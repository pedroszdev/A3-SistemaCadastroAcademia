import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("associa o rótulo ao campo", () => {
    render(<Input rotulo="Nome" />);

    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
  });

  it("respeita o id recebido", () => {
    render(<Input rotulo="Nome" id="nome" />);

    expect(screen.getByLabelText("Nome")).toHaveAttribute("id", "nome");
  });

  it("não marca invalid sem erro", () => {
    render(<Input rotulo="Nome" />);

    expect(screen.getByLabelText("Nome")).not.toHaveAttribute("aria-invalid");
  });

  it("mostra o erro e o liga ao campo", () => {
    render(<Input rotulo="Nome" erro="Obrigatório" />);

    const campo = screen.getByLabelText("Nome");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Obrigatório");
  });
});
