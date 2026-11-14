import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import { atualizarMembro, buscarMembro, criarMembro, type Membro } from "./api";
import { EditarMembro, NovoMembro } from "./cadastro-membro";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("./api", () => ({
  buscarMembro: vi.fn(),
  criarMembro: vi.fn(),
  atualizarMembro: vi.fn(),
}));

const ana: Membro = {
  id: "m1",
  nome: "Ana Souza",
  cpf: "52998224725",
  telefone: "48999990000",
  endereco: "Rua Fictícia, 100",
  ativo: true,
  dataCadastro: "2026-01-10T00:00:00.000Z",
  acessoLiberado: false,
};

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const recepcionista: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" };
const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };

function renderizar(tela: ReactNode, usuario: UsuarioDoToken = recepcionista) {
  render(
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>{tela}</ToastProvider>
    </UsuarioProvider>,
  );
}

describe("NovoMembro", () => {
  beforeEach(() => {
    push.mockReset();
    vi.mocked(criarMembro).mockReset();
  });

  async function preencher(usuario: ReturnType<typeof userEvent.setup>) {
    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza");
    await usuario.type(screen.getByLabelText("CPF"), "52998224725");
    await usuario.type(screen.getByLabelText("Telefone"), "48999990000");
    await usuario.type(screen.getByLabelText("Endereço"), "Rua Fictícia, 100");
  }

  it.each([
    ["ADMIN", admin],
    ["RECEPCIONISTA", recepcionista],
  ])("cadastra como %s, mostra o aviso e vai para a lista", async (_, logado) => {
    vi.mocked(criarMembro).mockResolvedValue(ana);
    const usuario = userEvent.setup();
    renderizar(<NovoMembro />, logado);

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(criarMembro).toHaveBeenCalledWith({
      nome: "Ana Souza",
      cpf: "52998224725",
      telefone: "48999990000",
      endereco: "Rua Fictícia, 100",
    });
    expect(await screen.findByText("Membro cadastrado.")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/membros");
  });

  it("não vai para a lista quando a API recusa", async () => {
    vi.mocked(criarMembro).mockRejectedValue(new ApiError(409, "CPF já cadastrado"));
    const usuario = userEvent.setup();
    renderizar(<NovoMembro />);

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("CPF já cadastrado")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByText("Membro cadastrado.")).toBeNull();
  });

  it("volta para a lista ao cancelar", async () => {
    renderizar(<NovoMembro />);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(push).toHaveBeenCalledWith("/membros");
  });

  it("mostra Acesso restrito para o INSTRUTOR", () => {
    renderizar(<NovoMembro />, instrutor);

    expect(screen.getByText("Acesso restrito")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).toBeNull();
  });
});

describe("EditarMembro", () => {
  beforeEach(() => {
    push.mockReset();
    vi.mocked(buscarMembro).mockReset();
    vi.mocked(atualizarMembro).mockReset();
    vi.mocked(buscarMembro).mockResolvedValue(ana);
  });

  it("carrega o membro, preenche o formulário e trava o CPF", async () => {
    renderizar(<EditarMembro id="m1" />);

    expect(screen.getByText("Carregando…")).toBeInTheDocument();
    expect(await screen.findByLabelText("Nome")).toHaveValue("Ana Souza");
    expect(screen.getByLabelText("CPF")).toHaveValue("529.982.247-25");
    expect(screen.getByLabelText("CPF")).toBeDisabled();
    expect(buscarMembro).toHaveBeenCalledWith("m1");
  });

  it("salva, mostra o aviso e vai para a ficha", async () => {
    vi.mocked(atualizarMembro).mockResolvedValue(ana);
    const usuario = userEvent.setup();
    renderizar(<EditarMembro id="m1" />, admin);

    await usuario.clear(await screen.findByLabelText("Endereço"));
    await usuario.type(screen.getByLabelText("Endereço"), "Av. Fictícia, 200");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(atualizarMembro).toHaveBeenCalledWith("m1", {
      nome: "Ana Souza",
      telefone: "48999990000",
      endereco: "Av. Fictícia, 200",
    });
    expect(await screen.findByText("Membro atualizado.")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/membros/m1");
  });

  it("volta para a ficha ao cancelar", async () => {
    renderizar(<EditarMembro id="m1" />);

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));

    expect(push).toHaveBeenCalledWith("/membros/m1");
  });

  it("mostra Membro não encontrado no 404", async () => {
    vi.mocked(buscarMembro).mockRejectedValue(new ApiError(404, "Membro não encontrado"));
    renderizar(<EditarMembro id="x9" />);

    expect(await screen.findByText("Membro não encontrado")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).toBeNull();
  });

  it("mostra a mensagem de qualquer outro erro", async () => {
    vi.mocked(buscarMembro).mockRejectedValue(new ApiError(500, "Falha ao carregar"));
    renderizar(<EditarMembro id="m1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao carregar");
    expect(screen.queryByLabelText("Nome")).toBeNull();
  });

  it("mostra Acesso restrito ao INSTRUTOR sem chamar a API", () => {
    renderizar(<EditarMembro id="m1" />, instrutor);

    expect(screen.getByText("Acesso restrito")).toBeInTheDocument();
    expect(buscarMembro).not.toHaveBeenCalled();
  });
});
