import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { atualizarMembro, criarMembro, type Membro } from "./api";
import { FormMembro } from "./form-membro";

vi.mock("./api", () => ({ criarMembro: vi.fn(), atualizarMembro: vi.fn() }));

const existente: Membro = {
  id: "m1",
  nome: "Ana Souza",
  cpf: "52998224725",
  telefone: "48999990000",
  endereco: "Rua Fictícia, 100",
  ativo: true,
  dataCadastro: "2026-01-10T00:00:00.000Z",
  acessoLiberado: false,
};

describe("FormMembro", () => {
  const onSalvo = vi.fn();
  const onCancelar = vi.fn();

  beforeEach(() => {
    vi.mocked(criarMembro).mockReset();
    vi.mocked(atualizarMembro).mockReset();
    onSalvo.mockReset();
    onCancelar.mockReset();
  });

  it("aplica a máscara ao digitar o CPF e o telefone", async () => {
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("CPF"), "52998224725");
    await usuario.type(screen.getByLabelText("Telefone"), "48999990000");

    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(48) 99999-0000");
  });

  it("cria com nome e endereço aparados, CPF e telefone só com dígitos, e chama onSalvo", async () => {
    vi.mocked(criarMembro).mockResolvedValue(existente);
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("Nome"), "  Ana Souza ");
    await usuario.type(screen.getByLabelText("CPF"), "529.982.247-25");
    await usuario.type(screen.getByLabelText("Telefone"), "(48) 99999-0000");
    await usuario.type(screen.getByLabelText("Endereço"), " Rua Fictícia, 100  ");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(criarMembro).toHaveBeenCalledWith({
      nome: "Ana Souza",
      cpf: "52998224725",
      telefone: "48999990000",
      endereco: "Rua Fictícia, 100",
    });
    expect(onSalvo).toHaveBeenCalledWith(existente);
  });

  it("mostra os erros de cada campo sem chamar a API", async () => {
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("nome deve ter entre 3 e 120 caracteres")).toBeInTheDocument();
    expect(screen.getByText("cpf deve ser um CPF válido")).toBeInTheDocument();
    expect(screen.getByText("telefone deve ter 10 ou 11 dígitos, com o DDD")).toBeInTheDocument();
    expect(screen.getByText("endereco deve ter entre 5 e 200 caracteres")).toBeInTheDocument();
    expect(criarMembro).not.toHaveBeenCalled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("recusa o CPF com dígito verificador errado", async () => {
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza");
    await usuario.type(screen.getByLabelText("CPF"), "52998224724");
    await usuario.type(screen.getByLabelText("Telefone"), "48999990000");
    await usuario.type(screen.getByLabelText("Endereço"), "Rua Fictícia, 100");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("cpf deve ser um CPF válido")).toBeInTheDocument();
    expect(screen.getByLabelText("CPF")).toHaveAttribute("aria-invalid", "true");
    expect(criarMembro).not.toHaveBeenCalled();
  });

  it("edita com o CPF desabilitado e mascarado e sem cpf no PATCH", async () => {
    vi.mocked(atualizarMembro).mockResolvedValue(existente);
    const usuario = userEvent.setup();
    render(<FormMembro membro={existente} onSalvo={onSalvo} onCancelar={onCancelar} />);

    expect(screen.getByLabelText("CPF")).toBeDisabled();
    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
    expect(screen.getByLabelText("Nome")).toHaveValue("Ana Souza");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(48) 99999-0000");
    expect(screen.getByLabelText("Endereço")).toHaveValue("Rua Fictícia, 100");
    await usuario.clear(screen.getByLabelText("Nome"));
    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza Lima");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(atualizarMembro).toHaveBeenCalledWith("m1", {
      nome: "Ana Souza Lima",
      telefone: "48999990000",
      endereco: "Rua Fictícia, 100",
    });
    expect(criarMembro).not.toHaveBeenCalled();
    expect(onSalvo).toHaveBeenCalledWith(existente);
  });

  it("mostra o 409 da API no campo CPF e reabilita o botão", async () => {
    vi.mocked(criarMembro).mockRejectedValue(new ApiError(409, "CPF já cadastrado"));
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza");
    await usuario.type(screen.getByLabelText("CPF"), "52998224725");
    await usuario.type(screen.getByLabelText("Telefone"), "48999990000");
    await usuario.type(screen.getByLabelText("Endereço"), "Rua Fictícia, 100");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("CPF já cadastrado")).toBeInTheDocument();
    expect(screen.getByLabelText("CPF")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onSalvo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("mostra outro erro da API em role=alert e reabilita o botão", async () => {
    vi.mocked(criarMembro).mockRejectedValue(new ApiError(500, "Falha"));
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza");
    await usuario.type(screen.getByLabelText("CPF"), "52998224725");
    await usuario.type(screen.getByLabelText("Telefone"), "48999990000");
    await usuario.type(screen.getByLabelText("Endereço"), "Rua Fictícia, 100");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha");
    expect(screen.getByLabelText("CPF")).not.toHaveAttribute("aria-invalid");
    expect(onSalvo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("desabilita o botão enquanto envia", async () => {
    vi.mocked(criarMembro).mockReturnValue(new Promise(() => {}));
    const usuario = userEvent.setup();
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza");
    await usuario.type(screen.getByLabelText("CPF"), "52998224725");
    await usuario.type(screen.getByLabelText("Telefone"), "48999990000");
    await usuario.type(screen.getByLabelText("Endereço"), "Rua Fictícia, 100");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
  });

  it("chama onCancelar", async () => {
    render(<FormMembro onSalvo={onSalvo} onCancelar={onCancelar} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalled();
  });
});
