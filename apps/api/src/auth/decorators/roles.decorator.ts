import { SetMetadata } from '@nestjs/common';
import { Cargo } from '../../generated/prisma/enums';

export type Papel = Cargo | 'ALUNO';

export const ROLES_KEY = 'roles';
export const Roles = (...papeis: Papel[]) => SetMetadata(ROLES_KEY, papeis);
