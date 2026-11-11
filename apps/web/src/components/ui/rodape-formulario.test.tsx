import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RodapeFormulario } from "./rodape-formulario";

describe("RodapeFormulario", () => {
  it("mostra Cancelar e Salvar habilitados, sem erro", () => {
    render(<RodapeFormulario erro={null} enviando={false} onCancelar={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("mostra o erro em role=alert vermelho", () => {
    render(<RodapeFormulario erro="Falha ao salvar" enviando={false} onCancelar={vi.fn()} />);

    const erro = screen.getByRole("alert");
    expect(erro).toHaveTextContent("Falha ao salvar");
    expect(erro).toHaveClass("text-red-600");
  });

  it("troca o texto e desabilita o Salvar enquanto envia", () => {
    render(<RodapeFormulario erro={null} enviando onCancelar={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
  });

  it("desabilita o Salvar quando desabilitado", () => {
    render(<RodapeFormulario erro={null} enviando={false} desabilitado onCancelar={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
  });

  it("chama onCancelar em Cancelar", async () => {
    const onCancelar = vi.fn();
    render(<RodapeFormulario erro={null} enviando={false} onCancelar={onCancelar} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalled();
  });
});
