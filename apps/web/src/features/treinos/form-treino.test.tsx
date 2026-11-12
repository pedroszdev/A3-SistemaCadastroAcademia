import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buscarMembros, type MembroBusca } from "@/features/pagamentos/api";
import { ApiError } from "@/lib/api";
import { atualizarTreino, criarTreino, type Treino } from "./api";
import { FormTreino } from "./form-treino";
import { MENSAGEM_TIPO_TREINO } from "./tipos";

vi.mock("@/features/pagamentos/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/pagamentos/api")>()),
  buscarMembros: vi.fn(),
}));

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  criarTreino: vi.fn(),
  atualizarTreino: vi.fn(),
}));

const fulano: MembroBusca = { id: "m1", nome: "Fulano Silva", cpf: "12345678909" };

const salvo: Treino = {
  id: "t1",
  membroId: "m1",
  tipo: "Funcional",
  descricao: "Circuito de corpo inteiro",
  duracao: 45,
  dataInicio: "2026-10-01T00:00:00.000Z",
  membro: { id: "m1", nome: "Fulano Silva" },
};

type Usuario = ReturnType<typeof userEvent.setup>;

const onSalvo = vi.fn();
const onCancelar = vi.fn();
const onEnviando = vi.fn();

function renderizar(treino?: Treino) {
  render(
    <FormTreino
      treino={treino}
      onSalvo={onSalvo}
      onCancelar={onCancelar}
      onEnviando={onEnviando}
    />,
  );
}

async function escolherMembro(usuario: Usuario) {
  await usuario.type(screen.getByLabelText("Membro"), "Ful");
  await usuario.click(await screen.findByRole("button", { name: /Fulano Silva/ }));
}

async function preencher(usuario: Usuario, extra: { duracao?: string; dataInicio?: string } = {}) {
  await escolherMembro(usuario);
  await usuario.selectOptions(screen.getByLabelText("Tipo"), "Cardio");
  await usuario.type(screen.getByLabelText("Descrição"), "Esteira e bicicleta");
  fireEvent.change(screen.getByLabelText("Duração (min)"), {
    target: { value: extra.duracao ?? "45" },
  });
  fireEvent.change(screen.getByLabelText("Início"), {
    target: { value: extra.dataInicio ?? "2026-11-12" },
  });
}

function salvar(usuario: Usuario) {
  return usuario.click(screen.getByRole("button", { name: "Salvar" }));
}

