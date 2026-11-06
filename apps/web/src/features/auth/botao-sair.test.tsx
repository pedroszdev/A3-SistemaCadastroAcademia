import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { sair } from "./api";
import { BotaoSair } from "./botao-sair";

vi.mock("./api", () => ({ sair: vi.fn() }));

function renderizar() {
  render(
    <ToastProvider>
      <BotaoSair />
    </ToastProvider>,
  );
}

describe("BotaoSair", () => {
  const replace = vi.fn();

  beforeEach(() => {
    vi.mocked(sair).mockReset();
    replace.mockReset();
    vi.stubGlobal("location", { replace });
  });

  it("encerra a sessão e vai para o login", async () => {
    vi.mocked(sair).mockResolvedValue();
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(sair).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("mostra o erro num toast quando não consegue sair", async () => {
    vi.mocked(sair).mockRejectedValue(new Error("Não foi possível sair. Tente novamente."));
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByText("Não foi possível sair. Tente novamente.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sair" })).toBeEnabled();
  });
});
