import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UsuarioAutenticado } from '../usuario-autenticado';

export const UsuarioAtual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioAutenticado => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: UsuarioAutenticado }>();
    return request.user;
  },
);
