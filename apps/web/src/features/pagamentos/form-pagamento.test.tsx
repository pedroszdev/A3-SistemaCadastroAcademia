import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { buscarMembros, criarPagamento, type MembroBusca, type Pagamento } from "./api";
import { FormPagamento } from "./form-pagamento";

vi.mock("./api", () => ({ criarPagamento: vi.fn(), buscarMembros: vi.fn() }));

const fulano: MembroBusca = { id: "m1", nome: "Fulano Silva", cpf: "12345678909" };

const criado: Pagamento = {
  id: "p1",
  membroId: "m1",
  valor: 150.5,
  dataVencimento: "2026-11-20T00:00:00.000Z",
  dataPagamento: null,
  status: "PENDENTE",
  diasEmAtraso: 0,
  membro: { id: "m1", nome: "Fulano Silva" },
};

async function escolherMembro(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText("Membro"), "Ful");
  await usuario.click(await screen.findByRole("button", { name: /Fulano Silva/ }));
}

async function preencher(usuario: ReturnType<typeof userEvent.setup>, centavos = "15050") {
  await escolherMembro(usuario);
  await usuario.type(screen.getByLabelText("Valor"), centavos);
  fireEvent.change(screen.getByLabelText("Vencimento"), { target: { value: "2026-11-20" } });
}

