export const MENSAGEM_LOGIN_INVALIDO = "Login ou senha inválidos.";
export const MENSAGEM_FALHA_LOGIN = "Não foi possível entrar agora. Tente novamente.";

export const MENSAGEM_CPF_INVALIDO = "CPF ou senha inválidos.";

export type Credenciais = { login: string; senha: string };
export type CredenciaisAluno = { cpf: string; senha: string };

// Chama os handlers do Next em app/api/sessao, que gravam o token no cookie httpOnly.
async function abrirSessao(
  url: string,
  corpo: object,
  mensagemInvalida: string,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new Error(MENSAGEM_FALHA_LOGIN);
  }

  if (res.ok) return;
  throw new Error(res.status === 401 ? mensagemInvalida : MENSAGEM_FALHA_LOGIN);
}

export function entrar(credenciais: Credenciais): Promise<void> {
  return abrirSessao("/api/sessao", credenciais, MENSAGEM_LOGIN_INVALIDO);
}

export function entrarAluno(credenciais: CredenciaisAluno): Promise<void> {
  return abrirSessao("/api/sessao/aluno", credenciais, MENSAGEM_CPF_INVALIDO);
}

export async function sair(): Promise<void> {
  const res = await fetch("/api/sessao", { method: "DELETE" });
  if (!res.ok) throw new Error("Não foi possível sair. Tente novamente.");
}
