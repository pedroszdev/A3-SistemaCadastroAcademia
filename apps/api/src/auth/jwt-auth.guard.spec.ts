import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Cargo } from '../generated/prisma/enums';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: JwtAuthGuard;
  const handler = () => undefined;
  class Alvo {}
  const context = {
    getHandler: () => handler,
    getClass: () => Alvo,
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canActivate', () => {
    it('libera rota pública sem chamar o Passport', () => {
      const passport = jest.spyOn(
        AuthGuard('jwt').prototype as { canActivate: () => unknown },
        'canActivate',
      );
      reflector.getAllAndOverride.mockReturnValue(true);

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        handler,
        Alvo,
      ]);
      expect(passport).not.toHaveBeenCalled();
    });

    it('delega ao Passport quando a rota não é pública', () => {
      const passport = jest
        .spyOn(
          AuthGuard('jwt').prototype as { canActivate: () => unknown },
          'canActivate',
        )
        .mockReturnValue(true);
      reflector.getAllAndOverride.mockReturnValue(undefined);

      expect(guard.canActivate(context)).toBe(true);
      expect(passport).toHaveBeenCalledWith(context);
    });
  });

  describe('handleRequest', () => {
    it('propaga o erro recebido', () => {
      const erro = new Error('banco fora do ar');

      expect(() => guard.handleRequest(erro, false)).toThrow(erro);
    });

    it.each([[false], [null]])(
      'sem usuário (%p) → 401 em português',
      (usuario) => {
        expect(() => guard.handleRequest(null, usuario)).toThrow(
          new UnauthorizedException('Token ausente, inválido ou expirado'),
        );
      },
    );

    it('devolve o usuário', () => {
      const usuario = { id: 'x', tipo: 'FUNCIONARIO', cargo: Cargo.ADMIN };

      expect(guard.handleRequest(null, usuario)).toBe(usuario);
    });
  });
});
