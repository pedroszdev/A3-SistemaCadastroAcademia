import { API_URL } from "./api-url";
import { COOKIE_TOKEN, COOKIE_TOKEN_APAGADO, lerCookie } from "./sessao";

const METODOS_SEM_CORPO = ["GET", "HEAD"];
// Lista fechada: set-cookie, content-encoding, content-length e afins da API ficam de fora de propósito.
const HEADERS_DA_RESPOSTA = [
  "content-type",
  "content-disposition",
  "retry-after",
  "cache-control",
  "etag",
  "last-modified",
];

function rotaBloqueada(caminho: string[]): boolean {
  if (caminho.some((segmento) => segmento === "." || segmento === "..")) {
    return true;
  }
  return (
    caminho[0]?.toLowerCase() === "auth" &&
    caminho[1]?.toLowerCase().startsWith("login") === true
  );
}

// Defesa contra CSRF, além do SameSite do cookie: métodos com corpo só passam se o Origin for do próprio site.
function origemPermitida(req: Request): boolean {
  if (METODOS_SEM_CORPO.includes(req.method)) return true;

  const origem = req.headers.get("origin");
  if (!origem) return true;

  const esperado =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    new URL(req.url).host;
  try {
    return new URL(origem).host === esperado;
  } catch {
    return false;
  }
}

export async function repassarParaApi(
  req: Request,
  caminho: string[],
): Promise<Response> {
  if (rotaBloqueada(caminho)) {
    return Response.json(
      { statusCode: 404, message: "Não encontrado", error: "Not Found" },
      { status: 404 },
    );
  }
  if (!origemPermitida(req)) {
    return Response.json(
      { statusCode: 403, message: "Origem não permitida", error: "Forbidden" },
      { status: 403 },
    );
  }

  const url = `${API_URL}/${caminho.map(encodeURIComponent).join("/")}${new URL(req.url).search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const token = lerCookie(req.headers.get("cookie"), COOKIE_TOKEN);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body: METODOS_SEM_CORPO.includes(req.method) ? undefined : await req.text(),
    });
  } catch {
    return Response.json(
      { statusCode: 502, message: "API indisponível", error: "Bad Gateway" },
      { status: 502 },
    );
  }

  const respostaHeaders = new Headers();
  for (const nome of HEADERS_DA_RESPOSTA) {
    const valor = res.headers.get(nome);
    if (valor) respostaHeaders.set(nome, valor);
  }
  if (!respostaHeaders.has("content-type")) {
    respostaHeaders.set("Content-Type", "application/json");
  }
  if (res.status === 401) {
    respostaHeaders.append("Set-Cookie", COOKIE_TOKEN_APAGADO);
  }

  return new Response(res.status === 204 ? null : await res.arrayBuffer(), {
    status: res.status,
    headers: respostaHeaders,
  });
}
