import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./dialog";

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
