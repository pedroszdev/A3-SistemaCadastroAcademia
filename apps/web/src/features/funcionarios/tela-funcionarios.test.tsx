import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import {
  atualizarFuncionario,
  criarFuncionario,
  desativarFuncionario,
  type Funcionario,
  listarFuncionarios,
  type PaginaFuncionarios,
  reativarFuncionario,
} from "./api";
import { TelaFuncionarios } from "./tela-funcionarios";

vi.mock("./api", () => ({
  listarFuncionarios: vi.fn(),
  desativarFuncionario: vi.fn(),
  reativarFuncionario: vi.fn(),
  criarFuncionario: vi.fn(),
  atualizarFuncionario: vi.fn(),
}));

const fulano: Funcionario = { id: "f1", nome: "Fulano Silva", login: "fulano1", cargo: "INSTRUTOR", ativo: true };
const beltrana: Funcionario = { id: "f2", nome: "Beltrana Souza", login: "beltra2", cargo: "ADMIN", ativo: false };

function pagina(data: Funcionario[], extra: Partial<PaginaFuncionarios> = {}): PaginaFuncionarios {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };

function renderizar(usuario: UsuarioDoToken = admin) {
  render(
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <TelaFuncionarios />
      </ToastProvider>
    </UsuarioProvider>,
  );
}

