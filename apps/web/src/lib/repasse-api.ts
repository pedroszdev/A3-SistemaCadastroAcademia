import { COOKIE_TOKEN, COOKIE_TOKEN_APAGADO, lerCookie } from "./sessao";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const METODOS_SEM_CORPO = ["GET", "HEAD"];

function rotaBloqueada(caminho: string[]): boolean {
  if (caminho.some((segmento) => segmento === "." || segmento === "..")) {
    return true;
  }
  return (
    caminho[0]?.toLowerCase() === "auth" &&
    caminho[1]?.toLowerCase().startsWith("login") === true
  );
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

  const respostaHeaders = new Headers({
    "Content-Type": res.headers.get("content-type") ?? "application/json",
  });
  if (res.status === 401) {
    respostaHeaders.append("Set-Cookie", COOKIE_TOKEN_APAGADO);
  }

  return new Response(res.status === 204 ? null : await res.text(), {
    status: res.status,
    headers: respostaHeaders,
  });
}
