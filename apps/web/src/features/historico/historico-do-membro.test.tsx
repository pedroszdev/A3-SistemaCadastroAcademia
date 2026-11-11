import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  listarAtividadesDoMembro,
  listarFuncionariosParaFiltro,
  listarTreinosDoMembro,
  type PaginaAtividades,
  registrarAtividade,
} from "./api";
import { HistoricoDoMembro } from "./historico-do-membro";

vi.mock("@/features/pagamentos/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/pagamentos/api")>()),
  buscarMembros: vi.fn(),
}));

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  listarAtividades: vi.fn(),
  listarAtividadesDoMembro: vi.fn(),
  listarFuncionariosParaFiltro: vi.fn(),
  registrarAtividade: vi.fn(),
  listarTreinosDoMembro: vi.fn(),
  consultarSituacao: vi.fn(),
}));

const esteira: Atividade = {
  id: "a1",
  membroId: "m1",
  funcionarioId: "f1",
  treinoId: "t1",
  atividade: "Esteira",
  data: "2026-11-09T00:00:00.000Z",
  tempoExecucao: 30,
  membro: { id: "m1", nome: "Fulano Silva" },
  funcionario: { id: "f1", nome: "Ana Souza" },
  treino: { id: "t1", tipo: "Hipertrofia" },
};

const supino: Atividade = {
  ...esteira,
  id: "a2",
  membroId: "m2",
  atividade: "Supino",
  membro: { id: "m2", nome: "Beltrana Souza" },
};

function pagina(data: Atividade[]): PaginaAtividades {
  return { data, total: data.length, page: 1, pageSize: 20 };
}

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const recepcionista: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" };
const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };

const onAlterado = vi.fn();

type RaizProps = { membroId: string; usuario: UsuarioDoToken; ativo?: boolean };

function Raiz({ membroId, usuario, ativo = true }: RaizProps) {
  return (
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <HistoricoDoMembro membroId={membroId} ativo={ativo} onAlterado={onAlterado} />
      </ToastProvider>
    </UsuarioProvider>
  );
}

function renderizar(usuario: UsuarioDoToken = admin, membroId = "m1", ativo = true) {
  return render(<Raiz membroId={membroId} usuario={usuario} ativo={ativo} />);
}

