export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// O Nest responde { statusCode, message, error }, e o message pode ser uma
// lista (erros de validação do DTO).
async function mensagemDoErro(res: Response): Promise<string> {
  const texto = await res.text();
  try {
    const { message } = JSON.parse(texto) as { message?: unknown };
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join("; ");
  } catch {
    // corpo não é JSON: usa o texto como veio
  }
  return texto;
}

// O token mora num cookie httpOnly; quem o põe no Authorization é o repasse
// em app/api/[...caminho]. Por isso o navegador chama /api, nunca a API direto.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.replace("/login");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await mensagemDoErro(res));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
