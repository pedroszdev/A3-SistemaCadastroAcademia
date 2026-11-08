import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { buscarPerfilDoAluno } from "./perfil";
import { PortalDoAluno } from "./portal-do-aluno";

const cookie = vi.hoisted(() => ({ valor: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookie.valor === undefined ? undefined : { value: cookie.valor }),
  }),
}));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`redirect:${destino}`);
  }),
  usePathname: () => "/aluno",
}));
vi.mock("./perfil", () => ({ buscarPerfilDoAluno: vi.fn() }));
vi.mock("@/features/auth/api", () => ({ sair: () => new Promise(() => {}) }));

function jwt(payload: Record<string, unknown>) {
  return `cabecalho.${btoa(JSON.stringify(payload)).replaceAll("=", "")}.assinatura`;
}

const daquiUmaHora = () => Math.floor(Date.now() / 1000) + 3600;

async function renderizarPortal() {
  const portal = await PortalDoAluno({ children: <p>conteúdo da página</p> });
  render(<ToastProvider>{portal}</ToastProvider>);
}

describe("PortalDoAluno", () => {
  beforeEach(() => {
    cookie.valor = undefined;
    vi.mocked(redirect).mockClear();
    vi.mocked(buscarPerfilDoAluno).mockReset();
  });

  it("manda para o login quando não há cookie", async () => {
    await expect(renderizarPortal()).rejects.toThrow("redirect:/login");
    expect(buscarPerfilDoAluno).not.toHaveBeenCalled();
  });

  it("manda o funcionário para o dashboard sem chamar o /auth/me", async () => {
    cookie.valor = jwt({ tipo: "FUNCIONARIO", cargo: "ADMIN", exp: daquiUmaHora() });

    await expect(renderizarPortal()).rejects.toThrow("redirect:/dashboard");
    expect(buscarPerfilDoAluno).not.toHaveBeenCalled();
  });

  it("encerra a sessão quando a API não aceita mais o token", async () => {
    cookie.valor = jwt({ tipo: "ALUNO", exp: daquiUmaHora() });
    vi.mocked(buscarPerfilDoAluno).mockResolvedValue({ nome: null, semAcesso: true });

    await renderizarPortal();

    expect(screen.getByText(/Sua sessão terminou/)).toBeInTheDocument();
    expect(screen.queryByText("conteúdo da página")).toBeNull();
  });

  it("mostra o nome do aluno, o menu, o Sair e o conteúdo", async () => {
    cookie.valor = jwt({ tipo: "ALUNO", exp: daquiUmaHora() });
    vi.mocked(buscarPerfilDoAluno).mockResolvedValue({ nome: "Joana Souza", semAcesso: false });

    await renderizarPortal();

    expect(buscarPerfilDoAluno).toHaveBeenCalledWith(cookie.valor);
    expect(screen.getByText("Joana Souza")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Menu do aluno" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(screen.getByText("conteúdo da página")).toBeInTheDocument();
  });

  it("leva de volta para a página inicial do portal pelo cabeçalho", async () => {
    cookie.valor = jwt({ tipo: "ALUNO", exp: daquiUmaHora() });
    vi.mocked(buscarPerfilDoAluno).mockResolvedValue({ nome: "Joana Souza", semAcesso: false });

    await renderizarPortal();

    expect(screen.getByRole("link", { name: "Academia · Portal do aluno" })).toHaveAttribute(
      "href",
      "/aluno",
    );
  });

  it("mostra \"Aluno\" no cabeçalho quando o nome não veio", async () => {
    cookie.valor = jwt({ tipo: "ALUNO", exp: daquiUmaHora() });
    vi.mocked(buscarPerfilDoAluno).mockResolvedValue({ nome: null, semAcesso: false });

    await renderizarPortal();

    expect(screen.getByText("Aluno")).toBeInTheDocument();
    expect(screen.getByText("conteúdo da página")).toBeInTheDocument();
  });
});
