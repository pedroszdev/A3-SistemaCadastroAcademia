import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { MeusTreinos } from "./meus-treinos";
import { type PaginaTreinosDoAluno, type TreinoDoAluno, listarMeusTreinos } from "./treinos";

vi.mock("./treinos", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./treinos")>()),
  listarMeusTreinos: vi.fn(),
}));

function treino(n: number, extra: Partial<TreinoDoAluno> = {}): TreinoDoAluno {
  return {
    id: `t${n}`,
    tipo: "Musculação",
    descricao: `Descrição ${n}`,
    duracao: 45,
    dataInicio: "2026-11-20T12:00:00.000Z",
    ...extra,
  };
}

function pagina(itens: TreinoDoAluno[], total = itens.length): PaginaTreinosDoAluno {
  return { data: itens, total, page: 1, pageSize: 20 };
}

describe("MeusTreinos", () => {
  beforeEach(() => {
    vi.mocked(listarMeusTreinos).mockReset();
  });

  it("mostra Carregando… e depois um card por treino", async () => {
    vi.mocked(listarMeusTreinos).mockResolvedValue(pagina([treino(1), treino(2)]));

    render(<MeusTreinos />);

    expect(screen.getByText("Carregando…")).toBeInTheDocument();
    expect(await screen.findByText("Descrição 1")).toBeInTheDocument();
    expect(screen.getByText("Descrição 2")).toBeInTheDocument();
    expect(listarMeusTreinos).toHaveBeenCalledWith(undefined, 1);
  });

  it("filtra por tipo e volta para todos os tipos", async () => {
    vi.mocked(listarMeusTreinos).mockResolvedValue(pagina([treino(1)]));
    render(<MeusTreinos />);
    await screen.findByText("Descrição 1");

    await userEvent.click(screen.getByRole("button", { name: "Cardio" }));
    await screen.findByText("Descrição 1");
    expect(listarMeusTreinos).toHaveBeenLastCalledWith("Cardio", 1);

    await userEvent.click(screen.getByRole("button", { name: "Todos" }));
    await screen.findByText("Descrição 1");
    expect(listarMeusTreinos).toHaveBeenLastCalledWith(undefined, 1);
  });

  it("descarta a resposta atrasada do filtro anterior", async () => {
    let resolverAntiga: (p: PaginaTreinosDoAluno) => void = () => {};
    vi.mocked(listarMeusTreinos)
      .mockReturnValueOnce(new Promise((resolver) => (resolverAntiga = resolver)))
      .mockResolvedValueOnce(pagina([treino(2, { tipo: "Cardio", descricao: "Do Cardio" })]));
    render(<MeusTreinos />);

    await userEvent.click(screen.getByRole("button", { name: "Cardio" }));
    expect(await screen.findByText("Do Cardio")).toBeInTheDocument();
    await act(async () => resolverAntiga(pagina([treino(1, { descricao: "Da lista antiga" })])));

    expect(screen.queryByText("Da lista antiga")).not.toBeInTheDocument();
    expect(screen.getByText("Do Cardio")).toBeInTheDocument();
  });

  it("mostra o estado vazio", async () => {
    vi.mocked(listarMeusTreinos).mockResolvedValue(pagina([]));

    render(<MeusTreinos />);

    expect(await screen.findByText("Nenhum treino encontrado")).toBeInTheDocument();
  });

  it("mostra a mensagem da API quando a lista falha", async () => {
    vi.mocked(listarMeusTreinos).mockRejectedValue(new ApiError(500, "Erro interno"));

    render(<MeusTreinos />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno");
  });

  it("busca de novo o mesmo filtro em Tentar de novo", async () => {
    vi.mocked(listarMeusTreinos)
      .mockRejectedValueOnce(new ApiError(500, "Erro interno"))
      .mockResolvedValueOnce(pagina([treino(1)]));
    render(<MeusTreinos />);

    await userEvent.click(await screen.findByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText("Descrição 1")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(listarMeusTreinos).toHaveBeenCalledTimes(2);
    expect(listarMeusTreinos).toHaveBeenLastCalledWith(undefined, 1);
  });

  it("não repete no Carregar mais o treino que já está na lista", async () => {
    vi.mocked(listarMeusTreinos)
      .mockResolvedValueOnce(pagina([treino(1), treino(2)], 4))
      .mockResolvedValueOnce(pagina([treino(2), treino(3)], 4));
    render(<MeusTreinos />);

    await userEvent.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Descrição 3")).toBeInTheDocument();
    expect(screen.getAllByText("Descrição 2")).toHaveLength(1);
  });

  it("carrega mais e esconde o botão quando tudo foi carregado", async () => {
    vi.mocked(listarMeusTreinos)
      .mockResolvedValueOnce(pagina([treino(1)], 2))
      .mockResolvedValueOnce(pagina([treino(2)], 2));
    render(<MeusTreinos />);

    await userEvent.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByText("Descrição 2")).toBeInTheDocument();
    expect(screen.getByText("Descrição 1")).toBeInTheDocument();
    expect(listarMeusTreinos).toHaveBeenLastCalledWith(undefined, 2);
    expect(screen.queryByRole("button", { name: "Carregar mais" })).not.toBeInTheDocument();
  });

  it("mantém os cards e mostra o erro quando o Carregar mais falha", async () => {
    vi.mocked(listarMeusTreinos)
      .mockResolvedValueOnce(pagina([treino(1)], 2))
      .mockRejectedValueOnce(new ApiError(500, "Falhou ao carregar mais"));
    render(<MeusTreinos />);

    await userEvent.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falhou ao carregar mais");
    expect(screen.getByText("Descrição 1")).toBeInTheDocument();
  });

  it("abre o detalhe do treino e fecha em Fechar", async () => {
    vi.mocked(listarMeusTreinos).mockResolvedValue(
      pagina([treino(1, { tipo: "Cardio", descricao: "Esteira por 30 minutos e bicicleta" })]),
    );
    render(<MeusTreinos />);

    await userEvent.click(await screen.findByRole("button", { name: /^Cardio.*Esteira/ }));

    const dialogo = screen.getByRole("dialog", { name: "Cardio" });
    expect(dialogo).toHaveTextContent("Esteira por 30 minutos e bicicleta");
    expect(dialogo).toHaveTextContent("45 min");
    expect(dialogo).toHaveTextContent("20/11/2026");

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
