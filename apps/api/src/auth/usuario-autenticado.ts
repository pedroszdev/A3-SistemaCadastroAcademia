import { Cargo } from '../generated/prisma/enums';

export interface TokenPayload {
  sub: string;
  tipo: 'FUNCIONARIO';
  cargo: Cargo;
}

export interface UsuarioAutenticado {
  id: string;
  tipo: 'FUNCIONARIO';
  cargo: Cargo;
}
