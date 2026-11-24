import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog, PainelLateral } from "./dialog";

describe("Dialog", () => {
  it("não renderiza fechado", () => {
    render(
      <Dialog aberto={false} titulo="Confirmar" onFechar={vi.fn()}>
        Corpo
      </Dialog>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renderiza título, conteúdo e ações quando aberto", () => {
    render(
      <Dialog
        aberto
        titulo="Confirmar"
        onFechar={vi.fn()}
        acoes={<button>OK</button>}
      >
        Corpo
      </Dialog>,
    );

    expect(screen.getByRole("dialog", { name: "Confirmar" })).toBeInTheDocument();
    expect(screen.getByText("Corpo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("fecha com Escape", async () => {
    const onFechar = vi.fn();
    render(
      <Dialog aberto titulo="Confirmar" onFechar={onFechar}>
        Corpo
      </Dialog>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it("fecha ao clicar no overlay, mas não no conteúdo", async () => {
    const onFechar = vi.fn();
    render(
      <Dialog aberto titulo="Confirmar" onFechar={onFechar}>
        Corpo
      </Dialog>,
    );

    await userEvent.click(screen.getByText("Corpo"));
    expect(onFechar).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("dialog-overlay"));
    expect(onFechar).toHaveBeenCalledTimes(1);
  });

  it("não escuta Escape quando fechado", async () => {
    const onFechar = vi.fn();
    render(
      <Dialog aberto={false} titulo="Confirmar" onFechar={onFechar}>
        Corpo
      </Dialog>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onFechar).not.toHaveBeenCalled();
  });
});

describe("PainelLateral", () => {
  it("não renderiza fechado", () => {
    render(
      <PainelLateral aberto={false} titulo="Novo treino" onFechar={vi.fn()}>
        Corpo
      </PainelLateral>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("é um diálogo não modal com título, descrição e conteúdo", () => {
    render(
      <PainelLateral aberto titulo="Novo treino" descricao="Ficha planejada" onFechar={vi.fn()}>
        Corpo
      </PainelLateral>,
    );

    const painel = screen.getByRole("dialog", { name: "Novo treino" });
    expect(painel).toHaveAttribute("aria-modal", "false");
    expect(screen.getByText("Ficha planejada")).toBeInTheDocument();
    expect(screen.getByText("Corpo")).toBeInTheDocument();
    expect(screen.queryByTestId("dialog-overlay")).toBeNull();
  });

  it("fecha no X e com Escape", async () => {
    const onFechar = vi.fn();
    render(
      <PainelLateral aberto titulo="Novo treino" onFechar={onFechar}>
        Corpo
      </PainelLateral>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Fechar painel" }));
    await userEvent.keyboard("{Escape}");

    expect(onFechar).toHaveBeenCalledTimes(2);
  });

  it("deixa o Escape para o Dialog modal aberto por cima", async () => {
    const fecharPainel = vi.fn();
    const fecharModal = vi.fn();
    render(
      <>
        <PainelLateral aberto titulo="Editar treino" onFechar={fecharPainel}>
          Corpo
        </PainelLateral>
        <Dialog aberto titulo="Excluir treino" onFechar={fecharModal}>
          Confirma?
        </Dialog>
      </>,
    );

    await userEvent.keyboard("{Escape}");

    expect(fecharModal).toHaveBeenCalledTimes(1);
    expect(fecharPainel).not.toHaveBeenCalled();
  });
});