describe("HistoricoDoMembro", () => {
  beforeEach(() => {
    vi.mocked(listarAtividades).mockReset();
    vi.mocked(listarAtividadesDoMembro).mockReset();
    vi.mocked(listarFuncionariosParaFiltro).mockReset();
    vi.mocked(registrarAtividade).mockReset();
    vi.mocked(listarTreinosDoMembro).mockReset();
    vi.mocked(consultarSituacao).mockReset();
    vi.mocked(buscarMembros).mockReset();
    onAlterado.mockReset();
    vi.mocked(listarAtividadesDoMembro).mockImplementation(async (membroId) =>
      pagina(membroId === "m1" ? [esteira] : [supino]),
    );
    vi.mocked(listarFuncionariosParaFiltro).mockResolvedValue([{ id: "f1", nome: "Ana Souza" }]);
    vi.mocked(listarTreinosDoMembro).mockResolvedValue([
      { id: "t1", tipo: "Hipertrofia", dataInicio: "2026-10-01T00:00:00.000Z" },
    ]);
    vi.mocked(consultarSituacao).mockResolvedValue({
      situacao: "EM_DIA",
      pagamentosAtrasados: 0,
      maiorAtrasoDias: 0,
    });
  });

  it("lista as atividades pela rota do membro, sem a coluna nem o filtro de Membro", async () => {
    renderizar();

    expect(await screen.findByText("Esteira")).toBeInTheDocument();
    expect(listarAtividadesDoMembro).toHaveBeenCalledWith("m1", { page: 1 });
    expect(listarAtividades).not.toHaveBeenCalled();
    expect(screen.queryByRole("columnheader", { name: "Membro" })).toBeNull();
    expect(screen.queryByLabelText("Membro")).toBeNull();
    for (const titulo of ["Data", "Atividade", "Tempo", "Treino", "Funcionário"]) {
      expect(screen.getByRole("columnheader", { name: titulo })).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Data de")).toBeInTheDocument();
    expect(screen.getByLabelText("Data até")).toBeInTheDocument();
  });

  it("mostra o erro da API quando o membro não existe", async () => {
    vi.mocked(listarAtividadesDoMembro).mockRejectedValue(
      new ApiError(404, "Membro não encontrado"),
    );
    renderizar();

    expect(await screen.findByText("Membro não encontrado")).toBeInTheDocument();
    expect(screen.queryByText("Nenhuma atividade encontrada")).toBeNull();
  });

  it("o ADMIN filtra por funcionário sem perder o membro", async () => {
    const usuario = userEvent.setup();
    renderizar(admin);
    await screen.findByText("Esteira");
    await screen.findByRole("option", { name: "Ana Souza" });

    await usuario.selectOptions(screen.getByLabelText("Funcionário"), "f1");

    expect(listarAtividadesDoMembro).toHaveBeenLastCalledWith("m1", {
      page: 1,
      funcionarioId: "f1",
    });
  });

  it("não mostra o filtro de funcionário para o INSTRUTOR", async () => {
    renderizar(instrutor);
    await screen.findByText("Esteira");

    expect(screen.queryByLabelText("Funcionário")).toBeNull();
    expect(listarFuncionariosParaFiltro).not.toHaveBeenCalled();
  });

  it("mantém o membroId ao filtrar pelo período", async () => {
    renderizar();
    await screen.findByText("Esteira");

    fireEvent.change(screen.getByLabelText("Data de"), { target: { value: "2026-11-01" } });

    expect(listarAtividadesDoMembro).toHaveBeenLastCalledWith("m1", {
      page: 1,
      dataDe: "2026-11-01",
    });
  });

  it("o ADMIN abre o formulário com o membro fixo, carrega treinos e situação e vê o aviso se estiver inadimplente", async () => {
    vi.mocked(consultarSituacao).mockResolvedValue({
      situacao: "INADIMPLENTE",
      pagamentosAtrasados: 2,
      maiorAtrasoDias: 12,
    });
    const usuario = userEvent.setup();
    renderizar(admin);
    await screen.findByText("Esteira");

    await usuario.click(screen.getByRole("button", { name: "Registrar atividade" }));
    const dialogo = screen.getByRole("dialog", { name: "Registrar atividade" });

    expect(within(dialogo).queryByLabelText("Membro")).toBeNull();
    await waitFor(() => expect(listarTreinosDoMembro).toHaveBeenCalledWith("m1"));
    await waitFor(() => expect(consultarSituacao).toHaveBeenCalledWith("m1"));
    expect(await within(dialogo).findByText(/Membro com pagamento em atraso/)).toBeInTheDocument();
    expect(within(dialogo).getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(buscarMembros).not.toHaveBeenCalled();
  });

  it("o INSTRUTOR registra a atividade com o membroId fixo, sem consultar a situação, e avisa a ficha", async () => {
    vi.mocked(registrarAtividade).mockResolvedValue(esteira);
    const usuario = userEvent.setup();
    renderizar(instrutor);
    await screen.findByText("Esteira");

    await usuario.click(screen.getByRole("button", { name: "Registrar atividade" }));
    const dialogo = screen.getByRole("dialog", { name: "Registrar atividade" });
    await usuario.type(within(dialogo).getByLabelText("Atividade"), "Remo");
    await usuario.type(within(dialogo).getByLabelText("Tempo (min)"), "20");
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(registrarAtividade).toHaveBeenCalledWith(
      expect.objectContaining({ membroId: "m1", atividade: "Remo", tempoExecucao: 20 }),
    );
    expect(consultarSituacao).not.toHaveBeenCalled();
    expect(await screen.findByText("Atividade registrada.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(listarAtividadesDoMembro).toHaveBeenCalledTimes(2);
    expect(listarAtividadesDoMembro).toHaveBeenLastCalledWith("m1", { page: 1 });
    expect(onAlterado).toHaveBeenCalledTimes(1);
  });

  it("com o membro inativo, troca Registrar atividade pelo aviso", async () => {
    renderizar(admin, "m1", false);
    await screen.findByText("Esteira");

    expect(screen.queryByRole("button", { name: "Registrar atividade" })).toBeNull();
    expect(screen.getByText("Membro inativo não registra atividade.")).toBeInTheDocument();
  });

  it("a RECEPCIONISTA não vê o botão Registrar atividade", async () => {
    renderizar(recepcionista);
    await screen.findByText("Esteira");

    expect(screen.queryByRole("button", { name: "Registrar atividade" })).toBeNull();
  });

  it("troca a lista pela do novo membro, zera o filtro e não busca os funcionários de novo", async () => {
    const { rerender } = renderizar();
    await screen.findByText("Esteira");
    fireEvent.change(screen.getByLabelText("Data de"), { target: { value: "2026-11-01" } });

    rerender(<Raiz membroId="m2" usuario={admin} />);

    expect(await screen.findByText("Supino")).toBeInTheDocument();
    expect(screen.queryByText("Esteira")).toBeNull();
    expect(listarAtividadesDoMembro).toHaveBeenLastCalledWith("m2", { page: 1 });
    expect(screen.getByLabelText("Data de")).toHaveValue("");
    expect(listarFuncionariosParaFiltro).toHaveBeenCalledTimes(1);
  });

  it("sem membroId não renderiza nada nem chama a API", () => {
    renderizar(admin, "");

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByLabelText("Data de")).toBeNull();
    expect(listarAtividadesDoMembro).not.toHaveBeenCalled();
    expect(listarAtividades).not.toHaveBeenCalled();
  });
});
