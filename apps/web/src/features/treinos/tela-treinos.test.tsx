import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { buscarMembros, type MembroBusca } from "@/features/pagamentos/api";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import {
  atualizarTreino,
  criarTreino,
  excluirTreino,
  listarTreinos,
  type PaginaTreinos,
  type Treino,
} from "./api";
import { TelaTreinos } from "./tela-treinos";

vi.mock("@/features/pagamentos/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/pagamentos/api")>()),
  buscarMembros: vi.fn(),
}));

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  listarTreinos: vi.fn(),
  criarTreino: vi.fn(),
  atualizarTreino: vi.fn(),
  excluirTreino: vi.fn(),
}));

const fulano: MembroBusca = { id: "m1", nome: "Fulano Silva", cpf: "12345678909" };

function treino(id: string, nome: string, extra: Partial<Treino> = {}): Treino {
  return {
    id,
    membroId: `m-${id}`,
    tipo: "Cardio",
    descricao: "Esteira e bicicleta",
    duracao: 45,
    dataInicio: "2026-11-15T00:00:00.000Z",
    membro: { id: `m-${id}`, nome },
    ...extra,
  };
}

const treinoDoFulano = treino("t1", "Fulano Silva");
const treinoDaBeltrana = treino("t2", "Beltrana Souza", {
  tipo: "Musculação",
  duracao: 60,
  dataInicio: "2026-11-20T00:00:00.000Z",
});

function pagina(data: Treino[], extra: Partial<PaginaTreinos> = {}): PaginaTreinos {
  return { data, total: data.length, page: 1, pageSize: 20, ...extra };
}

const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };
const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const recepcionista: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" };

function renderizar(usuario: UsuarioDoToken = instrutor) {
  render(
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <TelaTreinos />
      </ToastProvider>
    </UsuarioProvider>,
  );
}

function linhaDe(nome: string): HTMLElement {
  return screen.getByText(nome).closest("tr") as HTMLElement;
}

