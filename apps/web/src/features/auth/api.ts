export const MENSAGEM_LOGIN_INVALIDO = "Login ou senha inválidos.";
export const MENSAGEM_FALHA_LOGIN = "Não foi possível entrar agora. Tente novamente.";

export type Credenciais = { login: string; senha: string };

// Chama o handler do Next em app/api/sessao, que grava o token no cookie httpOnly.
export async function entrar(credenciais: Credenciais): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/sessao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais),
    });
  } catch {
    throw new Error(MENSAGEM_FALHA_LOGIN);
  }

  if (res.ok) return;
  throw new Error(res.status === 401 ? MENSAGEM_LOGIN_INVALIDO : MENSAGEM_FALHA_LOGIN);
}

export async function sair(): Promise<void> {
  const res = await fetch("/api/sessao", { method: "DELETE" });
  if (!res.ok) throw new Error("Não foi possível sair. Tente novamente.");
}
