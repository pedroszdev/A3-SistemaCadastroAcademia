import { tamanho } from "@/features/funcionarios/validacao";

export type ErrosAtividade = Partial<
  Record<"membro" | "atividade" | "data" | "tempoExecucao", string>
>;

type Valores = {
  membroId: string | null;
  atividade: string;
  data: string;
  tempoExecucao: string;
};

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

const FORMATO_DIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Mesmo "hoje" da API (fuso da academia). Quem chama lê o relógio fora do render
// (regra react-hooks/purity), por isso o parâmetro.
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return FORMATO_DIA.format(agora);
}

function validarTempo(texto: string): string | undefined {
  const tempo = Number(texto);
  if (texto.trim() === "" || !Number.isInteger(tempo)) {
    return "tempoExecucao deve ser um número inteiro de minutos";
  }
  if (tempo < 1) return "tempoExecucao deve ser no mínimo 1 minuto";
  if (tempo > 600) return "tempoExecucao deve ser no máximo 600 minutos";
  return undefined;
}

// Mensagens iguais às da API (create-atividade.dto.ts) onde ela tem uma.
export function validarAtividade(valores: Valores, hoje: string = hojeEmSaoPaulo()): ErrosAtividade {
  const erros: ErrosAtividade = {};
  if (!valores.membroId) erros.membro = "Selecione o membro";

  const tamanhoAtividade = tamanho(valores.atividade.trim());
  if (tamanhoAtividade < 3 || tamanhoAtividade > 120) {
    erros.atividade = "atividade deve ter entre 3 e 120 caracteres";
  }

  if (!FORMATO_DATA.test(valores.data)) {
    erros.data = "data deve ser uma data válida no formato AAAA-MM-DD";
  } else if (valores.data > hoje) {
    erros.data = "data não pode ser uma data futura";
  }

  const erroTempo = validarTempo(valores.tempoExecucao);
  if (erroTempo) erros.tempoExecucao = erroTempo;

  return erros;
}
