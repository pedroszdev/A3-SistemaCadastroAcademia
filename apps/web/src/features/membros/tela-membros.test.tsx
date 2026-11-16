import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import { listarMembros, type Membro, type PaginaMembros } from "./api";
import { ESPERA_BUSCA_MS, TelaMembros } from "./tela-membros";

vi.mock("./api", () => ({
  listarMembros: vi.fn(),
}));

const ana: Membro = {
  id: "m1",
  nome: "Ana Souza",
  cpf: "52998224725",
  telefone: "11987654321",
  endereco: "Rua Fictícia, 1",
  ativo: true,
  dataCadastro: "2026-01-10T00:00:00.000Z",
  acessoLiberado: true,
};
const beto: Membro = {
  id: "m2",
  nome: "Beto Lima",
  cpf: "11144477735",
  telefone: "1133334444",
  endereco: "Rua Fictícia, 2",
  ativo: false,
  dataCadastro: "2026-02-15T00:00:00.000Z",
  acessoLiberado: false,
};

function pagina(data: Membro[], extra: Partial<PaginaMembros> = {}): PaginaMembros {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };

function renderizar(usuario: UsuarioDoToken = admin) {
  render(
    <UsuarioProvider usuario={usuario}>
      <TelaMembros />
    </UsuarioProvider>,
  );
}

