import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { UsuarioProvider } from "@/features/auth/usuario";
import { ApiError } from "@/lib/api";
import type { UsuarioDoToken } from "@/lib/sessao";
import { liberarAcesso, revogarAcesso } from "./acesso";
import { AcessoDoMembro } from "./acesso-do-membro";
import type { Membro } from "./api";

vi.mock("./acesso", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("./acesso")>()),
  liberarAcesso: vi.fn(),
  revogarAcesso: vi.fn(),
}));

const admin: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "ADMIN" };
const recepcionista: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "RECEPCIONISTA" };
const instrutor: UsuarioDoToken = { tipo: "FUNCIONARIO", cargo: "INSTRUTOR" };

type Props = { ativo?: boolean; acessoLiberado?: boolean; onAlterado?: () => void };

function elemento(usuario: UsuarioDoToken, { ativo = true, acessoLiberado = false, onAlterado }: Props) {
  return (
    <UsuarioProvider usuario={usuario}>
      <ToastProvider>
        <AcessoDoMembro
          membroId="m1"
          ativo={ativo}
          acessoLiberado={acessoLiberado}
          onAlterado={onAlterado}
        />
      </ToastProvider>
    </UsuarioProvider>
  );
}

function renderizar(usuario: UsuarioDoToken = admin, props: Props = {}) {
  return render(elemento(usuario, props));
}

function membro(acessoLiberado: boolean) {
  return { id: "m1", acessoLiberado } as Membro;
}

function botao(nome: string) {
  return screen.queryByRole("button", { name: nome });
}

async function preencher(senha: string, confirmacao: string) {
  await userEvent.type(screen.getByLabelText("Nova senha"), senha);
  await userEvent.type(screen.getByLabelText("Confirmar senha"), confirmacao);
}

describe("AcessoDoMembro", () => {
  beforeEach(() => {
    vi.mocked(liberarAcesso).mockReset();
    vi.mocked(revogarAcesso).mockReset();
  });

  it("mostra o badge conforme o acesso, para qualquer usuário", () => {
    const { unmount } = renderizar(instrutor, { acessoLiberado: true });
    expect(screen.getByText("Acesso liberado")).toBeInTheDocument();
    unmount();

    renderizar(instrutor, { acessoLiberado: false });
    expect(screen.getByText("Sem acesso")).toBeInTheDocument();
  });

  it.each([
    ["ADMIN", admin],
    ["RECEPCIONISTA", recepcionista],
  ])("%s vê Liberar acesso quando não há acesso", (_cargo, usuario) => {
    renderizar(usuario);

    expect(botao("Liberar acesso")).toBeInTheDocument();
    expect(botao("Redefinir senha")).not.toBeInTheDocument();
    expect(botao("Revogar acesso")).not.toBeInTheDocument();
  });

  it.each([
    ["ADMIN", admin],
    ["RECEPCIONISTA", recepcionista],
  ])("%s vê Redefinir senha e Revogar acesso quando há acesso", (_cargo, usuario) => {
    renderizar(usuario, { acessoLiberado: true });

    expect(botao("Redefinir senha")).toBeInTheDocument();
    expect(botao("Revogar acesso")).toBeInTheDocument();
    expect(botao("Liberar acesso")).not.toBeInTheDocument();
  });

  it("INSTRUTOR não vê botões", () => {
    renderizar(instrutor, { acessoLiberado: true });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("membro inativo mostra o aviso e só deixa revogar", () => {
    renderizar(admin, { ativo: false, acessoLiberado: true });

    expect(screen.getByText("Membro inativo não pode receber acesso ao portal.")).toBeInTheDocument();
    expect(botao("Liberar acesso")).not.toBeInTheDocument();
    expect(botao("Redefinir senha")).not.toBeInTheDocument();
    expect(botao("Revogar acesso")).toBeInTheDocument();
  });

  it("membro inativo sem acesso não mostra botões", () => {
    renderizar(admin, { ativo: false });

    expect(screen.getByText("Membro inativo não pode receber acesso ao portal.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("valida senha curta e confirmação diferente sem chamar a API", async () => {
    renderizar();
    await userEvent.click(botao("Liberar acesso")!);

    await preencher("curta", "outra");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("senha deve ter no mínimo 8 caracteres")).toBeInTheDocument();
    expect(screen.getByText("as senhas não conferem")).toBeInTheDocument();
    expect(liberarAcesso).not.toHaveBeenCalled();
  });

  it("libera o acesso com senha válida", async () => {
    vi.mocked(liberarAcesso).mockResolvedValue(membro(true));
    const onAlterado = vi.fn();
    renderizar(admin, { onAlterado });
    await userEvent.click(botao("Liberar acesso")!);

    await preencher("senha1234", "senha1234");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(liberarAcesso).toHaveBeenCalledWith("m1", "senha1234");
    expect(await screen.findByText("Acesso liberado.")).toBeInTheDocument();
    expect(screen.getByText("Acesso liberado")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onAlterado).toHaveBeenCalledTimes(1);
  });

  it("avisa Senha redefinida quando o acesso já estava liberado", async () => {
    vi.mocked(liberarAcesso).mockResolvedValue(membro(true));
    renderizar(admin, { acessoLiberado: true });
    await userEvent.click(botao("Redefinir senha")!);

    await preencher("senha1234", "senha1234");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Senha redefinida.")).toBeInTheDocument();
  });

  it("mantém o modal aberto com a mensagem da API quando ela recusa", async () => {
    vi.mocked(liberarAcesso).mockRejectedValue(
      new ApiError(422, "Membro inativo não pode ter o acesso liberado"),
    );
    const onAlterado = vi.fn();
    renderizar(admin, { onAlterado });
    await userEvent.click(botao("Liberar acesso")!);

    await preencher("senha1234", "senha1234");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Membro inativo não pode ter o acesso liberado",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onAlterado).not.toHaveBeenCalled();
  });

  it("revoga o acesso depois da confirmação", async () => {
    vi.mocked(revogarAcesso).mockResolvedValue(membro(false));
    const onAlterado = vi.fn();
    renderizar(admin, { acessoLiberado: true, onAlterado });

    await userEvent.click(botao("Revogar acesso")!);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(revogarAcesso).toHaveBeenCalledWith("m1");
    expect(await screen.findByText("Acesso revogado.")).toBeInTheDocument();
    expect(screen.getByText("Sem acesso")).toBeInTheDocument();
    expect(onAlterado).toHaveBeenCalledTimes(1);
  });

  it("mostra toast de erro quando a revogação falha", async () => {
    vi.mocked(revogarAcesso).mockRejectedValue(new ApiError(500, "Erro interno"));
    renderizar(admin, { acessoLiberado: true });

    await userEvent.click(botao("Revogar acesso")!);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("Erro interno")).toBeInTheDocument();
    expect(screen.getByText("Acesso liberado")).toBeInTheDocument();
  });

  it("atualiza o badge quando a prop acessoLiberado muda", () => {
    const { rerender } = renderizar(admin, { acessoLiberado: false });
    expect(screen.getByText("Sem acesso")).toBeInTheDocument();

    rerender(elemento(admin, { acessoLiberado: true }));

    expect(screen.getByText("Acesso liberado")).toBeInTheDocument();
  });
});
