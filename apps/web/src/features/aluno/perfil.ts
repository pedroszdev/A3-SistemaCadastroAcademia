const API_URL = process.env.API_URL ?? "http://localhost:3000";
const TEMPO_LIMITE_MS = 5_000;

export type PerfilDoAluno = { nome: string | null; semAcesso: boolean };

// 401 quer dizer que a API não aceita mais o token (aluno desativado ou acesso
// revogado): o portal encerra a sessão. Qualquer outra falha não derruba o
// portal, só deixa o cabeçalho sem o nome.
export async function buscarPerfilDoAluno(token: string): Promise<PerfilDoAluno> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
    if (res.status === 401) return { nome: null, semAcesso: true };
    if (!res.ok) return { nome: null, semAcesso: false };
    const { nome } = (await res.json()) as { nome?: unknown };
    return { nome: typeof nome === "string" ? nome : null, semAcesso: false };
  } catch {
    return { nome: null, semAcesso: false };
  }
}
