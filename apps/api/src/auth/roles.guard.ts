import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Cargo } from '../generated/prisma/enums';
import { ROLES_KEY } from './decorators/roles.decorator';
import type { UsuarioAutenticado } from './usuario-autenticado';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const cargos = this.reflector.getAllAndOverride<Cargo[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (cargos === undefined) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();
    if (!user || !cargos.includes(user.cargo)) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso',
      );
    }
    return true;
  }
}
