import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Pagamento } from "@/features/pagamentos/api";
import type { Pagina } from "@/lib/use-lista-paginada";
import { AvisoDaSituacao, MeusPagamentos } from "./meus-pagamentos";
import {
  buscarResumoDosPagamentos,
  listarMeusPagamentos,
  type ResumoDosPagamentos,
} from "./pagamentos";

vi.mock("./pagamentos", () => ({
  buscarResumoDosPagamentos: vi.fn(),
  listarMeusPagamentos: vi.fn(),
}));

function pagamento(id: string, extra: Partial<Pagamento> = {}): Pagamento {
  return {
    id,
    membroId: "m1",
    valor: 120,
    dataVencimento: "2026-11-10T00:00:00.000Z",
    dataPagamento: null,
    status: "PENDENTE",
    diasEmAtraso: 0,
    membro: { id: "m1", nome: "Ana Souza" },
    ...extra,
  };
}

function pagina(data: Pagamento[], total = data.length): Pagina<Pagamento> {
  return { data, total, page: 1, pageSize: 20 };
}

const emDia: ResumoDosPagamentos = {
  situacao: "EM_DIA",
  pagamentosAtrasados: 0,
  maiorAtrasoDias: 0,
  proximoPagamento: pagamento("p0", { dataVencimento: "2026-12-10T00:00:00.000Z" }),
  valorMensalidade: 120,
  diaVencimento: 10,
};

