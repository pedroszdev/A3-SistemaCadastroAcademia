// RN05: tipos aceitos para o treino.
export const TIPOS_TREINO = [
  'Musculação',
  'Cardio',
  'Funcional',
  'Alongamento',
  'Crossfit',
  'Outro',
] as const;
export type TipoTreino = (typeof TIPOS_TREINO)[number];
export const MENSAGEM_TIPO_TREINO = `tipo deve ser um destes: ${TIPOS_TREINO.join(', ')}`;
