import { COOKIE_TOKEN_APAGADO, cookieDoToken, segundosAteExpirar } from "./sessao";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const MENSAGEM_CREDENCIAL_INVALIDA = "Login ou senha inválidos";

export const MENSAGEM_CREDENCIAL_ALUNO_INVALIDA = "CPF ou senha inválidos";

type ConfigLogin = {
  rota: string;
  campos: readonly string[];
  chave: string;
  mensagemInvalida: string;
};

const LOGIN_FUNCIONARIO: ConfigLogin = {
  rota: "/auth/login",
  campos: ["login", "senha"],
  chave: "funcionario",
  mensagemInvalida: MENSAGEM_CREDENCIAL_INVALIDA,
};

const LOGIN_ALUNO: ConfigLogin = {
  rota: "/auth/login-aluno",
  campos: ["cpf", "senha"],
  chave: "aluno",
  mensagemInvalida: MENSAGEM_CREDENCIAL_ALUNO_INVALIDA,
};

function erro(status: number, message: string, error: string) {
  return Response.json({ statusCode: status, message, error }, { status });
}

async function lerCredenciais(req: Request, campos: readonly string[]) {
  let corpo: Record<string, unknown> | null = null;
  try {
    corpo = (await req.json()) as Record<string, unknown> | null;
  } catch {
    // Corpo que não é JSON vira credenciais vazias: a API responde 400 e cai no 401 genérico.
  }
  return Object.fromEntries(campos.map((campo) => [campo, corpo?.[campo]]));
}

function ehJson(contentType: string | null): boolean {
  return contentType?.split(";")[0].trim().toLowerCase() === "application/json";
}

// O login passa por aqui, e não pelo repasse, para o token ir direto para um
// cookie httpOnly sem nunca chegar ao JavaScript do navegador.
async function abrirSessao(req: Request, config: ConfigLogin): Promise<Response> {
  // Só JSON: outro site não consegue mandar application/json sem preflight,
  // então um <form> de fora não grava o cookie de outra conta (login CSRF).
  if (!ehJson(req.headers.get("content-type"))) {
    return erro(415, "O corpo precisa ser JSON", "Unsupported Media Type");
  }

  const credenciais = await lerCredenciais(req, config.campos);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${config.rota}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credenciais),
    });
  } catch {
    return erro(502, "API indisponível", "Bad Gateway");
  }

  // 400 (campo faltando) e 401 viram a mesma mensagem genérica (RN12).
  if (res.status === 400 || res.status === 401) {
    return erro(401, config.mensagemInvalida, "Unauthorized");
  }
  if (!res.ok) {
    return erro(502, "API indisponível", "Bad Gateway");
  }

  const corpo = (await res.json()) as Record<string, unknown>;
  const { accessToken } = corpo;
  if (typeof accessToken !== "string") {
    return erro(502, "API indisponível", "Bad Gateway");
  }
  const agora = Math.floor(Date.now() / 1000);

  return Response.json(
    { [config.chave]: corpo[config.chave] },
    {
      headers: {
        "Set-Cookie": cookieDoToken(accessToken, segundosAteExpirar(accessToken, agora)),
      },
    },
  );
}

export function criarSessao(req: Request): Promise<Response> {
  return abrirSessao(req, LOGIN_FUNCIONARIO);
}

export function criarSessaoAluno(req: Request): Promise<Response> {
  return abrirSessao(req, LOGIN_ALUNO);
}

// O JWT é stateless: sair é só apagar o cookie.
export function encerrarSessao(): Response {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": COOKIE_TOKEN_APAGADO },
  });
}
