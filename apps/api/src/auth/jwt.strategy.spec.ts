import { ConfigService } from '@nestjs/config';
import { Cargo } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenPayload } from './usuario-autenticado';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('JwtStrategy', () => {
  let prisma: { funcionario: { findUnique: jest.Mock } };
  let strategy: JwtStrategy;

  const payload = (extra: Partial<TokenPayload> = {}): TokenPayload => ({
    sub: ID,
    tipo: 'FUNCIONARIO',
    cargo: Cargo.ADMIN,
    ...extra,
  });

  beforeEach(() => {
    prisma = { funcionario: { findUnique: jest.fn() } };
    const config = {
      getOrThrow: jest
        .fn()
        .mockReturnValue('segredo-apenas-para-teste-com-32-caracteres'),
    };
    strategy = new JwtStrategy(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
  });

  it('exige JWT_SECRET', () => {
    const config = {
      getOrThrow: jest.fn().mockImplementation(() => {
        throw new Error('JWT_SECRET não definido');
      }),
    };

    expect(
      () =>
        new JwtStrategy(
          config as unknown as ConfigService,
          prisma as unknown as PrismaService,
        ),
    ).toThrow('JWT_SECRET');
  });

  it('recusa JWT_SECRET com menos de 32 caracteres', () => {
    const config = {
      getOrThrow: jest.fn().mockReturnValue('a'.repeat(31)),
    };

    expect(
      () =>
        new JwtStrategy(
          config as unknown as ConfigService,
          prisma as unknown as PrismaService,
        ),
    ).toThrow('JWT_SECRET muito curto');
  });

  it('devolve o usuário com o cargo atual do banco', async () => {
    prisma.funcionario.findUnique.mockResolvedValue({
      id: ID,
      cargo: Cargo.INSTRUTOR,
      ativo: true,
    });

    await expect(strategy.validate(payload())).resolves.toEqual({
      id: ID,
      tipo: 'FUNCIONARIO',
      cargo: Cargo.INSTRUTOR,
    });
    expect(prisma.funcionario.findUnique).toHaveBeenCalledWith({
      where: { id: ID },
      select: { id: true, cargo: true, ativo: true },
    });
  });

  it('recusa funcionário desativado depois do login', async () => {
    prisma.funcionario.findUnique.mockResolvedValue({
      id: ID,
      cargo: Cargo.ADMIN,
      ativo: false,
    });

    await expect(strategy.validate(payload())).resolves.toBeNull();
  });

  it('recusa funcionário inexistente', async () => {
    prisma.funcionario.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload())).resolves.toBeNull();
  });

  it('recusa token com tipo diferente de FUNCIONARIO sem consultar o banco', async () => {
    const outroTipo = {
      ...payload(),
      tipo: 'MEMBRO',
    } as unknown as TokenPayload;

    await expect(strategy.validate(outroTipo)).resolves.toBeNull();
    expect(prisma.funcionario.findUnique).not.toHaveBeenCalled();
  });

  // Sem essa barreira, o Postgres recusa o id e a requisição vira 500.
  it.each([['abc'], [undefined], [123]])(
    'recusa token com sub %p sem consultar o banco',
    async (sub) => {
      const subInvalido = { ...payload(), sub } as unknown as TokenPayload;

      await expect(strategy.validate(subInvalido)).resolves.toBeNull();
      expect(prisma.funcionario.findUnique).not.toHaveBeenCalled();
    },
  );
});
