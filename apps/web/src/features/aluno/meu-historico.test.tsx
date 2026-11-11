import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type AtividadeDoAluno,
  type PaginaAtividades,
  type ResumoDoPeriodo,
  buscarResumoDoPeriodo,
  listarMinhasAtividades,
} from "./historico";
import { MeuHistorico } from "./meu-historico";
import { type Periodo, intervaloDoPeriodo } from "./periodo";

vi.mock("./historico", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./historico")>()),
  buscarResumoDoPeriodo: vi.fn(),
  listarMinhasAtividades: vi.fn(),
}));

vi.mock("./periodo", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./periodo")>()),
  intervaloDoPeriodo: vi.fn(),
}));

const INTERVALOS = {
  "7dias": { dataDe: "2026-11-03", dataAte: "2026-11-09" },
  "30dias": { dataDe: "2026-10-11", dataAte: "2026-11-09" },
  mes: { dataDe: "2026-11-01", dataAte: "2026-11-09" },
};

const resumo: ResumoDoPeriodo = { totalAtividades: 7, totalMinutos: 320 };

function atividade(n: number): AtividadeDoAluno {
  return {
    id: `a${n}`,
    treinoId: null,
    atividade: `Atividade ${n}`,
    data: "2026-11-05T00:00:00.000Z",
    tempoExecucao: 30,
    funcionario: { nome: "Carlos Lima" },
    treino: null,
  };
}

function pagina(itens: AtividadeDoAluno[], total = itens.length): PaginaAtividades {
  return { data: itens, total, page: 1, pageSize: 20 };
}

function atividades(quantidade: number) {
  return Array.from({ length: quantidade }, (_, i) => atividade(i + 1));
}

function botao(nome: string) {
  return screen.getByRole("button", { name: nome });
}

