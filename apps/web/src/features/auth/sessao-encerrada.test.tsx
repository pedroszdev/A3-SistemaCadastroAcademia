import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sair } from "./api";
import { SessaoEncerrada } from "./sessao-encerrada";

vi.mock("./api", () => ({ sair: vi.fn() }));

describe("SessaoEncerrada", () => {
  const replace = vi.fn();

  beforeEach(() => {
    vi.mocked(sair).mockReset();
    replace.mockReset();
    vi.stubGlobal("location", { replace });
  });

  it("apaga a sessão e vai para o login", async () => {
    vi.mocked(sair).mockResolvedValue();

    render(<SessaoEncerrada />);

    expect(screen.getByRole("status")).toHaveTextContent("Sua sessão terminou");
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(sair).toHaveBeenCalled();
  });

  it("avisa e fica na tela quando não consegue apagar a sessão", async () => {
    vi.mocked(sair).mockRejectedValue(new Error("falhou"));

    render(<SessaoEncerrada />);

    expect(
      await screen.findByText("Não foi possível encerrar a sessão. Recarregue a página."),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
