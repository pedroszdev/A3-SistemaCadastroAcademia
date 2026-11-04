import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcryptjs';
import { FUNCIONARIO_SELECT } from '../funcionarios/funcionarios.service';
import { Cargo } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const SENHA = 'senha1234';

describe('AuthService', () => {
  let prisma: { funcionario: { findUnique: jest.Mock } };
  let jwt: { signAsync: jest.Mock };
  let service: AuthService;

  const funcionario = (extra: Record<string, unknown> = {}) => ({
    id: ID,
    nome: 'Maria Souza',
    cargo: Cargo.RECEPCIONISTA,
    login: 'maria01',
    ativo: true,
    senhaHash: hashSync(SENHA, 4),
    ...extra,
  });

  beforeEach(() => {
    prisma = { funcionario: { findUnique: jest.fn() } };
    jwt = { signAsync: jest.fn().mockResolvedValue('token-assinado') };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  it('devolve o token e o funcionário sem senhaHash', async () => {
    prisma.funcionario.findUnique.mockResolvedValue(funcionario());

    const resultado = await service.login({ login: 'maria01', senha: SENHA });

    expect(resultado).toEqual({
      accessToken: 'token-assinado',
      funcionario: {
        id: ID,
        nome: 'Maria Souza',
        cargo: Cargo.RECEPCIONISTA,
      },
    });
    expect(JSON.stringify(resultado)).not.toContain('senhaHash');
  });

  it('assina o payload com sub, tipo e cargo', async () => {
    prisma.funcionario.findUnique.mockResolvedValue(funcionario());

    await service.login({ login: 'maria01', senha: SENHA });

    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: ID,
      tipo: 'FUNCIONARIO',
      cargo: Cargo.RECEPCIONISTA,
    });
  });

  it('busca pelo login pedindo o hash no select', async () => {
    prisma.funcionario.findUnique.mockResolvedValue(funcionario());

    await service.login({ login: 'maria01', senha: SENHA });

    expect(prisma.funcionario.findUnique).toHaveBeenCalledWith({
      where: { login: 'maria01' },
      select: { ...FUNCIONARIO_SELECT, senhaHash: true },
    });
  });

  it.each([
    ['login inexistente', null, SENHA],
    ['senha errada', funcionario(), 'outra-senha'],
    ['funcionário inativo', funcionario({ ativo: false }), SENHA],
  ])('%s → 401 com mensagem genérica', async (_caso, registro, senha) => {
    prisma.funcionario.findUnique.mockResolvedValue(registro);

    const tentativa = service.login({ login: 'maria01', senha });

    await expect(tentativa).rejects.toThrow(UnauthorizedException);
    await expect(tentativa).rejects.toThrow('Login ou senha inválidos');
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('login com byte NUL → 401 genérico, sem consultar o banco', async () => {
    const tentativa = service.login({ login: 'maria\0', senha: SENHA });

    await expect(tentativa).rejects.toThrow('Login ou senha inválidos');
    expect(prisma.funcionario.findUnique).not.toHaveBeenCalled();
  });
});
