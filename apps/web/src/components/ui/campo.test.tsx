import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AreaTexto } from "./area-texto";
import { Input } from "./input";
import { Select } from "./select";

describe("Campos", () => {
  it("marca o obrigatório fora do nome acessível", () => {
    render(<Input rotulo="Nome" obrigatorio />);

    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Nome")).toHaveClass("after:content-['_*']");
  });

  it("liga a ajuda ao campo e troca pelo erro quando há erro", () => {
    const { rerender } = render(<Input rotulo="CPF" ajuda="Só números" />);
    expect(screen.getByLabelText("CPF")).toHaveAccessibleDescription("Só números");

    rerender(<Input rotulo="CPF" ajuda="Só números" erro="CPF inválido" />);
    expect(screen.getByLabelText("CPF")).toHaveAccessibleDescription("CPF inválido");
    expect(screen.queryByText("Só números")).toBeNull();
  });

  it("esconde o rótulo só visualmente", () => {
    render(<Input rotulo="Buscar" rotuloOculto icone="busca" />);

    expect(screen.getByText("Buscar")).toHaveClass("sr-only");
    expect(screen.getByLabelText("Buscar")).toHaveClass("pl-10");
  });

  it("o select também aceita ajuda", () => {
    render(<Select rotulo="Tipo" opcoes={[{ valor: "a", rotulo: "A" }]} ajuda="Escolha um" />);

    expect(screen.getByLabelText("Tipo")).toHaveAccessibleDescription("Escolha um");
  });

  it("a área de texto liga rótulo, erro e linhas", async () => {
    render(<AreaTexto rotulo="Descrição" erro="Obrigatório" />);

    const campo = screen.getByLabelText("Descrição");
    expect(campo.tagName).toBe("TEXTAREA");
    expect(campo).toHaveAttribute("rows", "3");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Obrigatório");

    await userEvent.type(campo, "Treino A");
    expect(campo).toHaveValue("Treino A");
  });

  it("a área de texto sem erro mostra a ajuda", () => {
    render(<AreaTexto rotulo="Obs" ajuda="Opcional" id="obs" />);

    expect(screen.getByLabelText("Obs")).toHaveAttribute("id", "obs");
    expect(screen.getByLabelText("Obs")).toHaveAccessibleDescription("Opcional");
  });
});
