import { tamanho } from "@/features/funcionarios/validacao";
import { hojeEmSaoPaulo } from "@/features/historico/validacao";
import { ehTipoTreino, MENSAGEM_TIPO_TREINO } from "./tipos";

export type ErrosTreino = Partial<
  Record<"membro" | "tipo" | "descricao" | "duracao" | "dataInicio", string>
>;

// Iguais a @Min e @Max de create-treino.dto.ts.
export const DURACAO_MINIMA = 1;
export const DURACAO_MAXIMA = 300;

type Valores = {
  membroId: string | null;
  tipo: string;
  descricao: string;
  duracao: string;
  dataInicio: string;
};

type Contexto = {
  hoje: string;
  // Presente só na edição: o membro não muda e a data já salva pode ficar como está (AAAA-MM-DD).
  salvo?: { dataInicio: string };
};

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

function validarDuracao(texto: string): string | undefined {
  const duracao = Number(texto);
  if (texto.trim() === "" || !Number.isInteger(duracao)) {
    return "duracao deve ser um número inteiro de minutos";
  }
  if (duracao < DURACAO_MINIMA) return `duracao deve ser no mínimo ${DURACAO_MINIMA} minuto`;
  if (duracao > DURACAO_MAXIMA) return `duracao deve ser no máximo ${DURACAO_MAXIMA} minutos`;
  return undefined;
}

// Mensagens iguais às da API (create-treino.dto.ts e treinos.service.ts) onde ela tem uma.
export function validarTreino(
  valores: Valores,
  { hoje = hojeEmSaoPaulo(), salvo }: Partial<Contexto> = {},
): ErrosTreino {
  const erros: ErrosTreino = {};
  if (!salvo && !valores.membroId) erros.membro = "Selecione o membro";

  if (!ehTipoTreino(valores.tipo)) erros.tipo = MENSAGEM_TIPO_TREINO;

  const tamanhoDescricao = tamanho(valores.descricao.trim());
  if (tamanhoDescricao < 3 || tamanhoDescricao > 500) {
    erros.descricao = "descricao deve ter entre 3 e 500 caracteres";
  }

  const erroDuracao = validarDuracao(valores.duracao);
  if (erroDuracao) erros.duracao = erroDuracao;

  if (!FORMATO_DATA.test(valores.dataInicio)) {
    erros.dataInicio = "dataInicio deve ser uma data válida no formato AAAA-MM-DD";
  } else if (valores.dataInicio < hoje && valores.dataInicio !== salvo?.dataInicio) {
    // RN05: só a data nova precisa ser de hoje em diante; reenviar a já salva passa.
    erros.dataInicio = "dataInicio não pode ser anterior a hoje";
  }

  return erros;
}
