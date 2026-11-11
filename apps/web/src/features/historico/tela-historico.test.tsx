import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { buscarMembros } from "@/features/pagamentos/api";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import {
  type Atividade,
  consultarSituacao,
  listarAtividades,
  listarFuncionariosParaFiltro,
  listarTreinosDoMembro,
  type PaginaAtividades,
  registrarAtividade,
} from "./api";
import { TelaHistorico } from "./tela-historico";

vi.mock("@/features/pagamentos/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/pagamentos/api")>()),
  buscarMembros: vi.fn(),
}));

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  listarAtividades: vi.fn(),
  listarFuncionariosParaFiltro: vi.fn(),
  registrarAtividade: vi.fn(),
  listarTreinosDoMembro: vi.fn(),
  consultarSituacao: vi.fn(),
}));

function atividade(id: string, extra: Partial<Atividade> = {}): Atividade {
  return {
    id,
    membroId: `m-${id}`,
    funcionarioId: "f1",
    treinoId: null,
    atividade: "Esteira",
    data: "2026-11-09T00:00:00.000Z",
    tempoExecucao: 30,
    membro: { id: `m-${id}`, nome: "Fulano Silva" },
    funcionario: { id: "f1", nome: "Ana Souza" },
    treino: null,
    ...extra,
  };
}

const comTreino = atividade("a1", {
  treinoId: "t1",
  treino: { id: "t1", tipo: "Hipertrofia" },
});
const semTreino = atividade("a2", {
  membro: { id: "m-a2", nome: "Beltrana Souza" },
  funcionario: { id: "f2", nome: "Carlos Lima" },
  atividade: "Supino",
  data: "2026-11-08T00:00:00.000Z",
  tempoExecucao: 45,
});

function pagina(data: Atividade[], extra: Partial<PaginaAtividades> = {}): PaginaAtividades {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const recepcionista: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" };
const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };

function renderizar(usuario: UsuarioDoToken = admin) {
  render(
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <TelaHistorico />
      </ToastProvider>
    </UsuarioProvider>,
  );
}

function linhaDe(texto: string): HTMLElement {
  return screen.getByText(texto).closest("tr") as HTMLElement;
}

async function abrirFormEPreencher(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(screen.getByRole("button", { name: "Registrar atividade" }));
  const dialogo = screen.getByRole("dialog", { name: "Registrar atividade" });
  await usuario.type(within(dialogo).getByLabelText("Membro"), "Eli");
  await usuario.click(await within(dialogo).findByRole("button", { name: /Eliana Prado/ }));
  await usuario.type(within(dialogo).getByLabelText("Atividade"), "Remo");
  await usuario.type(within(dialogo).getByLabelText("Tempo (min)"), "20");
  return dialogo;
}

