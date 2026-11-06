import { Cargo } from '../generated/prisma/enums';

export type TokenPayload =
  | { sub: string; tipo: 'FUNCIONARIO'; cargo: Cargo }
  | { sub: string; tipo: 'ALUNO' };

export type UsuarioAutenticado =
  | { id: string; tipo: 'FUNCIONARIO'; cargo: Cargo }
  | { id: string; tipo: 'ALUNO' };
