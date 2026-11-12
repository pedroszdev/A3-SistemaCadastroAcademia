import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import {
  atualizarMembro,
  consultarResumo,
  desativarMembro,
  listarTreinosDoMembro,
  type Membro,
  reativarMembro,
  type ResumoMembro,
} from "./api";
import { FichaMembro } from "./ficha-membro";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  consultarResumo: vi.fn(),
  listarTreinosDoMembro: vi.fn(),
  desativarMembro: vi.fn(),
  reativarMembro: vi.fn(),
  atualizarMembro: vi.fn(),
}));

type PropsDoMembro = { membroId: string; ativo: boolean; onAlterado?: () => void };

vi.mock("@/features/pagamentos/pagamentos-do-membro", () => ({
  PagamentosDoMembro: ({ membroId, ativo, onAlterado }: PropsDoMembro) => (
    <button type="button" onClick={onAlterado}>
      pagamentos de {membroId} ({ativo ? "ativo" : "inativo"})
    </button>
  ),
}));

vi.mock("@/features/historico/historico-do-membro", () => ({
  HistoricoDoMembro: ({ membroId }: PropsDoMembro) => <p>histórico de {membroId}</p>,
}));

const membro: Membro = {
  id: "m1",
  nome: "Fulano Silva",
  cpf: "52998224725",
  telefone: "48999991234",
  endereco: "Rua das Flores, 100",
  ativo: true,
  dataCadastro: "2026-10-01T00:00:00.000Z",
  acessoLiberado: false,
};

const treino = {
  id: "t1",
  tipo: "Hipertrofia",
  descricao: "Treino de força",
  duracao: 45,
  dataInicio: "2026-11-02T00:00:00.000Z",
};

const resumoCompleto: ResumoMembro = {
  membro,
  situacaoFinanceira: { situacao: "EM_DIA", pagamentosAtrasados: 0, maiorAtrasoDias: 0 },
  treinoMaisRecente: treino,
  atividadesUltimos30Dias: 7,
};

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };

function renderizar(usuario: UsuarioDoToken = admin, membroId = "m1") {
  return render(
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <FichaMembro membroId={membroId} />
      </ToastProvider>
    </UsuarioProvider>,
  );
}

