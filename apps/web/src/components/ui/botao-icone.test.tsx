import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BotaoIcone, LinkIcone } from "./botao-icone";

describe("BotaoIcone e LinkIcone", () => {
  it("o botão usa o rótulo como nome e chama onClick", async () => {
    const onClick = vi.fn();
    render(<BotaoIcone icone="editar" rotulo="Editar Ana" onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Editar Ana" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("o botão aplica o tom", () => {
    render(<BotaoIcone icone="lixeira" rotulo="Excluir" tom="alerta" />);

    expect(screen.getByRole("button", { name: "Excluir" })).toHaveClass("text-alerta");
  });

  it("o link usa o rótulo como nome e aponta para o href", () => {
    render(<LinkIcone icone="olho" rotulo="Ver ficha" href="/membros/1" tom="sucesso" />);

    const link = screen.getByRole("link", { name: "Ver ficha" });
    expect(link).toHaveAttribute("href", "/membros/1");
    expect(link).toHaveClass("text-sucesso");
  });
});
