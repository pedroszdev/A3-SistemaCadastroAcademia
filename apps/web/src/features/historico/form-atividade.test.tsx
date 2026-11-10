import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsuarioProvider } from "@/features/auth/usuario";
import { buscarMembros, type MembroBusca } from "@/features/pagamentos/api";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import {
  type Atividade,
  consultarSituacao,
  listarTreinosDoMembro,
  registrarAtividade,
  type SituacaoFinanceira,
  type TreinoDoMembro,
} from "./api";
import { FormAtividade } from "./form-atividade";
import { hojeEmSaoPaulo } from "./validacao";

vi.mock("@/features/pagamentos/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/pagamentos/api")>()),
  buscarMembros: vi.fn(),
}));

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  registrarAtividade: vi.fn(),
  listarTreinosDoMembro: vi.fn(),
  consultarSituacao: vi.fn(),
}));

const fulano: MembroBusca = { id: "m1", nome: "Fulano Silva", cpf: "12345678909" };
const fulana: MembroBusca = { id: "m2", nome: "Fulana Souza", cpf: "98765432100" };

const treinoDoFulano: TreinoDoMembro = {
  id: "t1",
  tipo: "Hipertrofia",
  dataInicio: "2026-10-01T00:00:00.000Z",
};
const treinoDaFulana: TreinoDoMembro = {
  id: "t2",
  tipo: "Resistência",
  dataInicio: "2026-09-15T00:00:00.000Z",
};

const registrada: Atividade = {
  id: "a1",
  membroId: "m1",
  funcionarioId: "f1",
  treinoId: null,
  atividade: "Esteira",
  data: "2026-11-09T00:00:00.000Z",
  tempoExecucao: 30,
  membro: { id: "m1", nome: "Fulano Silva" },
  funcionario: { id: "f1", nome: "Ana Souza" },
  treino: null,
};

const emDia: SituacaoFinanceira = { situacao: "EM_DIA", pagamentosAtrasados: 0, maiorAtrasoDias: 0 };
const inadimplente: SituacaoFinanceira = {
  situacao: "INADIMPLENTE",
  pagamentosAtrasados: 2,
  maiorAtrasoDias: 12,
};

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };

type Usuario = ReturnType<typeof userEvent.setup>;

const onSalvo = vi.fn();
const onCancelar = vi.fn();

function renderizar(usuarioLogado: UsuarioDoToken = admin) {
  render(
    <UsuarioProvider usuario={usuarioLogado}>
      <FormAtividade onSalvo={onSalvo} onCancelar={onCancelar} />
    </UsuarioProvider>,
  );
}

async function escolherMembro(usuario: Usuario, busca: string, nome: RegExp) {
  await usuario.type(screen.getByLabelText("Membro"), busca);
  await usuario.click(await screen.findByRole("button", { name: nome }));
}

async function preencher(usuario: Usuario) {
  await escolherMembro(usuario, "Ful", /Fulano Silva/);
  await usuario.type(screen.getByLabelText("Atividade"), "Esteira");
  await usuario.type(screen.getByLabelText("Tempo (min)"), "30");
}

