import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { buscarMembros, type MembroBusca } from "./api";
import { BuscaMembro, ESPERA_BUSCA_MS } from "./busca-membro";

vi.mock("./api", () => ({ buscarMembros: vi.fn() }));

const fulano: MembroBusca = { id: "m1", nome: "Fulano Silva", cpf: "12345678909" };
const fulana: MembroBusca = { id: "m2", nome: "Fulana Souza", cpf: "98765432100" };

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("BuscaMembro", () => {
  const onSelecionar = vi.fn();

  beforeEach(() => {
    vi.mocked(buscarMembros).mockReset();
    onSelecionar.mockReset();
  });

  it("não busca com menos de 2 caracteres", async () => {
    const usuario = userEvent.setup();
    render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} />);

    await usuario.type(screen.getByLabelText("Membro"), "F");
    await esperar(ESPERA_BUSCA_MS + 100);

    expect(buscarMembros).not.toHaveBeenCalled();
  });

  it("busca uma vez por pausa, com o termo completo", async () => {
    vi.mocked(buscarMembros).mockResolvedValue([fulano]);
    const usuario = userEvent.setup();
    render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} />);

    await usuario.type(screen.getByLabelText("Membro"), "Ful");

    expect(await screen.findByRole("button", { name: /Fulano Silva/ })).toBeInTheDocument();
    expect(buscarMembros).toHaveBeenCalledTimes(1);
    expect(buscarMembros).toHaveBeenCalledWith("Ful", { incluirInativos: false });
  });

  it("inclui os inativos na busca e usa a mensagem sem 'ativo' quando incluirInativos", async () => {
    vi.mocked(buscarMembros).mockResolvedValue([]);
    const usuario = userEvent.setup();
    render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} incluirInativos />);

    await usuario.type(screen.getByLabelText("Membro"), "Zz");

    expect(await screen.findByText("Nenhum membro encontrado")).toBeInTheDocument();
    expect(buscarMembros).toHaveBeenCalledWith("Zz", { incluirInativos: true });
    expect(screen.queryByText("Nenhum membro ativo encontrado")).toBeNull();
  });

  it("usa o rótulo informado no campo de busca e no membro escolhido", () => {
    const { rerender } = render(
      <BuscaMembro selecionado={null} onSelecionar={onSelecionar} rotulo="Filtrar membro" />,
    );

    expect(screen.getByLabelText("Filtrar membro")).toBeInTheDocument();

    rerender(<BuscaMembro selecionado={fulano} onSelecionar={onSelecionar} rotulo="Filtrar membro" />);

    expect(screen.getByText("Filtrar membro")).toBeInTheDocument();
    expect(screen.queryByText("Membro")).toBeNull();
  });

  it("lista os resultados com o CPF formatado e seleciona ao clicar", async () => {
    vi.mocked(buscarMembros).mockResolvedValue([fulano, fulana]);
    const usuario = userEvent.setup();
    render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} />);

    await usuario.type(screen.getByLabelText("Membro"), "Ful");
    const lista = await screen.findByRole("list", { name: "Membros encontrados" });
    expect(within(lista).getByText("Fulano Silva · 123.456.789-09")).toBeInTheDocument();
    expect(within(lista).getByText("Fulana Souza · 987.654.321-00")).toBeInTheDocument();

    await usuario.click(within(lista).getByRole("button", { name: /Fulana Souza/ }));

    expect(onSelecionar).toHaveBeenCalledWith(fulana);
    expect(screen.queryByRole("list", { name: "Membros encontrados" })).toBeNull();
    expect(screen.getByLabelText("Membro")).toHaveValue("");
  });

  it("esconde a lista antiga assim que o texto muda", async () => {
    vi.mocked(buscarMembros).mockResolvedValue([fulano]);
    const usuario = userEvent.setup();
    render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} />);

    await usuario.type(screen.getByLabelText("Membro"), "Fu");
    await screen.findByRole("list", { name: "Membros encontrados" });
    await usuario.type(screen.getByLabelText("Membro"), "l");

    expect(screen.queryByRole("list", { name: "Membros encontrados" })).toBeNull();
  });

  it("avisa quando nenhum membro ativo é encontrado", async () => {
    vi.mocked(buscarMembros).mockResolvedValue([]);
    const usuario = userEvent.setup();
    render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} />);

    await usuario.type(screen.getByLabelText("Membro"), "Zz");

    expect(await screen.findByText("Nenhum membro ativo encontrado")).toBeInTheDocument();
  });

  it("mostra a mensagem da API quando a busca falha e a esconde ao limpar o campo", async () => {
    vi.mocked(buscarMembros).mockRejectedValue(new ApiError(500, "Falha ao buscar membros"));
    const usuario = userEvent.setup();
    render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} />);

    await usuario.type(screen.getByLabelText("Membro"), "Fu");

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao buscar membros");

    await usuario.clear(screen.getByLabelText("Membro"));

    expect(screen.queryByRole("alert")).toBeNull();
  });

  describe("com uma busca antiga terminando depois da nova", () => {
    type Adiada = PromiseWithResolvers<MembroBusca[]>;

    // O debounce roda em tempo falso: o teste não espera os 300ms de verdade. O
    // shouldAdvanceTime deixa correr os setTimeout(0) que a Testing Library usa por dentro.
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      ["a resposta", (antiga: Adiada) => antiga.resolve([fulano])],
      ["o erro", (antiga: Adiada) => antiga.reject(new ApiError(500, "Falha na busca antiga"))],
    ])("%s do termo antigo não aparece no lugar da busca nova", async (_, terminarAntiga) => {
      const antiga = Promise.withResolvers<MembroBusca[]>();
      const nova = Promise.withResolvers<MembroBusca[]>();
      vi.mocked(buscarMembros)
        .mockReturnValueOnce(antiga.promise)
        .mockReturnValueOnce(nova.promise);
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} />);

      await usuario.type(screen.getByLabelText("Membro"), "Fu");
      await act(async () => vi.advanceTimersByTime(ESPERA_BUSCA_MS));
      expect(buscarMembros).toHaveBeenCalledTimes(1);
      await usuario.type(screen.getByLabelText("Membro"), "l");
      await act(async () => vi.advanceTimersByTime(ESPERA_BUSCA_MS));
      expect(buscarMembros).toHaveBeenCalledTimes(2);

      await act(async () => nova.resolve([fulana]));
      await act(async () => terminarAntiga(antiga));

      expect(screen.getByRole("button", { name: /Fulana Souza/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Fulano Silva/ })).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("mostra o membro escolhido e volta à busca em Trocar", async () => {
    const usuario = userEvent.setup();
    render(<BuscaMembro selecionado={fulano} onSelecionar={onSelecionar} />);

    expect(screen.getByText("Membro")).toBeInTheDocument();
    expect(screen.getByText("Fulano Silva · 123.456.789-09")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Trocar" }));

    expect(onSelecionar).toHaveBeenCalledWith(null);
  });

  it("mostra o erro de validação junto ao campo", () => {
    render(<BuscaMembro selecionado={null} onSelecionar={onSelecionar} erro="Selecione o membro" />);

    expect(screen.getByText("Selecione o membro")).toBeInTheDocument();
  });
});
