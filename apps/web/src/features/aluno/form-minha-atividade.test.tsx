import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MENSAGEM_INADIMPLENTE } from "@/features/historico/api";
import { ApiError } from "@/lib/api";
import { FormMinhaAtividade } from "./form-minha-atividade";
import { registrarMinhaAtividade } from "./historico";
import { listarMeusTreinos, type TreinoDoAluno } from "./treinos";

vi.mock("./historico", () => ({ registrarMinhaAtividade: vi.fn() }));
vi.mock("./treinos", () => ({ listarMeusTreinos: vi.fn() }));

const treino: TreinoDoAluno = {
  id: "t1",
  tipo: "Musculação",
  descricao: "Treino A: peito, ombro e tríceps",
  duracao: 60,
  dataInicio: "2026-11-02T00:00:00.000Z",
};

function renderizar(props: Partial<Parameters<typeof FormMinhaAtividade>[0]> = {}) {
  const onSalvo = vi.fn();
  const onEnviando = vi.fn();
  render(
    <FormMinhaAtividade
      onSalvo={onSalvo}
      onCancelar={vi.fn()}
      onEnviando={onEnviando}
      {...props}
    />,
  );
  return { onSalvo, onEnviando };
}

describe("FormMinhaAtividade (RN19)", () => {
  beforeEach(() => {
    vi.mocked(registrarMinhaAtividade).mockReset();
    vi.mocked(listarMeusTreinos).mockReset();
    vi.mocked(listarMeusTreinos).mockResolvedValue({
      data: [treino],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it("lista só os treinos do aluno e sugere a duração do treino", async () => {
    const usuario = userEvent.setup();
    renderizar();

    const select = screen.getByLabelText("Treino");
    expect(select).toBeDisabled();
    await screen.findByRole("option", { name: /^Musculação · Treino A/ });
    await usuario.selectOptions(select, "t1");

    expect(screen.getByLabelText("Tempo (min)")).toHaveValue(60);
    expect(listarMeusTreinos).toHaveBeenCalledWith(undefined, 1);
  });

  it("registra com o treino, a data e o tempo, sem o texto em branco", async () => {
    vi.mocked(registrarMinhaAtividade).mockResolvedValue({} as never);
    const usuario = userEvent.setup();
    const { onSalvo, onEnviando } = renderizar();

    await screen.findByRole("option", { name: /^Musculação/ });
    await usuario.selectOptions(screen.getByLabelText("Treino"), "t1");
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-11-20" } });
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    expect(registrarMinhaAtividade).toHaveBeenCalledWith({
      treinoId: "t1",
      data: "2026-11-20",
      tempoExecucao: 60,
    });
    expect(onEnviando).toHaveBeenCalledWith(true);
    expect(onSalvo).toHaveBeenCalled();
  });

  it("manda a observação aparada", async () => {
    vi.mocked(registrarMinhaAtividade).mockResolvedValue({} as never);
    const usuario = userEvent.setup();
    renderizar();

    await screen.findByRole("option", { name: /^Musculação/ });
    await usuario.selectOptions(screen.getByLabelText("Treino"), "t1");
    await usuario.type(screen.getByLabelText("Observação (opcional)"), "  Só peito  ");
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    expect(registrarMinhaAtividade).toHaveBeenCalledWith(
      expect.objectContaining({ atividade: "Só peito" }),
    );
  });

  it("sem treino mostra o erro e não chama a API", async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByRole("option", { name: /^Musculação/ });

    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    expect(screen.getByText("Escolha um dos seus treinos")).toBeInTheDocument();
    expect(registrarMinhaAtividade).not.toHaveBeenCalled();
  });

  it("inadimplente: mostra o aviso e bloqueia o Registrar (RN09)", async () => {
    vi.mocked(registrarMinhaAtividade).mockRejectedValue(
      new ApiError(422, MENSAGEM_INADIMPLENTE),
    );
    const usuario = userEvent.setup();
    const { onEnviando } = renderizar();

    await screen.findByRole("option", { name: /^Musculação/ });
    await usuario.selectOptions(screen.getByLabelText("Treino"), "t1");
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(MENSAGEM_INADIMPLENTE);
    expect(screen.getByRole("button", { name: "Registrar" })).toBeDisabled();
    expect(onEnviando).toHaveBeenLastCalledWith(false);
  });

  it("outro erro da API aparece no rodapé", async () => {
    vi.mocked(registrarMinhaAtividade).mockRejectedValue(new ApiError(404, "Treino não encontrado"));
    const usuario = userEvent.setup();
    renderizar();

    await screen.findByRole("option", { name: /^Musculação/ });
    await usuario.selectOptions(screen.getByLabelText("Treino"), "t1");
    await usuario.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Treino não encontrado");
    expect(screen.getByRole("button", { name: "Registrar" })).toBeEnabled();
  });

  it("sem treinos avisa no campo", async () => {
    vi.mocked(listarMeusTreinos).mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 });
    renderizar();

    expect(await screen.findByRole("option", { name: "Você ainda não tem treinos" })).toBeInTheDocument();
  });

  it("mostra o erro ao carregar os treinos", async () => {
    vi.mocked(listarMeusTreinos).mockRejectedValue(new Error("API fora do ar"));
    renderizar();

    expect(
      await screen.findByText("Não foi possível carregar seus treinos: API fora do ar"),
    ).toBeInTheDocument();
  });
});