describe("TelaTreinos", () => {
  beforeEach(() => {
    vi.mocked(listarTreinos).mockReset();
    vi.mocked(criarTreino).mockReset();
    vi.mocked(atualizarTreino).mockReset();
    vi.mocked(excluirTreino).mockReset();
    vi.mocked(buscarMembros).mockReset();
    vi.mocked(listarTreinos).mockResolvedValue(pagina([treinoDoFulano, treinoDaBeltrana]));
    vi.mocked(buscarMembros).mockResolvedValue({ membros: [fulano], total: 1 });
    // Só o relógio: "hoje" em São Paulo fica 2026-11-11, antes das datas de início dos testes.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra a tabela com membro, tipo, duração e início", async () => {
    renderizar();

    expect(await screen.findByText("Fulano Silva")).toBeInTheDocument();
    for (const titulo of ["Membro", "Tipo", "Duração", "Início", "Ações"]) {
      expect(screen.getByRole("columnheader", { name: titulo })).toBeInTheDocument();
    }
    expect(listarTreinos).toHaveBeenCalledWith({ page: 1 });

    const primeira = within(linhaDe("Fulano Silva"));
    expect(primeira.getByText("Cardio")).toBeInTheDocument();
    expect(primeira.getByText("45 min")).toBeInTheDocument();
    expect(primeira.getByText("15/11/2026")).toBeInTheDocument();

    const segunda = within(linhaDe("Beltrana Souza"));
    expect(segunda.getByText("Musculação")).toBeInTheDocument();
    expect(segunda.getByText("60 min")).toBeInTheDocument();
    expect(segunda.getByText("20/11/2026")).toBeInTheDocument();
  });

  it("mostra a lista vazia", async () => {
    vi.mocked(listarTreinos).mockResolvedValue(pagina([]));
    renderizar();

    expect(await screen.findByText("Nenhum treino encontrado")).toBeInTheDocument();
  });

  it("mostra a mensagem da API quando a lista falha", async () => {
    vi.mocked(listarTreinos).mockRejectedValue(new ApiError(400, "tipo deve ser um destes"));
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("tipo deve ser um destes");
  });

  it("pede a página 2 em Próxima", async () => {
    vi.mocked(listarTreinos).mockResolvedValue(pagina([treinoDoFulano], { total: 40 }));
    renderizar();
    await screen.findByText("Fulano Silva");

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(listarTreinos).toHaveBeenLastCalledWith({ page: 2 });
  });

  describe("filtros", () => {
    it("filtra por tipo chamando a API com ?tipo= e volta para a página 1", async () => {
      vi.mocked(listarTreinos).mockResolvedValue(pagina([treinoDoFulano], { total: 40 }));
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");
      await usuario.click(screen.getByRole("button", { name: "Próxima" }));

      await usuario.selectOptions(screen.getByLabelText("Tipo"), "Musculação");
      expect(listarTreinos).toHaveBeenLastCalledWith({ tipo: "Musculação", page: 1 });

      await usuario.selectOptions(screen.getByLabelText("Tipo"), "");
      expect(listarTreinos).toHaveBeenLastCalledWith({ tipo: undefined, page: 1 });
    });

    it("oferece no filtro os tipos da RN05", async () => {
      renderizar();
      await screen.findByText("Fulano Silva");

      const opcoes = Array.from(
        (screen.getByLabelText("Tipo") as HTMLSelectElement).options,
        (opcao) => opcao.textContent,
      );

      expect(opcoes).toEqual([
        "Todos os tipos",
        "Musculação",
        "Cardio",
        "Funcional",
        "Alongamento",
        "Crossfit",
        "Outro",
      ]);
    });

    it("filtra por membro chamando a API com ?membroId= e limpa em Trocar", async () => {
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.type(screen.getByLabelText("Membro"), "Ful");
      await usuario.click(await screen.findByRole("button", { name: /Fulano Silva · / }));

      expect(buscarMembros).toHaveBeenCalledWith("Ful", { incluirInativos: true });
      await waitFor(() =>
        expect(listarTreinos).toHaveBeenLastCalledWith({ membroId: "m1", page: 1 }),
      );

      await usuario.click(screen.getByRole("button", { name: "Trocar" }));
      await waitFor(() =>
        expect(listarTreinos).toHaveBeenLastCalledWith({ membroId: undefined, page: 1 }),
      );
      expect(screen.getByLabelText("Membro")).toBeInTheDocument();
    });

    it("combina tipo e membro", async () => {
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.selectOptions(screen.getByLabelText("Tipo"), "Cardio");
      await usuario.type(screen.getByLabelText("Membro"), "Ful");
      await usuario.click(await screen.findByRole("button", { name: /Fulano Silva · / }));

      await waitFor(() =>
        expect(listarTreinos).toHaveBeenLastCalledWith({
          tipo: "Cardio",
          membroId: "m1",
          page: 1,
        }),
      );
    });
  });

  describe("permissões", () => {
    it("recepcionista só consulta: sem botões nem coluna de ações", async () => {
      renderizar(recepcionista);
      await screen.findByText("Fulano Silva");

      expect(screen.queryByRole("button", { name: "Novo treino" })).toBeNull();
      expect(screen.queryByRole("button", { name: /^Editar/ })).toBeNull();
      expect(screen.queryByRole("button", { name: /^Excluir/ })).toBeNull();
      expect(screen.queryByRole("columnheader", { name: "Ações" })).toBeNull();
      expect(screen.getByText("Beltrana Souza")).toBeInTheDocument();
    });

    it.each([
      ["INSTRUTOR", instrutor],
      ["ADMIN", admin],
    ])("%s vê criar, editar e excluir", async (_cargo, usuarioLogado) => {
      renderizar(usuarioLogado);
      await screen.findByText("Fulano Silva");

      expect(screen.getByRole("button", { name: "Novo treino" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Editar treino Cardio de Fulano Silva com início em 15/11/2026",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Excluir treino Cardio de Fulano Silva com início em 15/11/2026",
        }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^Excluir treino/ })).toHaveLength(2);
    });
  });

  describe("excluir", () => {
    const excluirFulano = () =>
      screen.getByRole("button", {
        name: "Excluir treino Cardio de Fulano Silva com início em 15/11/2026",
      });

    it("pede confirmação antes de chamar a API", async () => {
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.click(excluirFulano());

      const dialogo = screen.getByRole("dialog", { name: "Excluir treino" });
      expect(
        within(dialogo).getByText(
          /Excluir o treino Cardio de Fulano Silva com início em 15\/11\/2026\?/,
        ),
      ).toBeInTheDocument();
      expect(excluirTreino).not.toHaveBeenCalled();
    });

    it("Cancelar fecha a confirmação sem excluir", async () => {
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.click(excluirFulano());
      await usuario.click(
        within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }),
      );

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(excluirTreino).not.toHaveBeenCalled();
    });

    it("Escape fecha a confirmação sem excluir", async () => {
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.click(excluirFulano());
      await usuario.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(excluirTreino).not.toHaveBeenCalled();
    });

    it("Confirmar exclui, avisa e recarrega a lista", async () => {
      vi.mocked(excluirTreino).mockResolvedValue(undefined);
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");
      vi.mocked(listarTreinos).mockResolvedValue(pagina([treinoDaBeltrana]));

      await usuario.click(excluirFulano());
      await usuario.click(
        within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }),
      );

      expect(excluirTreino).toHaveBeenCalledWith("t1");
      expect(await screen.findByText("Treino excluído.")).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText("Fulano Silva")).toBeNull());
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(listarTreinos).toHaveBeenCalledTimes(2);
    });

    it("mostra a mensagem da API quando a exclusão falha e fecha a confirmação", async () => {
      vi.mocked(excluirTreino).mockRejectedValue(new ApiError(404, "Treino não encontrado"));
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.click(excluirFulano());
      await usuario.click(
        within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }),
      );

      expect(await screen.findByText("Treino não encontrado")).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(listarTreinos).toHaveBeenCalledTimes(2);
    });
  });

  describe("criar e editar", () => {
    it("abre o formulário de novo treino, cria e recarrega a lista", async () => {
      vi.mocked(criarTreino).mockResolvedValue(treinoDoFulano);
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.click(screen.getByRole("button", { name: "Novo treino" }));
      const dialogo = screen.getByRole("dialog", { name: "Novo treino" });
      await usuario.type(within(dialogo).getByLabelText("Membro"), "Ful");
      await usuario.click(await within(dialogo).findByRole("button", { name: /Fulano Silva · / }));
      await usuario.selectOptions(within(dialogo).getByLabelText("Tipo"), "Cardio");
      await usuario.type(within(dialogo).getByLabelText("Descrição"), "Esteira e bicicleta");
      fireEvent.change(within(dialogo).getByLabelText("Duração (min)"), {
        target: { value: "45" },
      });
      fireEvent.change(within(dialogo).getByLabelText("Início"), {
        target: { value: "2026-11-15" },
      });
      await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

      expect(await screen.findByText("Treino cadastrado.")).toBeInTheDocument();
      expect(criarTreino).toHaveBeenCalledWith({
        membroId: "m1",
        tipo: "Cardio",
        descricao: "Esteira e bicicleta",
        duracao: 45,
        dataInicio: "2026-11-15",
      });
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(listarTreinos).toHaveBeenCalledTimes(2);
    });

    it("abre a edição com os dados do treino, salva e recarrega a lista", async () => {
      vi.mocked(atualizarTreino).mockResolvedValue(treinoDoFulano);
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.click(
        screen.getByRole("button", {
          name: "Editar treino Cardio de Fulano Silva com início em 15/11/2026",
        }),
      );
      const dialogo = screen.getByRole("dialog", { name: "Editar treino" });
      expect(within(dialogo).getByLabelText("Descrição")).toHaveValue("Esteira e bicicleta");
      await usuario.selectOptions(within(dialogo).getByLabelText("Tipo"), "Funcional");
      await usuario.click(within(dialogo).getByRole("button", { name: "Salvar" }));

      expect(await screen.findByText("Treino atualizado.")).toBeInTheDocument();
      expect(atualizarTreino).toHaveBeenCalledWith("t1", {
        tipo: "Funcional",
        descricao: "Esteira e bicicleta",
        duracao: 45,
        dataInicio: "2026-11-15",
      });
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(listarTreinos).toHaveBeenCalledTimes(2);
    });

    it("Cancelar fecha o formulário sem salvar", async () => {
      const usuario = userEvent.setup();
      renderizar();
      await screen.findByText("Fulano Silva");

      await usuario.click(screen.getByRole("button", { name: "Novo treino" }));
      await usuario.click(
        within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }),
      );

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(criarTreino).not.toHaveBeenCalled();
    });
  });
});
