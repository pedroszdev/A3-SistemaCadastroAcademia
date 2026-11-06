import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Papel, ROLES_KEY } from './decorators/roles.decorator';
import type { UsuarioAutenticado } from './usuario-autenticado';

const SEM_PERMISSAO = 'Você não tem permissão para acessar este recurso';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const papeis = this.reflector.getAllAndOverride<Papel[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();
    if (papeis === undefined) {
      // RN17: rota sem @Roles é de funcionário; o aluno só entra onde @Roles('ALUNO') libera.
      if (user?.tipo === 'ALUNO') {
        throw new ForbiddenException(SEM_PERMISSAO);
      }
      return true;
    }

    const papel = user?.tipo === 'ALUNO' ? 'ALUNO' : user?.cargo;
    if (!papel || !papeis.includes(papel)) {
      throw new ForbiddenException(SEM_PERMISSAO);
    }
    return true;
  }
}