describe("FormPagamento", () => {
  const onSalvo = vi.fn();
  const onCancelar = vi.fn();

  beforeEach(() => {
    // Só o relógio: os vencimentos fixos dos testes ficam dentro dos 90 dias aceitos.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T12:00:00.000Z"));
    vi.mocked(criarPagamento).mockReset();
    vi.mocked(buscarMembros).mockReset();
    vi.mocked(buscarMembros).mockResolvedValue({ membros: [fulano], total: 1 });
    onSalvo.mockReset();
    onCancelar.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lança o pagamento com o valor numérico e a data, e chama onSalvo", async () => {
    vi.mocked(criarPagamento).mockResolvedValue(criado);
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await preencher(usuario);
    expect(screen.getByText("Fulano Silva · 123.456.789-09")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor")).toHaveDisplayValue(/^R\$\s150,50$/);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(criarPagamento).toHaveBeenCalledWith({
      membroId: "m1",
      valor: 150.5,
      dataVencimento: "2026-11-20",
    });
    expect(onSalvo).toHaveBeenCalled();
  });

  it("mostra os erros de validação sem chamar a API", async () => {
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("Selecione o membro")).toBeInTheDocument();
    expect(screen.getByText("valor deve ser no mínimo 0,01")).toBeInTheDocument();
    expect(screen.getByText("Informe o vencimento")).toBeInTheDocument();
    expect(criarPagamento).not.toHaveBeenCalled();
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("recusa valor acima de 10.000", async () => {
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await preencher(usuario, "1000001");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("valor deve ser no máximo 10.000")).toBeInTheDocument();
    expect(criarPagamento).not.toHaveBeenCalled();
  });

  it("mantém o membro e volta à busca em Trocar", async () => {
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await escolherMembro(usuario);
    await usuario.click(screen.getByRole("button", { name: "Trocar" }));

    expect(screen.getByLabelText("Membro")).toBeInTheDocument();
    expect(screen.queryByText("Fulano Silva · 123.456.789-09")).toBeNull();
  });

  it("mostra o erro da API em role=alert, mantém os valores e reabilita o botão", async () => {
    vi.mocked(criarPagamento).mockRejectedValue(
      new ApiError(422, "Membro inativo não pode receber novo pagamento"),
    );
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Membro inativo não pode receber novo pagamento",
    );
    expect(onSalvo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
    expect(screen.getByText("Fulano Silva · 123.456.789-09")).toBeInTheDocument();
    expect(screen.getByLabelText("Vencimento")).toHaveValue("2026-11-20");
  });

  it("recusa vencimento com mais de 90 dias no passado e limita o campo de data", async () => {
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await escolherMembro(usuario);
    await usuario.type(screen.getByLabelText("Valor"), "15050");
    fireEvent.change(screen.getByLabelText("Vencimento"), { target: { value: "2026-08-12" } });
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByLabelText("Vencimento")).toHaveAttribute("min", "2026-08-13");
    expect(
      screen.getByText("O vencimento não pode ter mais de 90 dias no passado"),
    ).toBeInTheDocument();
    expect(criarPagamento).not.toHaveBeenCalled();
  });

  it("não mostra de novo 'Selecione o membro' ao trocar o membro já escolhido", async () => {
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByText("Selecione o membro")).toBeInTheDocument();
    await escolherMembro(usuario);
    await usuario.click(screen.getByRole("button", { name: "Trocar" }));

    expect(screen.queryByText("Selecione o membro")).toBeNull();
  });

  it.each([
    ["150", /^R\$\s150,00$/],
    ["1.234,5", /^R\$\s1\.234,50$/],
    ["R$ 89,90", /^R\$\s89,90$/],
    ["150.5", /^R\$\s150,50$/],
  ])("lê o valor colado %j com as casas decimais escritas", async (colado, esperado) => {
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.click(screen.getByLabelText("Valor"));
    await usuario.paste(colado);

    expect(screen.getByLabelText("Valor")).toHaveDisplayValue(esperado);
  });

  it("desabilita o botão enquanto envia", async () => {
    vi.mocked(criarPagamento).mockReturnValue(new Promise(() => {}));
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("avisa onEnviando ao começar e ao falhar o envio", async () => {
    const onEnviando = vi.fn();
    vi.mocked(criarPagamento).mockRejectedValue(new ApiError(422, "Membro inativo"));
    const usuario = userEvent.setup();
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} onEnviando={onEnviando} />);

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));
    await screen.findByRole("alert");

    expect(onEnviando.mock.calls).toEqual([[true], [false]]);
  });

  it("com membro fixo, não mostra a busca e lança com esse membro", async () => {
    vi.mocked(criarPagamento).mockResolvedValue(criado);
    const usuario = userEvent.setup();
    render(<FormPagamento membroId="m-fixo" onSalvo={onSalvo} onCancelar={onCancelar} />);

    expect(screen.queryByLabelText("Membro")).toBeNull();
    await usuario.type(screen.getByLabelText("Valor"), "15050");
    fireEvent.change(screen.getByLabelText("Vencimento"), { target: { value: "2026-11-20" } });
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(criarPagamento).toHaveBeenCalledWith({
      membroId: "m-fixo",
      valor: 150.5,
      dataVencimento: "2026-11-20",
    });
    expect(buscarMembros).not.toHaveBeenCalled();
    expect(onSalvo).toHaveBeenCalled();
  });

  it("com membro fixo, valida só valor e vencimento sem chamar a API", async () => {
    const usuario = userEvent.setup();
    render(<FormPagamento membroId="m-fixo" onSalvo={onSalvo} onCancelar={onCancelar} />);

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.queryByText("Selecione o membro")).toBeNull();
    expect(screen.getByText("valor deve ser no mínimo 0,01")).toBeInTheDocument();
    expect(screen.getByText("Informe o vencimento")).toBeInTheDocument();
    expect(criarPagamento).not.toHaveBeenCalled();
  });

  it("membroId vazio conta como sem membro fixo: mostra a busca e lança com o escolhido", async () => {
    vi.mocked(criarPagamento).mockResolvedValue(criado);
    const usuario = userEvent.setup();
    render(<FormPagamento membroId="" onSalvo={onSalvo} onCancelar={onCancelar} />);

    await preencher(usuario);
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(criarPagamento).toHaveBeenCalledWith({
      membroId: "m1",
      valor: 150.5,
      dataVencimento: "2026-11-20",
    });
  });

  it("chama onCancelar sem chamar a API", async () => {
    render(<FormPagamento onSalvo={onSalvo} onCancelar={onCancelar} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalled();
    expect(criarPagamento).not.toHaveBeenCalled();
  });
});
