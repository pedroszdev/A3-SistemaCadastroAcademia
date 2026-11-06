import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { entrar } from "./api";
import { FormLogin } from "./form-login";

vi.mock("./api", () => ({ entrar: vi.fn() }));

async function preencherEEnviar() {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText("Login"), "maria01");
  await usuario.type(screen.getByLabelText("Senha"), "senha1234");
  await usuario.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("FormLogin", () => {
  const replace = vi.fn();

  beforeEach(() => {
    vi.mocked(entrar).mockReset();
    replace.mockReset();
    vi.stubGlobal("location", { replace });
  });

  it("envia login e senha e vai para o dashboard", async () => {
    vi.mocked(entrar).mockResolvedValue();
    render(<FormLogin />);

    await preencherEEnviar();

    expect(entrar).toHaveBeenCalledWith({ login: "maria01", senha: "senha1234" });
    expect(replace).toHaveBeenCalledWith("/dashboard");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("mostra o erro e continua na tela quando o login falha", async () => {
    vi.mocked(entrar).mockRejectedValue(new Error("Login ou senha inválidos."));
    render(<FormLogin />);

    await preencherEEnviar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Login ou senha inválidos.",
    );
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });

  it("desabilita o botão enquanto envia", async () => {
    vi.mocked(entrar).mockReturnValue(new Promise(() => {}));
    render(<FormLogin />);

    await preencherEEnviar();

    expect(screen.getByRole("button", { name: "Entrando…" })).toBeDisabled();
  });

  it("exige login e senha", () => {
    render(<FormLogin />);

    expect(screen.getByLabelText("Login")).toBeRequired();
    expect(screen.getByLabelText("Senha")).toBeRequired();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
  });
});
