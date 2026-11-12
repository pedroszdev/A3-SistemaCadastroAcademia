import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import { criarMembro, listarMembros, type Membro, type PaginaMembros } from "./api";
import { ESPERA_BUSCA_MS, TelaMembros } from "./tela-membros";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  listarMembros: vi.fn(),
  criarMembro: vi.fn(),
}));

const fulano: Membro = {
  id: "m1",
  nome: "Fulano Silva",
  cpf: "52998224725",
  telefone: "48999991234",
  endereco: "Rua das Flores, 100",
  ativo: true,
  dataCadastro: "2026-10-01T00:00:00.000Z",
};
const beltrana: Membro = { ...fulano, id: "m2", nome: "Beltrana Souza", ativo: false };

function pagina(data: Membro[], extra: Partial<PaginaMembros> = {}): PaginaMembros {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };

function renderizar(usuario: UsuarioDoToken = admin) {
  render(
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <TelaMembros />
      </ToastProvider>
    </UsuarioProvider>,
  );
}

describe("TelaMembros", () => {
  beforeEach(() => {
    vi.mocked(listarMembros).mockReset();
    vi.mocked(criarMembro).mockReset();
    vi.mocked(listarMembros).mockResolvedValue(pagina([fulano, beltrana]));
  });

  it("mostra as linhas com CPF, telefone, situação e o link da ficha", async () => {
    renderizar();

    expect(await screen.findByText("Fulano Silva")).toBeInTheDocument();
    expect(screen.getByText("Beltrana Souza")).toBeInTheDocument();
    const linha = screen.getByText("Fulano Silva").closest("tr") as HTMLElement;
    expect(within(linha).getByText("529.982.247-25")).toBeInTheDocument();
    expect(within(linha).getByText("(48) 99999-1234")).toBeInTheDocument();
    expect(within(linha).getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver ficha de Fulano Silva" })).toHaveAttribute(
      "href",
      "/membros/m1",
    );
    expect(listarMembros).toHaveBeenCalledWith({ page: 1 });
  });

  it("mostra o estado vazio", async () => {
    vi.mocked(listarMembros).mockResolvedValue(pagina([]));
    renderizar();

    expect(await screen.findByText("Nenhum membro encontrado")).toBeInTheDocument();
  });

  it("mostra o erro da API", async () => {
    vi.mocked(listarMembros).mockRejectedValue(new ApiError(500, "Falha ao listar"));
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao listar");
  });

  it("filtra por situação voltando para a página 1", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.selectOptions(screen.getByLabelText("Situação"), "false");
    expect(listarMembros).toHaveBeenLastCalledWith({ ativo: false, page: 1 });

    await usuario.selectOptions(screen.getByLabelText("Situação"), "true");
    expect(listarMembros).toHaveBeenLastCalledWith({ ativo: true, page: 1 });

    await usuario.selectOptions(screen.getByLabelText("Situação"), "");
    expect(listarMembros).toHaveBeenLastCalledWith({ ativo: undefined, page: 1 });
  });

  it("pede a página 2 em Próxima", async () => {
    vi.mocked(listarMembros).mockResolvedValue(pagina([fulano], { total: 40 }));
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(listarMembros).toHaveBeenLastCalledWith({ page: 2 });
  });

  it("abre o formulário de cadastro, salva, avisa e recarrega a lista", async () => {
    vi.mocked(criarMembro).mockResolvedValue(fulano);
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Fulano Silva");

    await usuario.click(screen.getByRole("button", { name: "Novo membro" }));
    const dialogo = screen.getByRole("dialog", { name: "Novo membro" });
    expect(within(dialogo).getByLabelText("CPF")).toBeEnabled();
    await usuario.type(within(dialogo).getByLabelText("Nome"), "Ana Pereira");
    await usuario.type(within(dialogo).getByLabelText("CPF"), "52998224725");
    await usuario.type(within(dialogo).getByLabelText("Telefone"), "48999991234");
    await usuario.type(within(dialogo).getByLabelText("Endereço"), "Rua das Flores, 100");
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(criarMembro).toHaveBeenCalledWith({
      nome: "Ana Pereira",
      cpf: "52998224725",
      telefone: "48999991234",
      endereco: "Rua das Flores, 100",
    });
    expect(await screen.findByText("Membro cadastrado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarMembros).toHaveBeenCalledTimes(2);
  });

  it("fecha o formulário em Cancelar", async () => {
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Novo membro" }));
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("esconde o botão Novo membro do INSTRUTOR, que só consulta", async () => {
    renderizar(instrutor);
    await screen.findByText("Fulano Silva");

    expect(screen.queryByRole("button", { name: "Novo membro" })).toBeNull();
  });

  describe("busca", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("só chama a API com ?busca= depois do debounce, e uma vez por pausa", async () => {
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizar();
      await screen.findByText("Fulano Silva");
      vi.mocked(listarMembros).mockClear();

      await usuario.type(screen.getByLabelText("Buscar por nome ou CPF"), "  ana ");
      expect(listarMembros).not.toHaveBeenCalled();

      await act(async () => vi.advanceTimersByTime(ESPERA_BUSCA_MS));

      expect(listarMembros).toHaveBeenCalledTimes(1);
      expect(listarMembros).toHaveBeenCalledWith({ busca: "ana", page: 1 });
    });

    it("limpar a busca volta a listar sem o parâmetro", async () => {
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.type(screen.getByLabelText("Buscar por nome ou CPF"), "ana");
      await act(async () => vi.advanceTimersByTime(ESPERA_BUSCA_MS));
      await usuario.clear(screen.getByLabelText("Buscar por nome ou CPF"));
      await act(async () => vi.advanceTimersByTime(ESPERA_BUSCA_MS));

      expect(listarMembros).toHaveBeenLastCalledWith({ busca: undefined, page: 1 });
    });
  });
});
