import { COOKIE_TOKEN_APAGADO, cookieDoToken, segundosAteExpirar } from "./sessao";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const MENSAGEM_CREDENCIAL_INVALIDA = "Login ou senha inválidos";

type RespostaLogin = {
  accessToken: string;
  funcionario: { id: string; nome: string; cargo: string };
};

function erro(status: number, message: string, error: string) {
  return Response.json({ statusCode: status, message, error }, { status });
}

async function lerCredenciais(req: Request) {
  try {
    const corpo = (await req.json()) as { login?: unknown; senha?: unknown };
    return { login: corpo?.login, senha: corpo?.senha };
  } catch {
    return { login: undefined, senha: undefined };
  }
}

function ehJson(contentType: string | null): boolean {
  return contentType?.split(";")[0].trim().toLowerCase() === "application/json";
}

// O login passa por aqui, e não pelo repasse, para o token ir direto para um
// cookie httpOnly sem nunca chegar ao JavaScript do navegador.
export async function criarSessao(req: Request): Promise<Response> {
  // Só JSON: outro site não consegue mandar application/json sem preflight,
  // então um <form> de fora não grava o cookie de outra conta (login CSRF).
  if (!ehJson(req.headers.get("content-type"))) {
    return erro(415, "O corpo precisa ser JSON", "Unsupported Media Type");
  }

  const credenciais = await lerCredenciais(req);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais),
    });
  } catch {
    return erro(502, "API indisponível", "Bad Gateway");
  }

  // 400 (campo faltando) e 401 viram a mesma mensagem genérica (RN12).
  if (res.status === 400 || res.status === 401) {
    return erro(401, MENSAGEM_CREDENCIAL_INVALIDA, "Unauthorized");
  }
  if (!res.ok) {
    return erro(502, "API indisponível", "Bad Gateway");
  }

  const { accessToken, funcionario } = (await res.json()) as RespostaLogin;
  const agora = Math.floor(Date.now() / 1000);

  return Response.json(
    { funcionario },
    {
      headers: {
        "Set-Cookie": cookieDoToken(accessToken, segundosAteExpirar(accessToken, agora)),
      },
    },
  );
}

// O JWT é stateless: sair é só apagar o cookie.
export function encerrarSessao(): Response {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": COOKIE_TOKEN_APAGADO },
  });
}
