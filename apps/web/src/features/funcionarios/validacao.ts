import { OPCOES_CARGO } from "./cargos";

export type ModoForm = "criar" | "editar";

export type ErrosFuncionario = Partial<
  Record<"nome" | "login" | "cargo" | "senha", string>
>;

type Valores = { nome: string; login: string; cargo: string; senha: string };

const MAX_BYTES_SENHA = 72;

// Mesma contagem do isLength do validator, que o Length e o MinLength da API usam:
// um emoji (par surrogate) vale 1, não 2, e o seletor de variação (o ️ de "❤️")
// não conta.
export function tamanho(texto: string): number {
  const pares = texto.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length ?? 0;
  const variacoes = texto.match(/[^️︎][️︎]/g)?.length ?? 0;
  return texto.length - pares - variacoes;
}

function validarSenha(senha: string): string | undefined {
  if (tamanho(senha) < 8) return "senha deve ter no mínimo 8 caracteres";
  if (new TextEncoder().encode(senha).length > MAX_BYTES_SENHA) {
    return "senha deve ter no máximo 72 bytes";
  }
  return undefined;
}

function validarLogin(login: string): string | undefined {
  const tamanhoLogin = tamanho(login);
  if (tamanhoLogin < 3 || tamanhoLogin > 30) {
    return "login deve ter entre 3 e 30 caracteres";
  }
  if (!/^[a-zA-Z0-9]+$/.test(login)) return "login deve ter apenas letras e números";
  return undefined;
}

export function validarFuncionario(valores: Valores, modo: ModoForm): ErrosFuncionario {
  const erros: ErrosFuncionario = {};
  const tamanhoNome = tamanho(valores.nome.trim());

  if (tamanhoNome < 3 || tamanhoNome > 100) {
    erros.nome = "nome deve ter entre 3 e 100 caracteres";
  }

  if (!valores.cargo) {
    erros.cargo = "Selecione o cargo";
  } else if (!OPCOES_CARGO.some((opcao) => opcao.valor === valores.cargo)) {
    erros.cargo = "cargo deve ser ADMIN, RECEPCIONISTA ou INSTRUTOR";
  }

  if (modo === "criar") {
    const erroLogin = validarLogin(valores.login.trim());
    if (erroLogin) erros.login = erroLogin;
  }

  if (modo === "criar" || valores.senha !== "") {
    const erroSenha = validarSenha(valores.senha);
    if (erroSenha) erros.senha = erroSenha;
  }

  return erros;
}
