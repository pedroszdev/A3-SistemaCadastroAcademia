import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { atualizarFuncionario, criarFuncionario, type Funcionario } from "./api";
import { FormFuncionario } from "./form-funcionario";

vi.mock("./api", () => ({ criarFuncionario: vi.fn(), atualizarFuncionario: vi.fn() }));

const existente: Funcionario = {
  id: "f1",
  nome: "Bruno Lima",
  login: "bruno01",
  cargo: "INSTRUTOR",
  ativo: true,
};

describe("FormFuncionario", () => {
  const onSalvo = vi.fn();
  const onCancelar = vi.fn();

  beforeEach(() => {
    vi.mocked(criarFuncionario).mockReset();
    vi.mocked(atualizarFuncionario).mockReset();
    onSalvo.mockReset();
    onCancelar.mockReset();
  });

  it("cria com os valores aparados e chama onSalvo", async () => {
    vi.mocked(criarFuncionario).mockResolvedValue(existente);
    const usuario = userEvent.setup();
    render(<FormFuncionario onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("Nome"), "  Ana Souza ");
    await usuario.type(screen.getByLabelText("Login"), "ana01 ");
    await usuario.selectOptions(screen.getByLabelText("Cargo"), "RECEPCIONISTA");
    await usuario.type(screen.getByLabelText("Senha"), "senha1234");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(criarFuncionario).toHaveBeenCalledWith({
      nome: "Ana Souza",
      login: "ana01",
      cargo: "RECEPCIONISTA",
      senha: "senha1234",
    });
    expect(onSalvo).toHaveBeenCalled();
  });

  it("mostra o erro de validação sem chamar a API", async () => {
    const usuario = userEvent.setup();
    render(<FormFuncionario onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("nome deve ter entre 3 e 100 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Selecione o cargo")).toBeInTheDocument();
    expect(criarFuncionario).not.toHaveBeenCalled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("edita sem senha quando vazia e com o login desabilitado", async () => {
    vi.mocked(atualizarFuncionario).mockResolvedValue(existente);
    const usuario = userEvent.setup();
    render(<FormFuncionario funcionario={existente} onSalvo={onSalvo} onCancelar={onCancelar} />);

    expect(screen.getByLabelText("Login")).toBeDisabled();
    expect(screen.getByLabelText("Login")).toHaveValue("bruno01");
    await usuario.clear(screen.getByLabelText("Nome"));
    await usuario.type(screen.getByLabelText("Nome"), "Bruno Lima Jr");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(atualizarFuncionario).toHaveBeenCalledWith("f1", {
      nome: "Bruno Lima Jr",
      cargo: "INSTRUTOR",
    });
    expect(onSalvo).toHaveBeenCalled();
  });

  it("manda a nova senha quando preenchida na edição", async () => {
    vi.mocked(atualizarFuncionario).mockResolvedValue(existente);
    const usuario = userEvent.setup();
    render(<FormFuncionario funcionario={existente} onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(
      screen.getByLabelText("Nova senha (deixe em branco para manter)"),
      "outrasenha1",
    );
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(atualizarFuncionario).toHaveBeenCalledWith("f1", {
      nome: "Bruno Lima",
      cargo: "INSTRUTOR",
      senha: "outrasenha1",
    });
  });

  it("mostra o erro da API em role=alert e reabilita o botão", async () => {
    vi.mocked(criarFuncionario).mockRejectedValue(new ApiError(409, "Login já cadastrado"));
    const usuario = userEvent.setup();
    render(<FormFuncionario onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza");
    await usuario.type(screen.getByLabelText("Login"), "ana01");
    await usuario.selectOptions(screen.getByLabelText("Cargo"), "ADMIN");
    await usuario.type(screen.getByLabelText("Senha"), "senha1234");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Login já cadastrado");
    expect(onSalvo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("desabilita o botão enquanto envia", async () => {
    vi.mocked(criarFuncionario).mockReturnValue(new Promise(() => {}));
    const usuario = userEvent.setup();
    render(<FormFuncionario onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza");
    await usuario.type(screen.getByLabelText("Login"), "ana01");
    await usuario.selectOptions(screen.getByLabelText("Cargo"), "ADMIN");
    await usuario.type(screen.getByLabelText("Senha"), "senha1234");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
  });

  it("chama onCancelar", async () => {
    render(<FormFuncionario onSalvo={onSalvo} onCancelar={onCancelar} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalled();
  });
});