describe("MeuHistorico", () => {
  beforeEach(() => {
    vi.mocked(buscarResumoDoPeriodo).mockReset();
    vi.mocked(listarMinhasAtividades).mockReset();
    vi.mocked(intervaloDoPeriodo)
      .mockReset()
      .mockImplementation((periodo: Periodo) => INTERVALOS[periodo]);
  });

  it("mostra Carregando… enquanto espera a API", () => {
    vi.mocked(buscarResumoDoPeriodo).mockReturnValue(new Promise(() => {}));
    vi.mocked(listarMinhasAtividades).mockReturnValue(new Promise(() => {}));

    render(<MeuHistorico />);

    expect(screen.getByText("Carregando…")).toBeInTheDocument();
  });

  it("começa nos 30 dias e mostra os totais e as atividades", async () => {
    vi.mocked(buscarResumoDoPeriodo).mockResolvedValue(resumo);
    vi.mocked(listarMinhasAtividades).mockResolvedValue(pagina(atividades(2)));

    render(<MeuHistorico />);

    expect(await screen.findByText("Atividade 1")).toBeInTheDocument();
    expect(screen.getByText("Atividade 2")).toBeInTheDocument();
    expect(screen.getByText("Atividades", { selector: "dt" }).nextElementSibling?.textContent).toBe("7");
    expect(screen.getByText("Minutos").nextElementSibling?.textContent).toBe("320");
    expect(buscarResumoDoPeriodo).toHaveBeenCalledWith(INTERVALOS["30dias"]);
    expect(listarMinhasAtividades).toHaveBeenCalledWith(INTERVALOS["30dias"], 1);
    expect(botao("30 dias")).toHaveAttribute("aria-pressed", "true");
    expect(botao("7 dias")).toHaveAttribute("aria-pressed", "false");
    expect(botao("Mês atual")).toHaveAttribute("aria-pressed", "false");
  });

  it.each<[string, Periodo]>([
    ["7 dias", "7dias"],
    ["Mês atual", "mes"],
  ])("ao escolher %s busca resumo e lista com as datas do período", async (rotulo, periodo) => {
    vi.mocked(buscarResumoDoPeriodo).mockResolvedValue(resumo);
    vi.mocked(listarMinhasAtividades).mockResolvedValue(pagina(atividades(1)));
    const user = userEvent.setup();
    render(<MeuHistorico />);
    await screen.findByText("Atividade 1");

    await user.click(botao(rotulo));

    expect(await screen.findByText("Atividade 1")).toBeInTheDocument();
    expect(buscarResumoDoPeriodo).toHaveBeenLastCalledWith(INTERVALOS[periodo]);
    expect(listarMinhasAtividades).toHaveBeenLastCalledWith(INTERVALOS[periodo], 1);
    expect(botao(rotulo)).toHaveAttribute("aria-pressed", "true");
    expect(botao("30 dias")).toHaveAttribute("aria-pressed", "false");
  });

  it("clicar no período já ativo não busca de novo", async () => {
    vi.mocked(buscarResumoDoPeriodo).mockResolvedValue(resumo);
    vi.mocked(listarMinhasAtividades).mockResolvedValue(pagina(atividades(1)));
    const user = userEvent.setup();
    render(<MeuHistorico />);
    await screen.findByText("Atividade 1");

    await user.click(botao("30 dias"));

    expect(buscarResumoDoPeriodo).toHaveBeenCalledTimes(1);
    expect(listarMinhasAtividades).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Atividade 1")).toBeInTheDocument();
  });

  it("mostra o estado vazio e não oferece Carregar mais", async () => {
    vi.mocked(buscarResumoDoPeriodo).mockResolvedValue({ totalAtividades: 0, totalMinutos: 0 });
    vi.mocked(listarMinhasAtividades).mockResolvedValue(pagina([]));

    render(<MeuHistorico />);

    expect(await screen.findByText("Nenhuma atividade no período")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });

  it("Carregar mais busca a página seguinte do mesmo período e some ao terminar", async () => {
    vi.mocked(buscarResumoDoPeriodo).mockResolvedValue({ totalAtividades: 21, totalMinutos: 630 });
    vi.mocked(listarMinhasAtividades)
      .mockResolvedValueOnce(pagina(atividades(20), 21))
      .mockResolvedValueOnce({ data: [atividade(21)], total: 21, page: 2, pageSize: 20 });
    const user = userEvent.setup();
    render(<MeuHistorico />);

    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Atividade 21")).toBeInTheDocument();
    expect(listarMinhasAtividades).toHaveBeenLastCalledWith(INTERVALOS["30dias"], 2);
    expect(screen.getByText("Atividade 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });

  it("erro ao carregar mais mantém a lista e mostra o alerta", async () => {
    vi.mocked(buscarResumoDoPeriodo).mockResolvedValue({ totalAtividades: 21, totalMinutos: 630 });
    vi.mocked(listarMinhasAtividades)
      .mockResolvedValueOnce(pagina(atividades(20), 21))
      .mockRejectedValueOnce(new Error("Falha na página 2"));
    const user = userEvent.setup();
    render(<MeuHistorico />);

    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha na página 2");
    expect(screen.getByText("Atividade 1")).toBeInTheDocument();
    expect(screen.getByText("Atividade 20")).toBeInTheDocument();
    expect(botao("Carregar mais")).toBeEnabled();
  });

  it("mostra a mensagem de erro da API", async () => {
    vi.mocked(buscarResumoDoPeriodo).mockRejectedValue(new Error("API fora do ar"));
    vi.mocked(listarMinhasAtividades).mockResolvedValue(pagina([]));

    render(<MeuHistorico />);

    expect(await screen.findByRole("alert")).toHaveTextContent("API fora do ar");
  });

  it("descarta a resposta do período antigo que chega depois da troca", async () => {
    let resolverResumo30: (r: ResumoDoPeriodo) => void = () => {};
    vi.mocked(buscarResumoDoPeriodo)
      .mockReturnValueOnce(
        new Promise((ok) => {
          resolverResumo30 = ok;
        }),
      )
      .mockResolvedValueOnce({ totalAtividades: 2, totalMinutos: 60 });
    vi.mocked(listarMinhasAtividades).mockResolvedValue(pagina(atividades(2)));
    const user = userEvent.setup();
    render(<MeuHistorico />);

    await user.click(botao("7 dias"));
    expect(await screen.findByText("Atividade 1")).toBeInTheDocument();
    await act(async () => resolverResumo30({ totalAtividades: 99, totalMinutos: 9900 }));

    expect(screen.getByText("Minutos").nextElementSibling?.textContent).toBe("60");
    expect(screen.queryByText("99")).toBeNull();
  });

  it.each(["resolve", "rejeita"] as const)(
    "descarta o Carregar mais que %s depois da troca de período",
    async (desfecho) => {
      let terminar: () => void = () => {};
      vi.mocked(buscarResumoDoPeriodo)
        .mockResolvedValueOnce({ totalAtividades: 21, totalMinutos: 630 })
        .mockResolvedValueOnce({ totalAtividades: 1, totalMinutos: 25 });
      vi.mocked(listarMinhasAtividades)
        .mockResolvedValueOnce(pagina(atividades(20), 21))
        .mockReturnValueOnce(
          new Promise((ok, falha) => {
            terminar = () =>
              desfecho === "resolve"
                ? ok({ data: [atividade(21)], total: 21, page: 2, pageSize: 20 })
                : falha(new Error("Falha tardia"));
          }),
        )
        .mockResolvedValueOnce(pagina([{ ...atividade(50), atividade: "Natação" }]));
      const user = userEvent.setup();
      render(<MeuHistorico />);
      await user.click(await screen.findByRole("button", { name: "Carregar mais" }));

      await user.click(botao("7 dias"));
      expect(await screen.findByText("Natação")).toBeInTheDocument();
      await act(async () => terminar());

      expect(screen.getByText("Natação")).toBeInTheDocument();
      expect(screen.queryByText("Atividade 21")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
    },
  );

  it("descarta o Carregar mais antigo mesmo depois de voltar ao mesmo período", async () => {
    let terminar: () => void = () => {};
    vi.mocked(buscarResumoDoPeriodo).mockResolvedValue({ totalAtividades: 21, totalMinutos: 630 });
    vi.mocked(listarMinhasAtividades)
      .mockResolvedValueOnce(pagina(atividades(20), 21))
      .mockReturnValueOnce(
        new Promise((ok) => {
          terminar = () => ok({ data: [atividade(21)], total: 21, page: 2, pageSize: 20 });
        }),
      )
      .mockResolvedValueOnce(pagina(atividades(1)))
      .mockResolvedValueOnce(pagina(atividades(20), 21));
    const user = userEvent.setup();
    render(<MeuHistorico />);
    await user.click(await screen.findByRole("button", { name: "Carregar mais" }));

    await user.click(botao("7 dias"));
    expect(await screen.findByText("Atividade 1")).toBeInTheDocument();
    await user.click(botao("30 dias"));
    expect(await screen.findByText("Atividade 20")).toBeInTheDocument();
    await act(async () => terminar());

    expect(screen.queryByText("Atividade 21")).toBeNull();
    expect(botao("Carregar mais")).toBeEnabled();
  });
});