describe("TelaFuncionarios", () => {
  beforeEach(() => {
    vi.mocked(listarFuncionarios).mockReset();
    vi.mocked(desativarFuncionario).mockReset();
    vi.mocked(reativarFuncionario).mockReset();
    vi.mocked(listarFuncionarios).mockResolvedValue(pagina([fulano, beltrana]));
  });

  it("mostra as linhas com cargo e situação para o ADMIN", async () => {
    renderizar();

    expect(await screen.findByText("Fulano Silva")).toBeInTheDocument();
    expect(screen.getByText("Beltrana Souza")).toBeInTheDocument();
    const linha = screen.getByText("Fulano Silva").closest("tr") as HTMLElement;
    expect(within(linha).getByText("Instrutor")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    expect(listarFuncionarios).toHaveBeenCalledWith({ page: 1 });
  });

  it("filtra por cargo e situação voltando para a página 1", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.selectOptions(screen.getByLabelText("Cargo"), "INSTRUTOR");
    expect(listarFuncionarios).toHaveBeenLastCalledWith({ cargo: "INSTRUTOR", page: 1 });

    await usuario.selectOptions(screen.getByLabelText("Situação"), "false");
    expect(listarFuncionarios).toHaveBeenLastCalledWith({ cargo: "INSTRUTOR", ativo: false, page: 1 });

    await usuario.selectOptions(screen.getByLabelText("Situação"), "");
    await usuario.selectOptions(screen.getByLabelText("Cargo"), "");
    expect(listarFuncionarios).toHaveBeenLastCalledWith({ cargo: undefined, ativo: undefined, page: 1 });
  });

  it("pede a página 2 em Próxima", async () => {
    vi.mocked(listarFuncionarios).mockResolvedValue(pagina([fulano], { total: 40 }));
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(listarFuncionarios).toHaveBeenLastCalledWith({ page: 2 });
  });

  it("abre o formulário de criação", async () => {
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Novo funcionário" }));

    const dialogo = screen.getByRole("dialog", { name: "Novo funcionário" });
    expect(within(dialogo).getByLabelText("Login")).toBeEnabled();
  });

  it("abre o formulário de edição preenchido e fecha em Cancelar", async () => {
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Editar Fulano Silva" }));

    const dialogo = screen.getByRole("dialog", { name: "Editar funcionário" });
    expect(within(dialogo).getByLabelText("Nome")).toHaveValue("Fulano Silva");
    expect(within(dialogo).getByLabelText("Login")).toBeDisabled();

    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("salva um funcionário novo, avisa e recarrega a lista", async () => {
    vi.mocked(criarFuncionario).mockResolvedValue(fulano);
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Novo funcionário" }));
    await usuario.type(screen.getByLabelText("Nome"), "Ana Souza");
    await usuario.type(screen.getByLabelText("Login"), "ana01");
    await usuario.selectOptions(within(screen.getByRole("dialog")).getByLabelText("Cargo"), "ADMIN");
    await usuario.type(screen.getByLabelText("Senha"), "senha1234");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Funcionário cadastrado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarFuncionarios).toHaveBeenCalledTimes(2);
  });

  it("desativa depois de confirmar, avisa e recarrega", async () => {
    vi.mocked(desativarFuncionario).mockResolvedValue({ ...fulano, ativo: false });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Desativar Fulano Silva" }));
    expect(screen.getByText("Deseja desativar Fulano Silva?")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(desativarFuncionario).toHaveBeenCalledWith("f1");
    expect(await screen.findByText("Funcionário desativado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarFuncionarios).toHaveBeenCalledTimes(2);
  });

  it("mostra o erro 422 num toast e fecha a confirmação", async () => {
    vi.mocked(desativarFuncionario).mockRejectedValue(
      new ApiError(422, "O sistema precisa de pelo menos um administrador ativo"),
    );
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Desativar Fulano Silva" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(
      await screen.findByText("O sistema precisa de pelo menos um administrador ativo"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarFuncionarios).toHaveBeenCalledTimes(1);
  });

  it("reativa uma linha inativa", async () => {
    vi.mocked(reativarFuncionario).mockResolvedValue({ ...beltrana, ativo: true });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Beltrana Souza");

    await usuario.click(screen.getByRole("button", { name: "Reativar Beltrana Souza" }));
    expect(screen.getByRole("dialog", { name: "Reativar funcionário" })).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(reativarFuncionario).toHaveBeenCalledWith("f2");
    expect(await screen.findByText("Funcionário reativado.")).toBeInTheDocument();
  });

  it("cancela a confirmação sem chamar a API", async () => {
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Desativar Fulano Silva" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));

    expect(desativarFuncionario).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("mostra a lista vazia", async () => {
    vi.mocked(listarFuncionarios).mockResolvedValue(pagina([]));
    renderizar();

    expect(await screen.findByText("Nenhum funcionário encontrado")).toBeInTheDocument();
  });

  it("mostra o erro da lista", async () => {
    vi.mocked(listarFuncionarios).mockRejectedValue(new ApiError(500, "Falha ao listar"));
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao listar");
  });

  it("volta para a última página com registros quando a atual fica vazia", async () => {
    // A página 2 esvaziou (ex.: o último ativo dela foi desativado) e sobraram 20 registros.
    vi.mocked(listarFuncionarios).mockImplementation(async ({ page }) =>
      page === 2 ? pagina([], { page: 2, total: 20 }) : pagina([fulano], { total: 40 }),
    );
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Fulano Silva")).toBeInTheDocument();
    expect(listarFuncionarios).toHaveBeenLastCalledWith({ page: 1 });
    expect(screen.queryByText("Nenhum funcionário encontrado")).toBeNull();
  });

  it("tira a tabela antiga quando a lista falha depois de um filtro", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");
    vi.mocked(listarFuncionarios).mockRejectedValue(new ApiError(500, "Falha ao listar"));

    await usuario.selectOptions(screen.getByLabelText("Cargo"), "INSTRUTOR");

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao listar");
    expect(screen.queryByText("Fulano Silva")).toBeNull();
  });

  it("um pedido de desativação que termina tarde não fecha outra confirmação", async () => {
    let terminar: (f: Funcionario) => void = () => {};
    vi.mocked(desativarFuncionario).mockReturnValue(
      new Promise<Funcionario>((resolve) => {
        terminar = resolve;
      }),
    );
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Desativar Fulano Silva" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));
    await usuario.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    await usuario.click(screen.getByRole("button", { name: "Reativar Beltrana Souza" }));
    terminar({ ...fulano, ativo: false });

    expect(await screen.findByText("Funcionário desativado.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Reativar funcionário" })).toBeInTheDocument();
  });

  it("um save que termina tarde não fecha o formulário aberto depois", async () => {
    let terminar: (f: Funcionario) => void = () => {};
    vi.mocked(atualizarFuncionario).mockReturnValue(
      new Promise<Funcionario>((resolve) => {
        terminar = resolve;
      }),
    );
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Editar Fulano Silva" }));
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));
    await usuario.keyboard("{Escape}");
    await usuario.click(screen.getByRole("button", { name: "Editar Beltrana Souza" }));
    terminar(fulano);

    expect(await screen.findByText("Funcionário atualizado.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Editar funcionário" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Beltrana Souza");
  });

  it("mostra Acesso restrito e não chama a API para quem não é ADMIN", () => {
    renderizar({ tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" });

    expect(screen.getByText("Acesso restrito")).toBeInTheDocument();
    expect(listarFuncionarios).not.toHaveBeenCalled();
  });

  it("mostra Acesso restrito para aluno", () => {
    renderizar({ tipo: "ALUNO" });

    expect(screen.getByText("Acesso restrito")).toBeInTheDocument();
    expect(listarFuncionarios).not.toHaveBeenCalled();
  });
});
