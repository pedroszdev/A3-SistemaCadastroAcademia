import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cargo } from '../generated/prisma/enums';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './roles.guard';
import { UsuarioAutenticado } from './usuario-autenticado';

const MENSAGEM = 'Você não tem permissão para acessar este recurso';

@Roles(Cargo.ADMIN)
class ControllerDoAdmin {
  restrito() {
    return undefined;
  }

  @Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
  varios() {
    return undefined;
  }

  @Roles(Cargo.RECEPCIONISTA)
  sobrescreve() {
    return undefined;
  }

  @Roles()
  vazio() {
    return undefined;
  }
}

class ControllerAberto {
  livre() {
    return undefined;
  }
}

function usuario(cargo: Cargo): UsuarioAutenticado {
  return { id: 'x', tipo: 'FUNCIONARIO', cargo };
}

function contexto(
  alvo: new () => object,
  metodo: string,
  user?: UsuarioAutenticado,
): ExecutionContext {
  const handler = (alvo.prototype as Record<string, () => unknown>)[metodo];
  return {
    getHandler: () => handler,
    getClass: () => alvo,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
  });

  it('libera rota sem @Roles, mesmo sem usuário', () => {
    expect(guard.canActivate(contexto(ControllerAberto, 'livre'))).toBe(true);
  });

  it('libera o cargo permitido', () => {
    const ctx = contexto(ControllerDoAdmin, 'restrito', usuario(Cargo.ADMIN));

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('libera um dos vários cargos permitidos', () => {
    const ctx = contexto(
      ControllerDoAdmin,
      'varios',
      usuario(Cargo.RECEPCIONISTA),
    );

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it.each([Cargo.RECEPCIONISTA, Cargo.INSTRUTOR])(
    'nega o cargo %s fora da lista com 403 em português',
    (cargo) => {
      const ctx = contexto(ControllerDoAdmin, 'restrito', usuario(cargo));

      expect(() => guard.canActivate(ctx)).toThrow(
        new ForbiddenException(MENSAGEM),
      );
    },
  );

  it('nega rota com @Roles quando não há usuário', () => {
    const ctx = contexto(ControllerDoAdmin, 'restrito');

    expect(() => guard.canActivate(ctx)).toThrow(
      new ForbiddenException(MENSAGEM),
    );
  });

  it('nega todo mundo quando @Roles vem vazio', () => {
    const ctx = contexto(ControllerDoAdmin, 'vazio', usuario(Cargo.ADMIN));

    expect(() => guard.canActivate(ctx)).toThrow(
      new ForbiddenException(MENSAGEM),
    );
  });

  it('@Roles do método sobrescreve o da classe', () => {
    const admin = contexto(
      ControllerDoAdmin,
      'sobrescreve',
      usuario(Cargo.ADMIN),
    );
    const recepcionista = contexto(
      ControllerDoAdmin,
      'sobrescreve',
      usuario(Cargo.RECEPCIONISTA),
    );

    expect(() => guard.canActivate(admin)).toThrow(ForbiddenException);
    expect(guard.canActivate(recepcionista)).toBe(true);
  });
});
