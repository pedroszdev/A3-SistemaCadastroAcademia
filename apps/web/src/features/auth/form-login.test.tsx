import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { entrar, entrarAluno } from "./api";
import { FormLogin } from "./form-login";

vi.mock("./api", () => ({ entrar: vi.fn(), entrarAluno: vi.fn() }));

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
    vi.mocked(entrarAluno).mockReset();
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
    expect(screen.getByRole("tab", { name: "Aluno" })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Funcionário" })).toBeDisabled();
  });

  it("exige login e senha", () => {
    render(<FormLogin />);

    expect(screen.getByLabelText("Login")).toBeRequired();
    expect(screen.getByLabelText("Senha")).toBeRequired();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
  });

  it("começa na aba Funcionário, sem o campo CPF", () => {
    render(<FormLogin />);

    expect(screen.getByRole("tab", { name: "Funcionário" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Aluno" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.queryByLabelText("CPF")).toBeNull();
  });

  it("troca para CPF e senha ao clicar em Aluno", async () => {
    render(<FormLogin />);

    await userEvent.setup().click(screen.getByRole("tab", { name: "Aluno" }));

    expect(screen.getByRole("tab", { name: "Aluno" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText("CPF")).toHaveAttribute("inputmode", "numeric");
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.queryByLabelText("Login")).toBeNull();
  });

  it("aplica a máscara de CPF enquanto digita", async () => {
    render(<FormLogin />);
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole("tab", { name: "Aluno" }));
    await usuario.type(screen.getByLabelText("CPF"), "52998224725");

    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
  });

  it("envia o CPF só com dígitos para a rota do aluno e vai para o portal", async () => {
    vi.mocked(entrarAluno).mockResolvedValue();
    render(<FormLogin />);
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole("tab", { name: "Aluno" }));
    await usuario.type(screen.getByLabelText("CPF"), "52998224725");
    await usuario.type(screen.getByLabelText("Senha"), "senha1234");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(entrarAluno).toHaveBeenCalledWith({ cpf: "52998224725", senha: "senha1234" });
    expect(replace).toHaveBeenCalledWith("/aluno");
    expect(entrar).not.toHaveBeenCalled();
  });

  it("mostra o erro na aba Aluno e o limpa ao voltar para Funcionário", async () => {
    vi.mocked(entrarAluno).mockRejectedValue(new Error("CPF ou senha inválidos."));
    render(<FormLogin />);
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole("tab", { name: "Aluno" }));
    await usuario.type(screen.getByLabelText("CPF"), "52998224725");
    await usuario.type(screen.getByLabelText("Senha"), "senha1234");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("CPF ou senha inválidos.");
    expect(replace).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole("tab", { name: "Funcionário" }));

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