describe("FormAtividade", () => {
  beforeEach(() => {
    vi.mocked(registrarAtividade).mockReset();
    vi.mocked(listarTreinosDoMembro).mockReset();
    vi.mocked(consultarSituacao).mockReset();
    vi.mocked(buscarMembros).mockReset();
    vi.mocked(buscarMembros).mockResolvedValue([fulano, fulana]);
    vi.mocked(listarTreinosDoMembro).mockImplementation(async (id) =>
      id === "m1" ? [treinoDoFulano] : [treinoDaFulana],
    );
    vi.mocked(consultarSituacao).mockResolvedValue(emDia);
    onSalvo.mockReset();
    onCancelar.mockReset();
  });

  it("mostra os erros de validação sem chamar a API", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("Selecione o membro")).toBeInTheDocument();
    expect(screen.getByText("atividade deve ter entre 3 e 120 caracteres")).toBeInTheDocument();
    expect(
      screen.getByText("tempoExecucao deve ser um número inteiro de minutos"),
    ).toBeInTheDocument();
    expect(registrarAtividade).not.toHaveBeenCalled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("começa com a data de hoje e limita o campo a hoje", () => {
    renderizar();

    expect(screen.getByLabelText("Data")).toHaveValue(hojeEmSaoPaulo());
    expect(screen.getByLabelText("Data")).toHaveAttribute("max", hojeEmSaoPaulo());
  });

  it("não registra com data futura (o max do campo barra o envio)", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await preencher(usuario);
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2999-12-31" } });
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(registrarAtividade).not.toHaveBeenCalled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("deixa o treino desabilitado até escolher o membro", () => {
    renderizar();

    const treino = screen.getByLabelText("Treino (opcional)");
    expect(treino).toBeDisabled();
    expect(screen.getByRole("option", { name: "Escolha o membro primeiro" })).toBeInTheDocument();
    expect(listarTreinosDoMembro).not.toHaveBeenCalled();
  });

  it("carrega os treinos do membro escolhido e manda o treinoId", async () => {
    vi.mocked(registrarAtividade).mockResolvedValue({ ...registrada, treinoId: "t1" });
    const usuario = userEvent.setup();
    renderizar();

    await preencher(usuario);
    await waitFor(() => expect(screen.getByLabelText("Treino (opcional)")).toBeEnabled());
    expect(listarTreinosDoMembro).toHaveBeenCalledWith("m1");
    expect(screen.getByRole("option", { name: "Sem treino" })).toBeInTheDocument();
    await usuario.selectOptions(
      screen.getByLabelText("Treino (opcional)"),
      screen.getByRole("option", { name: "Hipertrofia · início 01/10/2026" }),
    );
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(registrarAtividade).toHaveBeenCalledWith({
      membroId: "m1",
      treinoId: "t1",
      atividade: "Esteira",
      data: hojeEmSaoPaulo(),
      tempoExecucao: 30,
    });
    expect(onSalvo).toHaveBeenCalled();
  });

  it("limpa o treino ao trocar de membro e carrega os treinos do novo", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await escolherMembro(usuario, "Ful", /Fulano Silva/);
    await waitFor(() => expect(screen.getByLabelText("Treino (opcional)")).toBeEnabled());
    await usuario.selectOptions(screen.getByLabelText("Treino (opcional)"), "t1");
    expect(screen.getByLabelText("Treino (opcional)")).toHaveValue("t1");

    await usuario.click(screen.getByRole("button", { name: "Trocar" }));

    expect(screen.getByLabelText("Treino (opcional)")).toBeDisabled();
    expect(screen.getByLabelText("Treino (opcional)")).toHaveValue("");

    await escolherMembro(usuario, "Ful", /Fulana Souza/);
    await waitFor(() => expect(screen.getByLabelText("Treino (opcional)")).toBeEnabled());

    expect(listarTreinosDoMembro).toHaveBeenLastCalledWith("m2");
    expect(screen.getByLabelText("Treino (opcional)")).toHaveValue("");
    expect(screen.getByRole("option", { name: /Resistência/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Hipertrofia/ })).toBeNull();
  });

  it("segue sem treino quando a rota de treinos falha", async () => {
    vi.mocked(listarTreinosDoMembro).mockRejectedValue(new ApiError(404, "Cannot GET"));
    vi.mocked(registrarAtividade).mockResolvedValue(registrada);
    const usuario = userEvent.setup();
    renderizar();

    await preencher(usuario);

    expect(await screen.findByRole("option", { name: "Nenhum treino disponível" })).toBeInTheDocument();
    expect(screen.getByLabelText("Treino (opcional)")).toBeDisabled();
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(registrarAtividade).toHaveBeenCalledWith({
      membroId: "m1",
      treinoId: undefined,
      atividade: "Esteira",
      data: hojeEmSaoPaulo(),
      tempoExecucao: 30,
    });
    expect(onSalvo).toHaveBeenCalled();
  });

  it("avisa e bloqueia o Salvar quando o ADMIN escolhe um membro inadimplente (RN09)", async () => {
    vi.mocked(consultarSituacao).mockResolvedValue(inadimplente);
    const usuario = userEvent.setup();
    renderizar(admin);

    await preencher(usuario);

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveTextContent("Membro com pagamento em atraso");
    expect(aviso).toHaveTextContent("(maior atraso: 12 dias)");
    expect(consultarSituacao).toHaveBeenCalledWith("m1");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(registrarAtividade).not.toHaveBeenCalled();
  });

  it("some com o aviso ao trocar para um membro em dia", async () => {
    vi.mocked(consultarSituacao).mockImplementation(async (id) =>
      id === "m1" ? inadimplente : emDia,
    );
    const usuario = userEvent.setup();
    renderizar(admin);

    await escolherMembro(usuario, "Ful", /Fulano Silva/);
    await screen.findByRole("alert");
    await usuario.click(screen.getByRole("button", { name: "Trocar" }));
    await escolherMembro(usuario, "Ful", /Fulana Souza/);

    await waitFor(() => expect(consultarSituacao).toHaveBeenLastCalledWith("m2"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("não mostra aviso nem bloqueia quando o ADMIN escolhe um membro em dia", async () => {
    const usuario = userEvent.setup();
    renderizar(admin);

    await preencher(usuario);
    await waitFor(() => expect(consultarSituacao).toHaveBeenCalledWith("m1"));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("não bloqueia quando a consulta da situação falha", async () => {
    vi.mocked(consultarSituacao).mockRejectedValue(new ApiError(500, "Falha"));
    const usuario = userEvent.setup();
    renderizar(admin);

    await preencher(usuario);
    await waitFor(() => expect(consultarSituacao).toHaveBeenCalled());

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("o INSTRUTOR não consulta a situação e vê o aviso destacado quando o POST responde 422 de inadimplência", async () => {
    vi.mocked(registrarAtividade).mockRejectedValue(
      new ApiError(422, "Membro com pagamento em atraso"),
    );
    const usuario = userEvent.setup();
    renderizar(instrutor);

    await preencher(usuario);
    await waitFor(() => expect(listarTreinosDoMembro).toHaveBeenCalled());
    expect(consultarSituacao).not.toHaveBeenCalled();
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveTextContent("Membro com pagamento em atraso");
    expect(aviso).toHaveClass("border-amber-300");
    expect(aviso).not.toHaveClass("text-red-600");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("mostra outro 422 como texto vermelho comum e mantém o Salvar habilitado", async () => {
    vi.mocked(registrarAtividade).mockRejectedValue(
      new ApiError(422, "Treino não pertence ao membro"),
    );
    const usuario = userEvent.setup();
    renderizar(instrutor);

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    const erro = await screen.findByRole("alert");
    expect(erro).toHaveTextContent("Treino não pertence ao membro");
    expect(erro).toHaveClass("text-red-600");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("mostra erro de rede como texto vermelho comum", async () => {
    vi.mocked(registrarAtividade).mockRejectedValue(new Error("Falha de rede"));
    const usuario = userEvent.setup();
    renderizar(instrutor);

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha de rede");
  });

  it("registra com o body certo, apara a atividade e chama onSalvo", async () => {
    vi.mocked(registrarAtividade).mockResolvedValue(registrada);
    const usuario = userEvent.setup();
    renderizar(instrutor);

    await escolherMembro(usuario, "Ful", /Fulano Silva/);
    await usuario.type(screen.getByLabelText("Atividade"), "  Esteira  ");
    await usuario.type(screen.getByLabelText("Tempo (min)"), "45");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(registrarAtividade).toHaveBeenCalledWith({
      membroId: "m1",
      treinoId: undefined,
      atividade: "Esteira",
      data: hojeEmSaoPaulo(),
      tempoExecucao: 45,
    });
    expect(onSalvo).toHaveBeenCalled();
  });

  it("desabilita o botão enquanto envia", async () => {
    vi.mocked(registrarAtividade).mockReturnValue(new Promise(() => {}));
    const usuario = userEvent.setup();
    renderizar();

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
  });

  it("chama onCancelar sem chamar a API", async () => {
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalled();
    expect(registrarAtividade).not.toHaveBeenCalled();
  });
});