describe("TelaHistorico", () => {
  beforeEach(() => {
    vi.mocked(listarAtividades).mockReset();
    vi.mocked(listarFuncionariosParaFiltro).mockReset();
    vi.mocked(registrarAtividade).mockReset();
    vi.mocked(listarTreinosDoMembro).mockReset();
    vi.mocked(consultarSituacao).mockReset();
    vi.mocked(buscarMembros).mockReset();
    vi.mocked(listarAtividades).mockResolvedValue(pagina([comTreino, semTreino]));
    vi.mocked(listarFuncionariosParaFiltro).mockResolvedValue([
      { id: "f1", nome: "Ana Souza" },
      { id: "f2", nome: "Carlos Lima" },
    ]);
    vi.mocked(listarTreinosDoMembro).mockResolvedValue([]);
    vi.mocked(consultarSituacao).mockResolvedValue({
      situacao: "EM_DIA",
      pagamentosAtrasados: 0,
      maiorAtrasoDias: 0,
    });
    vi.mocked(buscarMembros).mockResolvedValue({
      membros: [{ id: "m1", nome: "Fulano Silva", cpf: "12345678909" }],
      total: 1,
    });
  });

  it("mostra a tabela com data, membro, atividade, tempo, treino e funcionário", async () => {
    renderizar();

    expect(await screen.findByText("Esteira")).toBeInTheDocument();
    for (const titulo of ["Data", "Membro", "Atividade", "Tempo", "Treino", "Funcionário"]) {
      expect(screen.getByRole("columnheader", { name: titulo })).toBeInTheDocument();
    }
    expect(listarAtividades).toHaveBeenCalledWith({ page: 1 });

    const primeira = within(linhaDe("Esteira"));
    expect(primeira.getByText("09/11/2026")).toBeInTheDocument();
    expect(primeira.getByText("Fulano Silva")).toBeInTheDocument();
    expect(primeira.getByText("30 min")).toBeInTheDocument();
    expect(primeira.getByText("Hipertrofia")).toBeInTheDocument();
    expect(primeira.getByText("Ana Souza")).toBeInTheDocument();

    const segunda = within(linhaDe("Supino"));
    expect(segunda.getByText("08/11/2026")).toBeInTheDocument();
    expect(segunda.getByText("Beltrana Souza")).toBeInTheDocument();
    expect(segunda.getByText("45 min")).toBeInTheDocument();
    expect(segunda.getByText("—")).toBeInTheDocument();
    expect(segunda.getByText("Carlos Lima")).toBeInTheDocument();
  });

  it("mostra a lista vazia", async () => {
    vi.mocked(listarAtividades).mockResolvedValue(pagina([]));
    renderizar();

    expect(await screen.findByText("Nenhuma atividade encontrada")).toBeInTheDocument();
  });

  it("mostra a mensagem da API quando a lista falha", async () => {
    vi.mocked(listarAtividades).mockRejectedValue(
      new ApiError(400, "dataAte não pode ser anterior a dataDe"),
    );
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "dataAte não pode ser anterior a dataDe",
    );
  });

  it("tira a tabela antiga quando a lista falha depois de um filtro", async () => {
    renderizar();
    await screen.findByText("Esteira");
    vi.mocked(listarAtividades).mockRejectedValue(new ApiError(500, "Falha ao listar"));

    fireEvent.change(screen.getByLabelText("Data de"), { target: { value: "2026-11-01" } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao listar");
    expect(screen.queryByText("Esteira")).toBeNull();
  });

  it("com o período invertido mostra o erro, não busca e mantém a tabela", async () => {
    renderizar();
    await screen.findByText("Esteira");

    fireEvent.change(screen.getByLabelText("Data até"), { target: { value: "2026-11-01" } });
    expect(listarAtividades).toHaveBeenLastCalledWith({ dataAte: "2026-11-01", page: 1 });
    const chamadas = vi.mocked(listarAtividades).mock.calls.length;

    fireEvent.change(screen.getByLabelText("Data de"), { target: { value: "2026-11-30" } });

    expect(screen.getByText("dataAte não pode ser anterior a dataDe")).toBeInTheDocument();
    expect(screen.getByLabelText("Data de")).toHaveValue("2026-11-30");
    expect(listarAtividades).toHaveBeenCalledTimes(chamadas);
    expect(screen.getByText("Esteira")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Data de"), { target: { value: "2026-10-01" } });

    expect(screen.queryByText("dataAte não pode ser anterior a dataDe")).toBeNull();
    expect(listarAtividades).toHaveBeenLastCalledWith({
      dataDe: "2026-10-01",
      dataAte: "2026-11-01",
      page: 1,
    });
  });

  it("filtra por membro, incluindo inativos, e limpa o filtro em Trocar", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Esteira");

    await usuario.type(screen.getByLabelText("Membro"), "Fu");
    await usuario.click(await screen.findByRole("button", { name: /Fulano Silva · / }));

    expect(buscarMembros).toHaveBeenCalledWith("Fu", { incluirInativos: true });
    expect(listarAtividades).toHaveBeenLastCalledWith({ membroId: "m1", page: 1 });

    await usuario.click(screen.getByRole("button", { name: "Trocar" }));

    expect(listarAtividades).toHaveBeenLastCalledWith({ membroId: undefined, page: 1 });
  });

  it("filtra pelo período, cruza min e max e volta para a página 1", async () => {
    vi.mocked(listarAtividades).mockResolvedValue(pagina([comTreino], { total: 40 }));
    renderizar();
    await screen.findByText("Esteira");
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(listarAtividades).toHaveBeenLastCalledWith({ page: 2 });

    fireEvent.change(screen.getByLabelText("Data de"), { target: { value: "2026-11-01" } });
    expect(listarAtividades).toHaveBeenLastCalledWith({ dataDe: "2026-11-01", page: 1 });
    expect(screen.getByLabelText("Data até")).toHaveAttribute("min", "2026-11-01");

    fireEvent.change(screen.getByLabelText("Data até"), { target: { value: "2026-11-30" } });
    expect(listarAtividades).toHaveBeenLastCalledWith({
      dataDe: "2026-11-01",
      dataAte: "2026-11-30",
      page: 1,
    });
    expect(screen.getByLabelText("Data de")).toHaveAttribute("max", "2026-11-30");

    fireEvent.change(screen.getByLabelText("Data de"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Data até"), { target: { value: "" } });
    expect(listarAtividades).toHaveBeenLastCalledWith({
      dataDe: undefined,
      dataAte: undefined,
      page: 1,
    });
  });

  it("o ADMIN filtra por funcionário e limpa o filtro", async () => {
    const usuario = userEvent.setup();
    renderizar(admin);
    await screen.findByText("Esteira");

    const filtro = await screen.findByLabelText("Funcionário");
    await waitFor(() => expect(within(filtro).getAllByRole("option")).toHaveLength(3));
    await usuario.selectOptions(filtro, "f2");
    expect(listarAtividades).toHaveBeenLastCalledWith({ funcionarioId: "f2", page: 1 });

    await usuario.selectOptions(filtro, "");
    expect(listarAtividades).toHaveBeenLastCalledWith({ funcionarioId: undefined, page: 1 });
  });

  it("deixa o filtro de funcionário só com Todos quando o carregamento falha", async () => {
    vi.mocked(listarFuncionariosParaFiltro).mockRejectedValue(new ApiError(500, "Falha"));
    renderizar(admin);
    await screen.findByText("Esteira");

    await waitFor(() => expect(listarFuncionariosParaFiltro).toHaveBeenCalled());

    const opcoes = within(screen.getByLabelText("Funcionário")).getAllByRole("option");
    expect(opcoes.map((o) => o.textContent)).toEqual(["Todos"]);
  });

  it.each([
    ["RECEPCIONISTA", recepcionista],
    ["INSTRUTOR", instrutor],
  ])("o %s não vê o filtro de funcionário nem chama /funcionarios", async (_cargo, usuarioLogado) => {
    renderizar(usuarioLogado);
    await screen.findByText("Esteira");

    expect(screen.queryByLabelText("Funcionário")).toBeNull();
    expect(listarFuncionariosParaFiltro).not.toHaveBeenCalled();
  });

  it.each([
    ["ADMIN", admin],
    ["INSTRUTOR", instrutor],
  ])("o %s vê o botão Registrar atividade", async (_cargo, usuarioLogado) => {
    renderizar(usuarioLogado);
    await screen.findByText("Esteira");

    expect(screen.getByRole("button", { name: "Registrar atividade" })).toBeInTheDocument();
  });

  it("a RECEPCIONISTA não vê o botão Registrar atividade", async () => {
    renderizar(recepcionista);
    await screen.findByText("Esteira");

    expect(screen.queryByRole("button", { name: "Registrar atividade" })).toBeNull();
  });

  it("pede a página 2 em Próxima", async () => {
    vi.mocked(listarAtividades).mockResolvedValue(pagina([comTreino], { total: 40 }));
    renderizar();
    await screen.findByText("Esteira");

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(listarAtividades).toHaveBeenLastCalledWith({ page: 2 });
  });

  it("volta para a última página com registros quando a atual fica vazia", async () => {
    vi.mocked(listarAtividades).mockImplementation(async ({ page }) =>
      page === 2 ? pagina([], { page: 2, total: 20 }) : pagina([comTreino], { total: 40 }),
    );
    renderizar();
    await screen.findByText("Esteira");

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Esteira")).toBeInTheDocument();
    expect(listarAtividades).toHaveBeenLastCalledWith({ page: 1 });
    expect(screen.queryByText("Nenhuma atividade encontrada")).toBeNull();
  });

  it("abre o formulário e fecha em Cancelar sem chamar a API", async () => {
    const usuario = userEvent.setup();
    renderizar(instrutor);
    await screen.findByText("Esteira");

    await usuario.click(screen.getByRole("button", { name: "Registrar atividade" }));
    const dialogo = screen.getByRole("dialog", { name: "Registrar atividade" });
    expect(within(dialogo).getByLabelText("Atividade")).toBeInTheDocument();
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(registrarAtividade).not.toHaveBeenCalled();
  });

  it("registra a atividade, avisa, fecha o formulário e recarrega a lista", async () => {
    vi.mocked(buscarMembros).mockResolvedValue({
      membros: [{ id: "m-novo", nome: "Eliana Prado", cpf: "11122233396" }],
      total: 1,
    });
    vi.mocked(registrarAtividade).mockResolvedValue(atividade("a9"));
    const usuario = userEvent.setup();
    renderizar(instrutor);
    await screen.findByText("Esteira");

    const dialogo = await abrirFormEPreencher(usuario);
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(registrarAtividade).toHaveBeenCalledWith(
      expect.objectContaining({ membroId: "m-novo", atividade: "Remo", tempoExecucao: 20 }),
    );
    expect(await screen.findByText("Atividade registrada.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarAtividades).toHaveBeenCalledTimes(2);
  });

  it("não deixa fechar o formulário enquanto a atividade é enviada", async () => {
    vi.mocked(buscarMembros).mockResolvedValue({
      membros: [{ id: "m-novo", nome: "Eliana Prado", cpf: "11122233396" }],
      total: 1,
    });
    let terminar: (a: Atividade) => void = () => {};
    vi.mocked(registrarAtividade).mockReturnValue(
      new Promise<Atividade>((resolve) => {
        terminar = resolve;
      }),
    );
    const usuario = userEvent.setup();
    renderizar(instrutor);
    await screen.findByText("Esteira");

    const dialogo = await abrirFormEPreencher(usuario);
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(within(dialogo).getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await usuario.keyboard("{Escape}");
    await usuario.click(screen.getByTestId("dialog-overlay"));
    expect(screen.getByRole("dialog", { name: "Registrar atividade" })).toBeInTheDocument();

    await act(async () => terminar(atividade("a9")));

    expect(await screen.findByText("Atividade registrada.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("volta a deixar fechar o formulário quando o registro falha", async () => {
    vi.mocked(buscarMembros).mockResolvedValue({
      membros: [{ id: "m-novo", nome: "Eliana Prado", cpf: "11122233396" }],
      total: 1,
    });
    vi.mocked(registrarAtividade).mockRejectedValue(new ApiError(422, "Membro inativo"));
    const usuario = userEvent.setup();
    renderizar(instrutor);
    await screen.findByText("Esteira");

    const dialogo = await abrirFormEPreencher(usuario);
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(await within(dialogo).findByRole("alert")).toHaveTextContent("Membro inativo");
    await usuario.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