describe("FormTreino", () => {
  beforeEach(() => {
    vi.mocked(buscarMembros).mockReset();
    vi.mocked(criarTreino).mockReset();
    vi.mocked(atualizarTreino).mockReset();
    onSalvo.mockReset();
    onCancelar.mockReset();
    onEnviando.mockReset();
    vi.mocked(buscarMembros).mockResolvedValue({ membros: [fulano], total: 1 });
    // Só o relógio: "hoje" em São Paulo fica 2026-11-11.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("criar", () => {
    it("envia os dados do treino e avisa que salvou", async () => {
      vi.mocked(criarTreino).mockResolvedValue({ ...salvo, id: "t2" });
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario);
      await salvar(usuario);

      await waitFor(() => expect(onSalvo).toHaveBeenCalledTimes(1));
      expect(criarTreino).toHaveBeenCalledWith({
        membroId: "m1",
        tipo: "Cardio",
        descricao: "Esteira e bicicleta",
        duracao: 45,
        dataInicio: "2026-11-12",
      });
      expect(onEnviando).toHaveBeenCalledWith(true);
    });

    it("busca só membros ativos (RN04) e limita a data ao dia de hoje", async () => {
      const usuario = userEvent.setup();
      renderizar();

      await escolherMembro(usuario);

      expect(buscarMembros).toHaveBeenCalledWith("Ful", { incluirInativos: false });
      expect(screen.getByLabelText("Início")).toHaveAttribute("min", "2026-11-11");
    });

    it("oferece no select os tipos da RN05", () => {
      renderizar();

      const opcoes = Array.from(
        (screen.getByLabelText("Tipo") as HTMLSelectElement).options,
        (opcao) => opcao.value,
      );

      expect(opcoes).toEqual([
        "",
        "Musculação",
        "Cardio",
        "Funcional",
        "Alongamento",
        "Crossfit",
        "Outro",
      ]);
    });

    it("mostra os erros e não envia com o formulário vazio", async () => {
      const usuario = userEvent.setup();
      renderizar();

      await salvar(usuario);

      expect(screen.getByText("Selecione o membro")).toBeInTheDocument();
      expect(screen.getByText(MENSAGEM_TIPO_TREINO)).toBeInTheDocument();
      expect(screen.getByText("descricao deve ter entre 3 e 500 caracteres")).toBeInTheDocument();
      expect(screen.getByText("duracao deve ser um número inteiro de minutos")).toBeInTheDocument();
      expect(
        screen.getByText("dataInicio deve ser uma data válida no formato AAAA-MM-DD"),
      ).toBeInTheDocument();
      expect(criarTreino).not.toHaveBeenCalled();
    });

    it.each([
      ["0", "duracao deve ser no mínimo 1 minuto"],
      ["301", "duracao deve ser no máximo 300 minutos"],
      ["1.5", "duracao deve ser um número inteiro de minutos"],
    ])("duração %s é barrada com a mensagem da API", async (valor, mensagem) => {
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario, { duracao: valor });
      await salvar(usuario);

      expect(screen.getByText(mensagem)).toBeInTheDocument();
      expect(criarTreino).not.toHaveBeenCalled();
    });

    it.each(["1", "300"])("duração %s, no limite, é aceita", async (valor) => {
      vi.mocked(criarTreino).mockResolvedValue(salvo);
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario, { duracao: valor });
      await salvar(usuario);

      await waitFor(() => expect(onSalvo).toHaveBeenCalled());
      expect(criarTreino).toHaveBeenCalledWith(expect.objectContaining({ duracao: Number(valor) }));
    });

    it("RN05: data de início no passado bloqueia o envio", async () => {
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario, { dataInicio: "2026-11-10" });
      await salvar(usuario);

      expect(screen.getByText("dataInicio não pode ser anterior a hoje")).toBeInTheDocument();
      expect(criarTreino).not.toHaveBeenCalled();
    });

    it("RN05: a data de hoje é aceita", async () => {
      vi.mocked(criarTreino).mockResolvedValue(salvo);
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario, { dataInicio: "2026-11-11" });
      await salvar(usuario);

      await waitFor(() => expect(onSalvo).toHaveBeenCalled());
    });

    it("mostra o 422 da API quando o membro está inativo e deixa tentar de novo", async () => {
      vi.mocked(criarTreino).mockRejectedValue(
        new ApiError(422, "Membro inativo não pode receber treino"),
      );
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario);
      await salvar(usuario);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Membro inativo não pode receber treino",
      );
      expect(onSalvo).not.toHaveBeenCalled();
      expect(onEnviando).toHaveBeenLastCalledWith(false);
      expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    });

    it("mostra o 400 da API", async () => {
      vi.mocked(criarTreino).mockRejectedValue(
        new ApiError(400, "dataInicio não pode ser anterior a hoje"),
      );
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario);
      await salvar(usuario);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "dataInicio não pode ser anterior a hoje",
      );
    });

    it("some com o erro da API ao enviar de novo", async () => {
      vi.mocked(criarTreino)
        .mockRejectedValueOnce(new ApiError(422, "Membro inativo não pode receber treino"))
        .mockResolvedValueOnce(salvo);
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario);
      await salvar(usuario);
      await screen.findByRole("alert");
      await salvar(usuario);

      await waitFor(() => expect(onSalvo).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("não envia duas vezes enquanto salva", async () => {
      let concluir: (treino: Treino) => void = () => {};
      vi.mocked(criarTreino).mockReturnValue(
        new Promise<Treino>((resolve) => {
          concluir = resolve;
        }),
      );
      const usuario = userEvent.setup();
      renderizar();

      await preencher(usuario);
      await salvar(usuario);

      expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
      expect(criarTreino).toHaveBeenCalledTimes(1);

      await act(async () => concluir(salvo));
      expect(onSalvo).toHaveBeenCalledTimes(1);
    });

    it("o erro de membro some ao escolher um", async () => {
      const usuario = userEvent.setup();
      renderizar();

      await salvar(usuario);
      expect(screen.getByText("Selecione o membro")).toBeInTheDocument();
      await escolherMembro(usuario);

      expect(screen.queryByText("Selecione o membro")).toBeNull();
    });

    it("Cancelar chama onCancelar sem enviar", async () => {
      const usuario = userEvent.setup();
      renderizar();

      await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onCancelar).toHaveBeenCalledTimes(1);
      expect(criarTreino).not.toHaveBeenCalled();
    });
  });

  describe("editar", () => {
    it("abre com os dados do treino e sem a busca de membro", () => {
      renderizar(salvo);

      expect(screen.queryByLabelText("Membro")).toBeNull();
      expect(screen.getByText("Fulano Silva")).toBeInTheDocument();
      expect(screen.getByLabelText("Tipo")).toHaveValue("Funcional");
      expect(screen.getByLabelText("Descrição")).toHaveValue("Circuito de corpo inteiro");
      expect(screen.getByLabelText("Duração (min)")).toHaveValue(45);
      expect(screen.getByLabelText("Início")).toHaveValue("2026-10-01");
    });

    it("envia PATCH sem o membroId e aceita reenviar a data já salva no passado", async () => {
      vi.mocked(atualizarTreino).mockResolvedValue(salvo);
      const usuario = userEvent.setup();
      renderizar(salvo);

      await usuario.selectOptions(screen.getByLabelText("Tipo"), "Cardio");
      await salvar(usuario);

      await waitFor(() => expect(onSalvo).toHaveBeenCalledTimes(1));
      expect(atualizarTreino).toHaveBeenCalledWith("t1", {
        tipo: "Cardio",
        descricao: "Circuito de corpo inteiro",
        duracao: 45,
        dataInicio: "2026-10-01",
      });
      expect(criarTreino).not.toHaveBeenCalled();
    });

    it("bloqueia trocar a data por outra no passado", async () => {
      const usuario = userEvent.setup();
      renderizar(salvo);

      fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-10-02" } });
      await salvar(usuario);

      expect(screen.getByText("dataInicio não pode ser anterior a hoje")).toBeInTheDocument();
      expect(atualizarTreino).not.toHaveBeenCalled();
    });

    it("respeita os limites de duração também na edição", async () => {
      const usuario = userEvent.setup();
      renderizar(salvo);

      fireEvent.change(screen.getByLabelText("Duração (min)"), { target: { value: "301" } });
      await salvar(usuario);

      expect(screen.getByText("duracao deve ser no máximo 300 minutos")).toBeInTheDocument();
      expect(atualizarTreino).not.toHaveBeenCalled();
    });

    it("mostra o erro da API ao editar", async () => {
      vi.mocked(atualizarTreino).mockRejectedValue(new ApiError(404, "Treino não encontrado"));
      const usuario = userEvent.setup();
      renderizar(salvo);

      await salvar(usuario);

      expect(await screen.findByRole("alert")).toHaveTextContent("Treino não encontrado");
      expect(onSalvo).not.toHaveBeenCalled();
    });
  });
});