describe("TelaMembros", () => {
  beforeEach(() => {
    vi.mocked(listarMembros).mockReset();
    vi.mocked(listarMembros).mockResolvedValue(pagina([ana, beto]));
  });

  it("mostra nome, CPF e telefone com máscara e a situação de cada membro", async () => {
    renderizar();

    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
    const linhaAna = screen.getByText("Ana Souza").closest("tr") as HTMLElement;
    expect(within(linhaAna).getByText("529.982.247-25")).toBeInTheDocument();
    expect(within(linhaAna).getByText("(11) 98765-4321")).toBeInTheDocument();
    expect(within(linhaAna).getByText("Ativo")).toBeInTheDocument();
    const linhaBeto = screen.getByText("Beto Lima").closest("tr") as HTMLElement;
    expect(within(linhaBeto).getByText("111.444.777-35")).toBeInTheDocument();
    expect(within(linhaBeto).getByText("(11) 3333-4444")).toBeInTheDocument();
    expect(within(linhaBeto).getByText("Inativo")).toBeInTheDocument();
    expect(listarMembros).toHaveBeenCalledTimes(1);
    expect(listarMembros).toHaveBeenCalledWith({ page: 1 });
  });

  it("filtra por situação voltando para a página 1", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Ana Souza");

    await usuario.selectOptions(screen.getByLabelText("Situação"), "true");
    expect(listarMembros).toHaveBeenLastCalledWith({ ativo: true, page: 1 });

    await usuario.selectOptions(screen.getByLabelText("Situação"), "false");
    expect(listarMembros).toHaveBeenLastCalledWith({ ativo: false, page: 1 });

    await usuario.selectOptions(screen.getByLabelText("Situação"), "");
    expect(listarMembros).toHaveBeenLastCalledWith({ ativo: undefined, page: 1 });
  });

  it("pede a página 2 em Próxima e a 1 em Anterior", async () => {
    vi.mocked(listarMembros).mockImplementation(async ({ page }) =>
      pagina([ana], { page, total: 45 }),
    );
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText("Ana Souza");

    await usuario.click(screen.getByRole("button", { name: "Próxima" }));
    expect(listarMembros).toHaveBeenLastCalledWith({ page: 2 });

    await usuario.click(await screen.findByRole("button", { name: "Anterior" }));
    expect(listarMembros).toHaveBeenLastCalledWith({ page: 1 });
  });

  it("liga cada linha à ficha do membro", async () => {
    renderizar();
    await screen.findByText("Ana Souza");

    expect(screen.getByRole("link", { name: "Ver ficha de Ana Souza" })).toHaveAttribute(
      "href",
      "/membros/m1",
    );
    expect(screen.getByRole("link", { name: "Ver ficha de Beto Lima" })).toHaveAttribute(
      "href",
      "/membros/m2",
    );
  });

  it.each<[string, UsuarioDoToken]>([
    ["ADMIN", { tipo: "FUNCIONARIO", cargo: "ADMIN" }],
    ["RECEPCIONISTA", { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" }],
  ])("mostra o link Novo membro para %s", async (_, usuarioLogado) => {
    renderizar(usuarioLogado);
    await screen.findByText("Ana Souza");

    expect(screen.getByRole("link", { name: "Novo membro" })).toHaveAttribute(
      "href",
      "/membros/novo",
    );
  });

  it("esconde o link Novo membro do INSTRUTOR e mantém a ficha", async () => {
    renderizar({ tipo: "FUNCIONARIO", cargo: "INSTRUTOR" });
    await screen.findByText("Ana Souza");

    expect(screen.queryByRole("link", { name: "Novo membro" })).toBeNull();
    expect(screen.getByRole("link", { name: "Ver ficha de Ana Souza" })).toBeInTheDocument();
  });

  it("mostra a lista vazia", async () => {
    vi.mocked(listarMembros).mockResolvedValue(pagina([]));
    renderizar();

    expect(await screen.findByText("Nenhum membro encontrado")).toBeInTheDocument();
  });

  it("mostra o erro da lista", async () => {
    vi.mocked(listarMembros).mockRejectedValue(new ApiError(500, "Falha ao listar"));
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao listar");
  });

  describe("busca por nome ou CPF", () => {
    // O debounce roda em tempo falso: o teste não espera os 300ms de verdade. O
    // shouldAdvanceTime deixa correr os setTimeout(0) que a Testing Library usa por dentro.
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function avancar(ms: number) {
      return act(async () => vi.advanceTimersByTime(ms));
    }

    it("só busca depois de 300ms sem digitar, com o termo aparado e na página 1", async () => {
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizar();
      await screen.findByText("Ana Souza");

      await usuario.type(screen.getByLabelText("Buscar"), " ana ");
      expect(listarMembros).toHaveBeenCalledTimes(1);

      await avancar(ESPERA_BUSCA_MS);

      expect(listarMembros).toHaveBeenCalledTimes(2);
      expect(listarMembros).toHaveBeenLastCalledWith({ busca: "ana", page: 1 });
    });

    it("recomeça a espera a cada tecla e faz uma só busca", async () => {
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizar();
      await screen.findByText("Ana Souza");

      await usuario.type(screen.getByLabelText("Buscar"), "a");
      await avancar(ESPERA_BUSCA_MS - 100);
      await usuario.type(screen.getByLabelText("Buscar"), "na");
      await avancar(ESPERA_BUSCA_MS - 100);
      expect(listarMembros).toHaveBeenCalledTimes(1);

      await avancar(100);

      expect(listarMembros).toHaveBeenCalledTimes(2);
      expect(listarMembros).toHaveBeenLastCalledWith({ busca: "ana", page: 1 });
    });

    it("não busca de novo quando só mudam os espaços em volta do termo", async () => {
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizar();
      await screen.findByText("Ana Souza");
      await usuario.type(screen.getByLabelText("Buscar"), "ana");
      await avancar(ESPERA_BUSCA_MS);
      expect(listarMembros).toHaveBeenCalledTimes(2);

      await usuario.type(screen.getByLabelText("Buscar"), " ");
      await avancar(ESPERA_BUSCA_MS);

      expect(listarMembros).toHaveBeenCalledTimes(2);
    });

    it("tira a busca do filtro ao limpar o campo", async () => {
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizar();
      await screen.findByText("Ana Souza");
      await usuario.type(screen.getByLabelText("Buscar"), "ana");
      await avancar(ESPERA_BUSCA_MS);

      await usuario.clear(screen.getByLabelText("Buscar"));
      await avancar(ESPERA_BUSCA_MS);

      expect(listarMembros).toHaveBeenCalledTimes(3);
      expect(listarMembros).toHaveBeenLastCalledWith({ busca: undefined, page: 1 });
    });

    it("mantém a situação ao buscar e a busca ao mudar de página", async () => {
      vi.mocked(listarMembros).mockResolvedValue(pagina([ana], { total: 45 }));
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizar();
      await screen.findByText("Ana Souza");

      await usuario.selectOptions(screen.getByLabelText("Situação"), "true");
      await usuario.type(screen.getByLabelText("Buscar"), "ana");
      await avancar(ESPERA_BUSCA_MS);
      expect(listarMembros).toHaveBeenLastCalledWith({ ativo: true, busca: "ana", page: 1 });

      await usuario.click(await screen.findByRole("button", { name: "Próxima" }));

      expect(listarMembros).toHaveBeenLastCalledWith({ ativo: true, busca: "ana", page: 2 });
    });

    it("volta para a página 1 quando a busca muda na página 2", async () => {
      vi.mocked(listarMembros).mockResolvedValue(pagina([ana], { total: 45 }));
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizar();
      await screen.findByText("Ana Souza");
      await usuario.click(screen.getByRole("button", { name: "Próxima" }));
      expect(listarMembros).toHaveBeenLastCalledWith({ page: 2 });

      await usuario.type(screen.getByLabelText("Buscar"), "ana");
      await avancar(ESPERA_BUSCA_MS);

      expect(listarMembros).toHaveBeenLastCalledWith({ busca: "ana", page: 1 });
    });
  });
});
