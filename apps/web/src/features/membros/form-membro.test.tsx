import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { atualizarMembro, criarMembro, type Membro } from "./api";
import { FormMembro } from "./form-membro";

vi.mock("./api", () => ({ criarMembro: vi.fn(), atualizarMembro: vi.fn() }));

const existente: Membro = {
  id: "m1",
  nome: "Bruno Lima",
  cpf: "52998224725",
  telefone: "48999991234",
  endereco: "Rua das Flores, 100",
  ativo: true,
  dataCadastro: "2026-10-01T00:00:00.000Z",
};

async function preencherValido(usuario: ReturnType<typeof userEvent.setup>, cpf = "52998224725") {
  await usuario.type(screen.getByLabelText("Nome"), "  Ana Pereira ");
  await usuario.type(screen.getByLabelText("CPF"), cpf);
  await usuario.type(screen.getByLabelText("Telefone"), "48999991234");
  await usuario.type(screen.getByLabelText("Endereço"), " Rua das Flores, 100 ");
}

describe("FormMembro", () => {
  const onSalvo = vi.fn();
  const onCancelar = vi.fn();
  const onEnviando = vi.fn();

  beforeEach(() => {
    vi.mocked(criarMembro).mockReset();
    vi.mocked(atualizarMembro).mockReset();
    onSalvo.mockReset();
    onCancelar.mockReset();
    onEnviando.mockReset();
  });

  it("aplica as máscaras de CPF e telefone enquanto digita", async () => {
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("CPF"), "52998224725");
    await usuario.type(screen.getByLabelText("Telefone"), "48999991234");

    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(48) 99999-1234");
  });

  it("cria com os valores aparados, CPF e telefone só com números", async () => {
    vi.mocked(criarMembro).mockResolvedValue(existente);
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} onEnviando={onEnviando} />);

    await preencherValido(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(criarMembro).toHaveBeenCalledWith({
      nome: "Ana Pereira",
      cpf: "52998224725",
      telefone: "48999991234",
      endereco: "Rua das Flores, 100",
    });
    expect(onSalvo).toHaveBeenCalled();
    expect(onEnviando).toHaveBeenCalledWith(true);
  });

  it("CPF inválido bloqueia o envio", async () => {
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await preencherValido(usuario, "52998224726");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("CPF inválido")).toBeInTheDocument();
    expect(screen.getByLabelText("CPF")).toHaveAttribute("aria-invalid", "true");
    expect(criarMembro).not.toHaveBeenCalled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("mostra todos os erros de validação sem chamar a API", async () => {
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("nome deve ter entre 3 e 120 caracteres")).toBeInTheDocument();
    expect(screen.getByText("CPF inválido")).toBeInTheDocument();
    expect(screen.getByText("telefone deve ter 10 ou 11 dígitos, com o DDD")).toBeInTheDocument();
    expect(screen.getByText("endereco deve ter entre 5 e 200 caracteres")).toBeInTheDocument();
    expect(criarMembro).not.toHaveBeenCalled();
  });

  it("mostra 'CPF já cadastrado' no 409 e reabilita o botão", async () => {
    vi.mocked(criarMembro).mockRejectedValue(new ApiError(409, "Conflito"));
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} onEnviando={onEnviando} />);

    await preencherValido(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("CPF já cadastrado");
    expect(onSalvo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    expect(onEnviando).toHaveBeenLastCalledWith(false);
  });

  it("mostra a mensagem da API em outros erros", async () => {
    vi.mocked(criarMembro).mockRejectedValue(new ApiError(500, "Erro interno"));
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await preencherValido(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno");
  });

  it("edita com o CPF desabilitado e sem o CPF no body", async () => {
    vi.mocked(atualizarMembro).mockResolvedValue(existente);
    const usuario = userEvent.setup();
    render(<FormMembro membro={existente} onSalvo={onSalvo} onCancelar={onCancelar} />);

    expect(screen.getByLabelText("CPF")).toBeDisabled();
    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(48) 99999-1234");
    await usuario.clear(screen.getByLabelText("Nome"));
    await usuario.type(screen.getByLabelText("Nome"), "Bruno Lima Jr");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(atualizarMembro).toHaveBeenCalledWith("m1", {
      nome: "Bruno Lima Jr",
      telefone: "48999991234",
      endereco: "Rua das Flores, 100",
    });
    expect(criarMembro).not.toHaveBeenCalled();
    expect(onSalvo).toHaveBeenCalled();
  });

  it("desabilita o botão enquanto envia", async () => {
    vi.mocked(criarMembro).mockReturnValue(new Promise(() => {}));
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await preencherValido(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
  });

  it("chama onCancelar", async () => {
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalled();
  });
});
