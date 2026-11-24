import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import type { Membro } from "@/features/membros/api";
import { ApiError } from "@/lib/api";
import {
  atualizarMeusDados,
  buscarMeusDados,
  type FuncionarioDoPerfil,
  trocarSenha,
} from "./api";
import { MeusDados } from "./meus-dados";

vi.mock("./api", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./api")>()),
  buscarMeusDados: vi.fn(),
  atualizarMeusDados: vi.fn(),
  trocarSenha: vi.fn(),
}));

const aluno: Membro = {
  id: "m1",
  nome: "Ana Souza",
  cpf: "52998224725",
  telefone: "48999990000",
  endereco: "Rua Fictícia, 100",
  ativo: true,
  dataCadastro: "2026-01-10T00:00:00.000Z",
  acessoLiberado: true,
  valorMensalidade: 120,
  diaVencimento: 10,
};

const funcionario: FuncionarioDoPerfil = {
  id: "f1",
  nome: "Marina Souza",
  login: "marina",
  cargo: "INSTRUTOR",
  ativo: true,
};

function renderizar() {
  render(
    <ToastProvider>
      <MeusDados />
    </ToastProvider>,
  );
}

describe("MeusDados (RN20)", () => {
  beforeEach(() => {
    vi.mocked(buscarMeusDados).mockReset();
    vi.mocked(atualizarMeusDados).mockReset();
    vi.mocked(trocarSenha).mockReset();
  });

  it("mostra Carregando… e depois os dados do aluno, com nome e CPF só leitura", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(aluno);
    renderizar();
    expect(screen.getByText("Carregando…")).toBeInTheDocument();

    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText("529.982.247-25")).toBeInTheDocument();
    expect(screen.getByText(/^R\$\s120,00, vence todo dia 10$/)).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone")).toHaveValue("(48) 99999-0000");
    expect(screen.queryByLabelText("Nome")).toBeNull();
  });

  it("o aluno sem plano vê que não tem mensalidade automática", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue({
      ...aluno,
      valorMensalidade: null,
      diaVencimento: null,
    });
    renderizar();

    expect(await screen.findByText("Sem mensalidade automática")).toBeInTheDocument();
  });

  it("o aluno salva telefone e endereço", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(aluno);
    vi.mocked(atualizarMeusDados).mockResolvedValue({ ...aluno, telefone: "48988887777" });
    const usuario = userEvent.setup();
    renderizar();

    const telefone = await screen.findByLabelText("Telefone");
    await usuario.clear(telefone);
    await usuario.type(telefone, "48988887777");
    await usuario.click(screen.getByRole("button", { name: "Salvar dados" }));

    expect(atualizarMeusDados).toHaveBeenCalledWith({
      telefone: "48988887777",
      endereco: "Rua Fictícia, 100",
    });
    expect(await screen.findByText("Dados atualizados.")).toBeInTheDocument();
  });

  it("o aluno vê o erro de validação sem chamar a API", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(aluno);
    const usuario = userEvent.setup();
    renderizar();

    await usuario.clear(await screen.findByLabelText("Endereço"));
    await usuario.click(screen.getByRole("button", { name: "Salvar dados" }));

    expect(screen.getByText("endereco deve ter entre 5 e 200 caracteres")).toBeInTheDocument();
    expect(atualizarMeusDados).not.toHaveBeenCalled();
  });

  it("mostra o erro da API ao salvar", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(funcionario);
    vi.mocked(atualizarMeusDados).mockRejectedValue(new Error("Falha"));
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(await screen.findByRole("button", { name: "Salvar dados" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha");
  });

  it("o funcionário vê login e cargo e muda o nome", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(funcionario);
    vi.mocked(atualizarMeusDados).mockResolvedValue({ ...funcionario, nome: "Marina Lima" });
    const usuario = userEvent.setup();
    renderizar();

    expect(await screen.findByText("marina")).toBeInTheDocument();
    expect(screen.getByText("Instrutor")).toBeInTheDocument();
    const nome = screen.getByLabelText("Nome");
    await usuario.clear(nome);
    await usuario.type(nome, "Marina Lima");
    await usuario.click(screen.getByRole("button", { name: "Salvar dados" }));

    expect(atualizarMeusDados).toHaveBeenCalledWith({ nome: "Marina Lima" });
  });

  it("o funcionário vê o erro do nome curto", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(funcionario);
    const usuario = userEvent.setup();
    renderizar();

    await usuario.clear(await screen.findByLabelText("Nome"));
    await usuario.click(screen.getByRole("button", { name: "Salvar dados" }));

    expect(screen.getByText("nome deve ter entre 3 e 100 caracteres")).toBeInTheDocument();
  });

  it("troca a senha e limpa os campos", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(funcionario);
    vi.mocked(trocarSenha).mockResolvedValue(undefined);
    const usuario = userEvent.setup();
    renderizar();

    await usuario.type(await screen.findByLabelText("Senha atual"), "senha1234");
    await usuario.type(screen.getByLabelText("Nova senha"), "nova-senha-1");
    await usuario.type(screen.getByLabelText("Confirmar nova senha"), "nova-senha-1");
    await usuario.click(screen.getByRole("button", { name: "Trocar senha" }));

    expect(trocarSenha).toHaveBeenCalledWith("senha1234", "nova-senha-1");
    expect(await screen.findByText("Senha alterada.")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
  });

  it("mostra a senha atual incorreta no campo, sem sair", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(funcionario);
    vi.mocked(trocarSenha).mockRejectedValue(new ApiError(422, "Senha atual incorreta"));
    const usuario = userEvent.setup();
    renderizar();

    await usuario.type(await screen.findByLabelText("Senha atual"), "errada");
    await usuario.type(screen.getByLabelText("Nova senha"), "nova-senha-1");
    await usuario.type(screen.getByLabelText("Confirmar nova senha"), "nova-senha-1");
    await usuario.click(screen.getByRole("button", { name: "Trocar senha" }));

    expect(await screen.findByLabelText("Senha atual")).toHaveAccessibleDescription(
      "Senha atual incorreta",
    );
  });

  it("não chama a API com a confirmação diferente", async () => {
    vi.mocked(buscarMeusDados).mockResolvedValue(funcionario);
    const usuario = userEvent.setup();
    renderizar();

    await usuario.type(await screen.findByLabelText("Senha atual"), "x");
    await usuario.type(screen.getByLabelText("Nova senha"), "nova-senha-1");
    await usuario.type(screen.getByLabelText("Confirmar nova senha"), "outra-senha");
    await usuario.click(screen.getByRole("button", { name: "Trocar senha" }));

    expect(screen.getByText("As senhas não conferem")).toBeInTheDocument();
    expect(trocarSenha).not.toHaveBeenCalled();
  });

  it("mostra o erro ao carregar e tenta de novo", async () => {
    vi.mocked(buscarMeusDados)
      .mockRejectedValueOnce(new Error("API fora do ar"))
      .mockResolvedValueOnce(funcionario);
    const usuario = userEvent.setup();
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("API fora do ar");
    await usuario.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText("marina")).toBeInTheDocument();
  });
});
