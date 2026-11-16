// RN05: mesmos tipos de apps/api/src/treinos/tipos-treino.ts.
export const TIPOS_TREINO = [
  "Musculação",
  "Cardio",
  "Funcional",
  "Alongamento",
  "Crossfit",
  "Outro",
] as const;

export type TipoTreino = (typeof TIPOS_TREINO)[number];

export const MENSAGEM_TIPO_TREINO = `tipo deve ser um destes: ${TIPOS_TREINO.join(", ")}`;

export const OPCOES_TIPO_TREINO = TIPOS_TREINO.map((tipo) => ({ valor: tipo, rotulo: tipo }));

export function ehTipoTreino(valor: string): valor is TipoTreino {
  return (TIPOS_TREINO as readonly string[]).includes(valor);
}