describe("FichaMembro", () => {
  beforeEach(() => {
    vi.mocked(consultarResumo).mockReset();
    vi.mocked(listarTreinosDoMembro).mockReset();
    vi.mocked(desativarMembro).mockReset();
    vi.mocked(reativarMembro).mockReset();
    vi.mocked(atualizarMembro).mockReset();
    vi.mocked(consultarResumo).mockResolvedValue(resumoCompleto);
    vi.mocked(listarTreinosDoMembro).mockResolvedValue({
      data: [{ ...treino, membroId: "m1" }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it("mostra o cabeçalho com os dados, o badge financeiro, o treino e as atividades", async () => {
    renderizar();

    expect(await screen.findByRole("heading", { name: "Fulano Silva" })).toBeInTheDocument();
    expect(consultarResumo).toHaveBeenCalledWith("m1");
    const dados = screen.getByRole("region", { name: "Dados do membro" });
    expect(within(dados).getByText("Ativo")).toBeInTheDocument();
    expect(within(dados).getByText("Em dia")).toBeInTheDocument();
    expect(within(dados).getByText("529.982.247-25")).toBeInTheDocument();
    expect(within(dados).getByText("(48) 99999-1234")).toBeInTheDocument();
    expect(within(dados).getByText("Rua das Flores, 100")).toBeInTheDocument();
    expect(within(dados).getByText("01/10/2026")).toBeInTheDocument();
    expect(
      within(dados).getByText("Hipertrofia · 45 min · início em 02/11/2026"),
    ).toBeInTheDocument();
    expect(within(dados).getByText("7")).toBeInTheDocument();
  });

  it("mostra o badge de inadimplente com o atraso", async () => {
    vi.mocked(consultarResumo).mockResolvedValue({
      ...resumoCompleto,
      situacaoFinanceira: { situacao: "INADIMPLENTE", pagamentosAtrasados: 2, maiorAtrasoDias: 12 },
    });
    renderizar();

    expect(await screen.findByText("Inadimplente · 2 em atraso (até 12 dias)")).toBeInTheDocument();
  });

  it("esconde o badge financeiro e avisa que não há treino quando vêm null", async () => {
    vi.mocked(consultarResumo).mockResolvedValue({
      ...resumoCompleto,
      situacaoFinanceira: null,
      treinoMaisRecente: null,
    });
    renderizar(instrutor);

    await screen.findByRole("heading", { name: "Fulano Silva" });
    expect(screen.queryByText("Em dia")).toBeNull();
    expect(screen.queryByText(/Inadimplente/)).toBeNull();
    expect(screen.getByText("Nenhum treino cadastrado", { selector: "dd" })).toBeInTheDocument();
  });

  it("começa na aba Treinos, só leitura, e troca para Pagamentos e Histórico", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });

    expect(screen.getByRole("tab", { name: "Treinos" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("columnheader", { name: "Duração" })).toBeInTheDocument();
    expect(listarTreinosDoMembro).toHaveBeenCalledWith("m1", { page: 1 });
    const painel = screen.getByRole("tabpanel");
    expect(within(painel).getByText("Hipertrofia")).toBeInTheDocument();
    expect(within(painel).getByText("45 min")).toBeInTheDocument();
    expect(within(painel).getByText("02/11/2026")).toBeInTheDocument();
    expect(within(painel).queryByRole("button", { name: /Editar|Excluir|Novo/ })).toBeNull();

    await usuario.click(screen.getByRole("tab", { name: "Pagamentos" }));
    expect(screen.getByRole("tab", { name: "Pagamentos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("pagamentos de m1 (ativo)")).toBeInTheDocument();

    await usuario.click(screen.getByRole("tab", { name: "Histórico" }));
    expect(screen.getByText("histórico de m1")).toBeInTheDocument();
    expect(screen.queryByText("pagamentos de m1 (ativo)")).toBeNull();
  });

  it("mostra o estado vazio da aba Treinos", async () => {
    vi.mocked(listarTreinosDoMembro).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    renderizar();

    expect(
      await screen.findByText("Nenhum treino cadastrado", { selector: "p" }),
    ).toBeInTheDocument();
  });

  it("recarrega o resumo quando a aba avisa que algo mudou", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });
    await usuario.click(screen.getByRole("tab", { name: "Pagamentos" }));

    await usuario.click(screen.getByRole("button", { name: /pagamentos de m1/ }));

    await waitFor(() => expect(consultarResumo).toHaveBeenCalledTimes(2));
  });

  it("passa ativo=false às abas quando o membro está inativo", async () => {
    vi.mocked(consultarResumo).mockResolvedValue({
      ...resumoCompleto,
      membro: { ...membro, ativo: false },
    });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });

    await usuario.click(screen.getByRole("tab", { name: "Pagamentos" }));

    expect(screen.getByText("pagamentos de m1 (inativo)")).toBeInTheDocument();
  });

  it("mostra o erro quando o resumo falha", async () => {
    vi.mocked(consultarResumo).mockRejectedValue(new ApiError(404, "Membro não encontrado"));
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Membro não encontrado");
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("desativa depois de confirmar, avisa e recarrega o resumo", async () => {
    vi.mocked(desativarMembro).mockResolvedValue({ ...membro, ativo: false });
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });

    await usuario.click(screen.getByRole("button", { name: "Desativar" }));
    const dialogo = screen.getByRole("dialog", { name: "Desativar membro" });
    expect(desativarMembro).not.toHaveBeenCalled();
    await usuario.click(within(dialogo).getByRole("button", { name: "Confirmar" }));

    expect(desativarMembro).toHaveBeenCalledWith("m1");
    expect(await screen.findByText("Membro desativado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(consultarResumo).toHaveBeenCalledTimes(2));
  });

  it("reativa um membro inativo", async () => {
    vi.mocked(consultarResumo).mockResolvedValue({
      ...resumoCompleto,
      membro: { ...membro, ativo: false },
    });
    vi.mocked(reativarMembro).mockResolvedValue(membro);
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });

    await usuario.click(screen.getByRole("button", { name: "Reativar" }));
    await usuario.click(
      within(screen.getByRole("dialog", { name: "Reativar membro" })).getByRole("button", {
        name: "Confirmar",
      }),
    );

    expect(reativarMembro).toHaveBeenCalledWith("m1");
    expect(await screen.findByText("Membro reativado.")).toBeInTheDocument();
  });

  it("mostra o erro da API num aviso quando desativar falha", async () => {
    vi.mocked(desativarMembro).mockRejectedValue(new ApiError(500, "Falha ao desativar"));
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });

    await usuario.click(screen.getByRole("button", { name: "Desativar" }));
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }),
    );

    expect(await screen.findByText("Falha ao desativar")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancela a desativação sem chamar a API", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });

    await usuario.click(screen.getByRole("button", { name: "Desativar" }));
    await usuario.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(desativarMembro).not.toHaveBeenCalled();
  });

  it("edita o membro pelo formulário preenchido e recarrega o resumo", async () => {
    vi.mocked(atualizarMembro).mockResolvedValue(membro);
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    const dialogo = screen.getByRole("dialog", { name: "Editar membro" });
    expect(within(dialogo).getByLabelText("CPF")).toBeDisabled();
    await usuario.clear(within(dialogo).getByLabelText("Nome"));
    await usuario.type(within(dialogo).getByLabelText("Nome"), "Fulano da Silva");
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(atualizarMembro).toHaveBeenCalledWith("m1", {
      nome: "Fulano da Silva",
      telefone: "48999991234",
      endereco: "Rua das Flores, 100",
    });
    expect(await screen.findByText("Membro atualizado.")).toBeInTheDocument();
    await waitFor(() => expect(consultarResumo).toHaveBeenCalledTimes(2));
  });

  it("esconde Editar e Desativar do INSTRUTOR", async () => {
    vi.mocked(consultarResumo).mockResolvedValue({ ...resumoCompleto, situacaoFinanceira: null });
    renderizar(instrutor);
    await screen.findByRole("heading", { name: "Fulano Silva" });

    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Desativar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reativar" })).toBeNull();
  });

  it("busca o resumo do novo membro ao trocar o id", async () => {
    const { rerender } = renderizar();
    await screen.findByRole("heading", { name: "Fulano Silva" });
    vi.mocked(consultarResumo).mockResolvedValue({
      ...resumoCompleto,
      membro: { ...membro, id: "m2", nome: "Beltrana Souza" },
    });

    rerender(
      <UsuarioProvider usuario={admin}>
        <ToastProvider>
          <FichaMembro membroId="m2" />
        </ToastProvider>
      </UsuarioProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Beltrana Souza" })).toBeInTheDocument();
    expect(consultarResumo).toHaveBeenLastCalledWith("m2");
  });
});
