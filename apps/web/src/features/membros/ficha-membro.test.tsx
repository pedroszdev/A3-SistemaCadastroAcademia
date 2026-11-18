import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { listarTreinos, type PaginaTreinos, type Treino } from "@/features/treinos/api";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import {
  buscarMembro,
  consultarResumo,
  desativarMembro,
  type Membro,
  reativarMembro,
  type ResumoMembro,
} from "./api";
import { FichaMembro } from "./ficha-membro";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  buscarMembro: vi.fn(),
  consultarResumo: vi.fn(),
  desativarMembro: vi.fn(),
  reativarMembro: vi.fn(),
}));

vi.mock("@/features/treinos/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/treinos/api")>()),
  listarTreinos: vi.fn(),
}));

vi.mock("./acesso-do-membro", () => ({
  AcessoDoMembro: (props: {
    membroId: string;
    ativo: boolean;
    acessoLiberado: boolean;
    onAlterado?: () => void;
  }) => (
    <div>
      <p>
        acesso {props.membroId} ativo={String(props.ativo)} liberado={String(props.acessoLiberado)}
      </p>
      <button onClick={props.onAlterado}>alterou acesso</button>
    </div>
  ),
}));

vi.mock("@/features/pagamentos/pagamentos-do-membro", () => ({
  PagamentosDoMembro: (props: { membroId: string; ativo: boolean; onAlterado?: () => void }) => (
    <div>
      <p>
        pagamentos {props.membroId} ativo={String(props.ativo)}
      </p>
      <button onClick={props.onAlterado}>alterou pagamento</button>
    </div>
  ),
}));

vi.mock("@/features/historico/historico-do-membro", () => ({
  HistoricoDoMembro: (props: { membroId: string; ativo: boolean; onAlterado?: () => void }) => (
    <div>
      <p>
        historico {props.membroId} ativo={String(props.ativo)}
      </p>
      <button onClick={props.onAlterado}>alterou atividade</button>
    </div>
  ),
}));

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const recepcionista: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" };
const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };

const ana: Membro = {
  id: "m1",
  nome: "Ana Souza",
  cpf: "52998224725",
  telefone: "48999990000",
  endereco: "Rua Fictícia, 100",
  ativo: true,
  dataCadastro: "2026-11-01T00:00:00.000Z",
  acessoLiberado: false,
};

const treinoRecente: Treino = {
  id: "t1",
  membroId: "m1",
  tipo: "Cardio",
  descricao: "Esteira e bicicleta",
  duracao: 45,
  dataInicio: "2026-11-15T00:00:00.000Z",
  membro: { id: "m1", nome: "Ana Souza" },
};

const treinoAntigo: Treino = {
  ...treinoRecente,
  id: "t2",
  tipo: "Musculação",
  duracao: 60,
  dataInicio: "2026-10-01T00:00:00.000Z",
};

function resumo(extra: Partial<ResumoMembro> = {}): ResumoMembro {
  return {
    membro: ana,
    situacaoFinanceira: { situacao: "EM_DIA", pagamentosAtrasados: 0, maiorAtrasoDias: 0 },
    treinoMaisRecente: treinoRecente,
    atividadesUltimos30Dias: 7,
    ...extra,
  };
}