describe("MeusPagamentos", () => {
  beforeEach(() => {
    vi.mocked(buscarResumoDosPagamentos).mockReset();
    vi.mocked(listarMeusPagamentos).mockReset();
    vi.mocked(buscarResumoDosPagamentos).mockResolvedValue(emDia);
  });

  it("mostra o aviso, o plano e as mensalidades com o status", async () => {
    vi.mocked(listarMeusPagamentos).mockResolvedValue(
      pagina([
        pagamento("p1", {
          status: "PAGO",
          dataPagamento: "2026-11-08T00:00:00.000Z",
        }),
        pagamento("p2", { status: "ATRASADO", diasEmAtraso: 3 }),
      ]),
    );
    render(<MeusPagamentos />);
    expect(screen.getByText("Carregando…")).toBeInTheDocument();

    expect(await screen.findByText("Vencimento 10/11/2026 · pago em 08/11/2026")).toBeInTheDocument();
    expect(screen.getByText("Pago", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Atrasado · 3 dias")).toBeInTheDocument();
    expect(await screen.findByText(/Mensalidade em dia\. Próximo vencimento em 10\/12\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/vence todo dia 10\.$/)).toBeInTheDocument();
    expect(listarMeusPagamentos).toHaveBeenCalledWith(undefined, 1);
  });

  it("sem plano avisa que a recepção ainda não definiu", async () => {
    vi.mocked(buscarResumoDosPagamentos).mockResolvedValue({
      ...emDia,
      proximoPagamento: null,
      valorMensalidade: null,
      diaVencimento: null,
    });
    vi.mocked(listarMeusPagamentos).mockResolvedValue(pagina([]));
    render(<MeusPagamentos />);

    expect(
      await screen.findByText("Sua mensalidade ainda não foi definida pela recepção."),
    ).toBeInTheDocument();
    expect(screen.getByText("Nenhum pagamento encontrado")).toBeInTheDocument();
  });

  it("filtra por status e não busca de novo o mesmo", async () => {
    vi.mocked(listarMeusPagamentos).mockResolvedValue(pagina([pagamento("p1")]));
    const usuario = userEvent.setup();
    render(<MeusPagamentos />);
    await screen.findByText("Vencimento 10/11/2026");

    await usuario.click(screen.getByRole("button", { name: "Atrasado" }));
    await screen.findByText("Vencimento 10/11/2026");
    expect(listarMeusPagamentos).toHaveBeenLastCalledWith("ATRASADO", 1);

    await usuario.click(screen.getByRole("button", { name: "Atrasado" }));
    expect(listarMeusPagamentos).toHaveBeenCalledTimes(2);
  });

  it("mostra o erro da lista", async () => {
    vi.mocked(listarMeusPagamentos).mockRejectedValue(new Error("API fora do ar"));
    render(<MeusPagamentos />);

    expect(await screen.findByRole("alert")).toHaveTextContent("API fora do ar");
  });

  it("segue sem o aviso quando o resumo falha", async () => {
    vi.mocked(buscarResumoDosPagamentos).mockRejectedValue(new Error("x"));
    vi.mocked(listarMeusPagamentos).mockResolvedValue(pagina([pagamento("p1")]));
    render(<MeusPagamentos />);

    expect(await screen.findByText("Vencimento 10/11/2026")).toBeInTheDocument();
    expect(screen.queryByText(/Mensalidade em dia/)).toBeNull();
  });

  it("Carregar mais junta a página seguinte sem repetir", async () => {
    vi.mocked(listarMeusPagamentos)
      .mockResolvedValueOnce(pagina([pagamento("p1")], 2))
      .mockResolvedValueOnce({
        ...pagina([pagamento("p1"), pagamento("p2", { dataVencimento: "2026-10-10T00:00:00.000Z" })], 2),
        page: 2,
      });
    const usuario = userEvent.setup();
    render(<MeusPagamentos />);

    await usuario.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Vencimento 10/10/2026")).toBeInTheDocument();
    expect(screen.getAllByText("Vencimento 10/11/2026")).toHaveLength(1);
    expect(listarMeusPagamentos).toHaveBeenLastCalledWith(undefined, 2);
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });

  it("erro no Carregar mais mantém a lista e mostra o alerta", async () => {
    vi.mocked(listarMeusPagamentos)
      .mockResolvedValueOnce(pagina([pagamento("p1")], 2))
      .mockRejectedValueOnce(new Error("Falhou a página 2"));
    const usuario = userEvent.setup();
    render(<MeusPagamentos />);

    await usuario.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falhou a página 2");
    expect(screen.getByText("Vencimento 10/11/2026")).toBeInTheDocument();
  });

  it("descarta o Carregar mais que chega depois de trocar o filtro", async () => {
    let resolver: (p: Pagina<Pagamento>) => void = () => {};
    vi.mocked(listarMeusPagamentos)
      .mockResolvedValueOnce(pagina([pagamento("p1")], 2))
      .mockReturnValueOnce(new Promise((r) => (resolver = r)))
      .mockResolvedValueOnce(pagina([pagamento("p3", { status: "PAGO" })]));
    const usuario = userEvent.setup();
    render(<MeusPagamentos />);

    await usuario.click(await screen.findByRole("button", { name: "Carregar mais" }));
    await usuario.click(screen.getByRole("button", { name: "Pago" }));
    await screen.findByText("Pago", { selector: "span" });
    await act(async () => resolver(pagina([pagamento("velho", { dataVencimento: "2025-01-10T00:00:00.000Z" })])));

    expect(screen.queryByText("Vencimento 10/01/2025")).toBeNull();
  });
});

describe("AvisoDaSituacao", () => {
  it("inadimplente: alerta de bloqueio", () => {
    render(
      <AvisoDaSituacao
        resumo={{ ...emDia, situacao: "INADIMPLENTE", pagamentosAtrasados: 1, maiorAtrasoDias: 18 }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Mensalidade em atraso há 18 dias. Enquanto não regularizar na recepção, você não consegue registrar atividades.",
    );
  });

  it("atraso na tolerância: aviso no singular", () => {
    render(
      <AvisoDaSituacao resumo={{ ...emDia, pagamentosAtrasados: 1, maiorAtrasoDias: 1 }} />,
    );

    expect(screen.getByText(/1 mensalidade atrasada \(1 dia\)/)).toBeInTheDocument();
  });

  it("em dia sem próxima cobrança", () => {
    render(<AvisoDaSituacao resumo={{ ...emDia, proximoPagamento: null }} />);

    expect(screen.getByText("Mensalidade em dia.")).toBeInTheDocument();
  });
});