function paginaDeTreinos(data: Treino[], extra: Partial<PaginaTreinos> = {}): PaginaTreinos {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

function elemento(usuario: UsuarioDoToken, id: string) {
  return (
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <FichaMembro id={id} />
      </ToastProvider>
    </UsuarioProvider>
  );
}

function renderizar(usuario: UsuarioDoToken = admin, id = "m1") {
  return render(elemento(usuario, id));
}

async function ficha() {
  await screen.findByRole("heading", { level: 2, name: "Ana Souza" });
}

function botao(nome: string) {
  return screen.queryByRole("button", { name: nome });
}

describe("FichaMembro", () => {
  beforeEach(() => {
    vi.mocked(consultarResumo).mockReset();
    vi.mocked(consultarResumo).mockResolvedValue(resumo());
    vi.mocked(buscarMembro).mockReset();
    vi.mocked(buscarMembro).mockResolvedValue(ana);
    vi.mocked(desativarMembro).mockReset();
    vi.mocked(reativarMembro).mockReset();
    vi.mocked(listarTreinos).mockReset();
    vi.mocked(listarTreinos).mockResolvedValue(paginaDeTreinos([treinoRecente, treinoAntigo]));
  });

  describe("cabeçalho", () => {
    it("mostra os dados e o resumo para o ADMIN", async () => {
      renderizar();
      expect(screen.getByText("Carregando…")).toBeInTheDocument();
      await ficha();

      expect(consultarResumo).toHaveBeenCalledWith("m1");
      expect(buscarMembro).not.toHaveBeenCalled();
      expect(screen.getByText("529.982.247-25")).toBeInTheDocument();
      expect(screen.getByText("(48) 99999-0000")).toBeInTheDocument();
      expect(screen.getByText("Rua Fictícia, 100")).toBeInTheDocument();
      expect(screen.getByText("01/11/2026")).toBeInTheDocument();
      expect(screen.getByText("Ativo")).toBeInTheDocument();
      expect(screen.getByText("Em dia")).toBeInTheDocument();
      expect(screen.getByText("Cardio, 45 min, início em 15/11/2026")).toBeInTheDocument();
      expect(screen.getByText("7 atividades nos últimos 30 dias")).toBeInTheDocument();
      expect(screen.queryByText(/em atraso/)).not.toBeInTheDocument();
    });

    it("mostra o badge inadimplente com a quantidade e o maior atraso", async () => {
      vi.mocked(consultarResumo).mockResolvedValue(
        resumo({
          situacaoFinanceira: {
            situacao: "INADIMPLENTE",
            pagamentosAtrasados: 2,
            maiorAtrasoDias: 15,
          },
        }),
      );
      renderizar(recepcionista);
      await ficha();

      expect(screen.getByText("Inadimplente")).toBeInTheDocument();
      expect(screen.queryByText("Em dia")).not.toBeInTheDocument();
      expect(screen.getByText("2 em atraso, maior atraso de 15 dias")).toBeInTheDocument();
    });

    it("usa o singular com 1 dia de atraso e 1 atividade", async () => {
      vi.mocked(consultarResumo).mockResolvedValue(
        resumo({
          situacaoFinanceira: { situacao: "EM_DIA", pagamentosAtrasados: 1, maiorAtrasoDias: 1 },
          atividadesUltimos30Dias: 1,
        }),
      );
      renderizar();
      await ficha();

      expect(screen.getByText("1 em atraso, maior atraso de 1 dia")).toBeInTheDocument();
      expect(screen.getByText("1 atividade nos últimos 30 dias")).toBeInTheDocument();
    });

    it("mostra Nenhum treino e o badge Inativo", async () => {
      vi.mocked(consultarResumo).mockResolvedValue(
        resumo({ membro: { ...ana, ativo: false }, treinoMaisRecente: null }),
      );
      renderizar();
      await ficha();

      expect(screen.getByText("Nenhum treino")).toBeInTheDocument();
      expect(screen.getByText("Inativo")).toBeInTheDocument();
    });

    it("INSTRUTOR não chama o resumo, usa o primeiro treino da lista e não vê situação nem atividades", async () => {
      renderizar(instrutor);
      await ficha();

      expect(consultarResumo).not.toHaveBeenCalled();
      expect(buscarMembro).toHaveBeenCalledWith("m1");
      expect(listarTreinos).toHaveBeenCalledWith({ membroId: "m1", page: 1 });
      expect(screen.getByText("Cardio, 45 min, início em 15/11/2026")).toBeInTheDocument();
      expect(screen.queryByText("Em dia")).not.toBeInTheDocument();
      expect(screen.queryByText("Inadimplente")).not.toBeInTheDocument();
      expect(screen.queryByText(/atividades? nos últimos/)).not.toBeInTheDocument();
    });

    it("INSTRUTOR sem treinos mostra Nenhum treino", async () => {
      vi.mocked(listarTreinos).mockResolvedValue(paginaDeTreinos([]));
      renderizar(instrutor);
      await ficha();

      expect(screen.getByText("Nenhum treino")).toBeInTheDocument();
    });

    it("encaixa o AcessoDoMembro com os dados do membro e recarrega quando ele altera", async () => {
      renderizar();
      await ficha();

      expect(screen.getByText("acesso m1 ativo=true liberado=false")).toBeInTheDocument();
      await userEvent.click(botao("alterou acesso")!);

      await waitFor(() => expect(consultarResumo).toHaveBeenCalledTimes(2));
    });
  });

  describe("editar, desativar e reativar", () => {
    it.each([
      ["ADMIN", admin],
      ["RECEPCIONISTA", recepcionista],
    ])("%s vê Editar com o link da edição e Desativar", async (_cargo, usuario) => {
      renderizar(usuario);
      await ficha();

      expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
        "href",
        "/membros/m1/editar",
      );
      expect(botao("Desativar")).toBeInTheDocument();
      expect(botao("Reativar")).not.toBeInTheDocument();
    });

    it("INSTRUTOR não vê Editar, Desativar nem Reativar", async () => {
      renderizar(instrutor);
      await ficha();

      expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
      expect(botao("Desativar")).not.toBeInTheDocument();
      expect(botao("Reativar")).not.toBeInTheDocument();
    });

    it("membro inativo mostra Reativar no lugar de Desativar", async () => {
      vi.mocked(consultarResumo).mockResolvedValue(resumo({ membro: { ...ana, ativo: false } }));
      renderizar();
      await ficha();

      expect(botao("Reativar")).toBeInTheDocument();
      expect(botao("Desativar")).not.toBeInTheDocument();
    });

    it("desativa depois da confirmação, avisa e recarrega sem voltar para Carregando", async () => {
      vi.mocked(desativarMembro).mockResolvedValue({ ...ana, ativo: false });
      vi.mocked(consultarResumo)
        .mockResolvedValueOnce(resumo())
        .mockResolvedValueOnce(resumo({ membro: { ...ana, ativo: false } }));
      renderizar();
      await ficha();

      await userEvent.click(botao("Desativar")!);
      const dialogo = screen.getByRole("dialog", { name: "Desativar membro" });
      expect(desativarMembro).not.toHaveBeenCalled();
      await userEvent.click(within(dialogo).getByRole("button", { name: "Confirmar" }));

      expect(desativarMembro).toHaveBeenCalledWith("m1");
      expect(await screen.findByText("Membro desativado.")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText("Carregando…")).not.toBeInTheDocument();
      expect(await screen.findByRole("button", { name: "Reativar" })).toBeInTheDocument();
      expect(consultarResumo).toHaveBeenCalledTimes(2);
    });

    it("reativa depois da confirmação", async () => {
      vi.mocked(reativarMembro).mockResolvedValue(ana);
      vi.mocked(consultarResumo)
        .mockResolvedValueOnce(resumo({ membro: { ...ana, ativo: false } }))
        .mockResolvedValueOnce(resumo());
      renderizar();
      await ficha();

      await userEvent.click(botao("Reativar")!);
      const dialogo = screen.getByRole("dialog", { name: "Reativar membro" });
      await userEvent.click(within(dialogo).getByRole("button", { name: "Confirmar" }));

      expect(reativarMembro).toHaveBeenCalledWith("m1");
      expect(await screen.findByText("Membro reativado.")).toBeInTheDocument();
      expect(await screen.findByRole("button", { name: "Desativar" })).toBeInTheDocument();
    });

    it("Cancelar fecha a confirmação sem chamar a API", async () => {
      renderizar();
      await ficha();

      await userEvent.click(botao("Desativar")!);
      await userEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }),
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(desativarMembro).not.toHaveBeenCalled();
    });

    it("mostra o erro da API num toast e mantém a ficha", async () => {
      vi.mocked(desativarMembro).mockRejectedValue(new ApiError(500, "Falha ao desativar"));
      renderizar();
      await ficha();

      await userEvent.click(botao("Desativar")!);
      await userEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }),
      );

      expect(await screen.findByText("Falha ao desativar")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(consultarResumo).toHaveBeenCalledTimes(1);
      expect(botao("Desativar")).toBeInTheDocument();
    });
  });

  describe("abas", () => {
    it("segue o padrão WAI-ARIA, com Treinos ativa no início", async () => {
      renderizar();
      await ficha();

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      const abas = screen.getAllByRole("tab");
      expect(abas.map((a) => a.textContent)).toEqual(["Treinos", "Pagamentos", "Histórico"]);
      expect(abas.map((a) => a.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
      expect(abas.map((a) => a.tabIndex)).toEqual([0, -1, -1]);
      expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", abas[0].id);
      expect(abas[0]).toHaveAttribute("aria-controls", screen.getByRole("tabpanel").id);
    });

    it("troca de aba ao clicar e passa membroId, ativo e onAlterado aos componentes", async () => {
      renderizar();
      await ficha();

      await userEvent.click(screen.getByRole("tab", { name: "Pagamentos" }));
      expect(screen.getByRole("tab", { name: "Pagamentos" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByText("pagamentos m1 ativo=true")).toBeInTheDocument();
      await userEvent.click(botao("alterou pagamento")!);
      await waitFor(() => expect(consultarResumo).toHaveBeenCalledTimes(2));

      await userEvent.click(screen.getByRole("tab", { name: "Histórico" }));
      expect(screen.getByText("historico m1 ativo=true")).toBeInTheDocument();
      expect(screen.queryByText("pagamentos m1 ativo=true")).not.toBeInTheDocument();
      await userEvent.click(botao("alterou atividade")!);
      await waitFor(() => expect(consultarResumo).toHaveBeenCalledTimes(3));
    });

    it("mantém a aba escolhida quando a ficha recarrega", async () => {
      renderizar();
      await ficha();

      await userEvent.click(screen.getByRole("tab", { name: "Histórico" }));
      await userEvent.click(botao("alterou atividade")!);
      await waitFor(() => expect(consultarResumo).toHaveBeenCalledTimes(2));

      expect(screen.getByRole("tab", { name: "Histórico" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByText("historico m1 ativo=true")).toBeInTheDocument();
    });

    it("as setas trocam de aba, levam o foco e dão a volta nas pontas", async () => {
      renderizar();
      await ficha();
      const [treinos, pagamentos, historico] = screen.getAllByRole("tab");

      treinos.focus();
      await userEvent.keyboard("{ArrowRight}");
      expect(pagamentos).toHaveFocus();
      expect(pagamentos).toHaveAttribute("aria-selected", "true");
      expect(pagamentos.tabIndex).toBe(0);
      expect(treinos.tabIndex).toBe(-1);

      await userEvent.keyboard("{ArrowRight}");
      expect(historico).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      expect(treinos).toHaveFocus();
      expect(treinos).toHaveAttribute("aria-selected", "true");

      await userEvent.keyboard("{ArrowLeft}");
      expect(historico).toHaveFocus();
      expect(historico).toHaveAttribute("aria-selected", "true");
    });

    it("outras teclas não trocam de aba", async () => {
      renderizar();
      await ficha();
      const [treinos] = screen.getAllByRole("tab");

      treinos.focus();
      await userEvent.keyboard("{ArrowDown}");

      expect(treinos).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("aba Treinos", () => {
    it("lista os treinos do membro com tipo, duração e início", async () => {
      renderizar();
      await ficha();

      const painel = screen.getByRole("tabpanel");
      expect(await within(painel).findByText("Musculação")).toBeInTheDocument();
      expect(listarTreinos).toHaveBeenCalledWith({ membroId: "m1", page: 1 });
      expect(within(painel).getByText("45 min")).toBeInTheDocument();
      expect(within(painel).getByText("15/11/2026")).toBeInTheDocument();
      expect(within(painel).getByText("60 min")).toBeInTheDocument();
      expect(within(painel).getByText("01/10/2026")).toBeInTheDocument();
    });

    it("mostra o estado vazio", async () => {
      vi.mocked(listarTreinos).mockResolvedValue(paginaDeTreinos([]));
      renderizar();
      await ficha();

      expect(await screen.findByText("Nenhum treino cadastrado")).toBeInTheDocument();
    });

    it("mostra o erro da API", async () => {
      vi.mocked(listarTreinos).mockRejectedValue(new ApiError(500, "Falha ao listar treinos"));
      renderizar();
      await ficha();

      expect(await screen.findByText("Falha ao listar treinos")).toBeInTheDocument();
    });

    it("pagina chamando a API com o membroId e a página pedida", async () => {
      vi.mocked(listarTreinos).mockResolvedValue(paginaDeTreinos([treinoRecente], { total: 45 }));
      renderizar();
      await ficha();
      await userEvent.click(await screen.findByRole("button", { name: "Próxima" }));

      await waitFor(() =>
        expect(listarTreinos).toHaveBeenLastCalledWith({ membroId: "m1", page: 2 }),
      );
    });
  });

  describe("estados da carga", () => {
    it.each([404, 400])("%i mostra Membro não encontrado com o link de volta", async (status) => {
      vi.mocked(consultarResumo).mockRejectedValue(new ApiError(status, "Membro não encontrado"));
      renderizar();

      expect(await screen.findByText("Membro não encontrado")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Voltar para membros" })).toHaveAttribute(
        "href",
        "/membros",
      );
    });

    it("INSTRUTOR com 404 também mostra Membro não encontrado", async () => {
      vi.mocked(buscarMembro).mockRejectedValue(new ApiError(404, "Membro não encontrado"));
      renderizar(instrutor);

      expect(await screen.findByText("Membro não encontrado")).toBeInTheDocument();
    });

    it("mostra a mensagem do erro e tenta de novo", async () => {
      vi.mocked(consultarResumo)
        .mockRejectedValueOnce(new ApiError(500, "Falha ao carregar"))
        .mockResolvedValueOnce(resumo());
      renderizar();

      expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao carregar");
      expect(screen.getByRole("link", { name: "Voltar para membros" })).toHaveAttribute(
        "href",
        "/membros",
      );
      await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

      await ficha();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("carrega o membro novo quando o id da rota muda", async () => {
      const { rerender } = renderizar(admin, "m1");
      await ficha();

      vi.mocked(consultarResumo).mockResolvedValue(
        resumo({ membro: { ...ana, id: "m2", nome: "Beto Lima" } }),
      );
      rerender(elemento(admin, "m2"));

      expect(
        await screen.findByRole("heading", { level: 2, name: "Beto Lima" }),
      ).toBeInTheDocument();
      expect(consultarResumo).toHaveBeenLastCalledWith("m2");
    });
  });
});
