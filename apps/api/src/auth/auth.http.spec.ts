import {
  Controller,
  Get,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { FuncionariosService } from '../funcionarios/funcionarios.service';
import { Cargo } from '../generated/prisma/enums';
import { MembrosService } from '../membros/membros.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { UsuarioAtual } from './decorators/usuario-atual.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import type { UsuarioAutenticado } from './usuario-autenticado';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const SEGREDO = 'segredo-apenas-para-teste-com-32-caracteres';
const SENHA = 'senha1234';
const MENSAGEM_TOKEN = 'Token ausente, inválido ou expirado';
const MENSAGEM_PROIBIDO = 'Você não tem permissão para acessar este recurso';

@Controller('teste')
class TesteController {
  @Public()
  @Get('publica')
  publica() {
    return { ok: true };
  }

  @Get('protegida')
  protegida(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return usuario;
  }

  @Roles(Cargo.ADMIN)
  @Get('admin')
  admin() {
    return { ok: true };
  }
}

// Exercita guard global, strategy, JWT real e pipes sobre HTTP, sem banco.
describe('Auth (HTTP)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const prisma = {
    funcionario: { findUnique: jest.fn() },
    membro: { findUnique: jest.fn(), findFirst: jest.fn() },
  };
  const funcionarios = { findOne: jest.fn() };
  const membros = { findOne: jest.fn() };

  const registro = (extra: Record<string, unknown> = {}) => ({
    id: ID,
    nome: 'Maria Souza',
    cargo: Cargo.RECEPCIONISTA,
    login: 'maria01',
    ativo: true,
    senhaHash: hashSync(SENHA, 4),
    ...extra,
  });

  const codificar = (objeto: object) =>
    Buffer.from(JSON.stringify(objeto)).toString('base64url');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: SEGREDO,
          signOptions: { algorithm: 'HS256', expiresIn: '8h' },
        }),
      ],
      controllers: [AuthController, TesteController],
      providers: [
        AuthService,
        JwtStrategy,
        // mesma ordem do app.module: autentica, depois confere o cargo
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: PrismaService, useValue: prisma },
        { provide: FuncionariosService, useValue: funcionarios },
        { provide: MembrosService, useValue: membros },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => SEGREDO },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // mesmas opções do main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  const tokenValido = () =>
    jwt.signAsync({ sub: ID, tipo: 'FUNCIONARIO', cargo: Cargo.RECEPCIONISTA });

  describe('POST /auth/login', () => {
    it('200 com token e funcionário, sem senhaHash', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(registro());

      const resposta = await http()
        .post('/auth/login')
        .send({ login: 'maria01', senha: SENHA })
        .expect(200);

      const body = resposta.body as {
        accessToken: string;
        funcionario: unknown;
      };
      expect(typeof body.accessToken).toBe('string');
      expect(body.funcionario).toEqual({
        id: ID,
        nome: 'Maria Souza',
        cargo: Cargo.RECEPCIONISTA,
      });
      expect(JSON.stringify(body)).not.toContain('senhaHash');
      const payload = await jwt.verifyAsync<Record<string, unknown>>(
        body.accessToken,
      );
      expect(payload).toMatchObject({
        sub: ID,
        tipo: 'FUNCIONARIO',
        cargo: Cargo.RECEPCIONISTA,
      });
      expect(Number(payload.exp) - Number(payload.iat)).toBe(8 * 60 * 60);
    });

    it.each([
      ['senha errada', registro(), 'outra-senha'],
      ['login inexistente', null, SENHA],
      ['funcionário inativo', registro({ ativo: false }), SENHA],
    ])('401 genérico para %s', async (_caso, encontrado, senha) => {
      prisma.funcionario.findUnique.mockResolvedValue(encontrado);

      const resposta = await http()
        .post('/auth/login')
        .send({ login: 'maria01', senha })
        .expect(401);

      expect(resposta.body).toEqual({
        statusCode: 401,
        message: 'Login ou senha inválidos',
        error: 'Unauthorized',
      });
    });

    it.each([
      ['login com byte NUL', { login: 'maria\0', senha: SENHA }],
      ['login longo', { login: 'a'.repeat(31), senha: SENHA }],
      ['senha longa', { login: 'maria01', senha: 'x'.repeat(73) }],
      ['senha com surrogate solto', { login: 'maria01', senha: '\ud800' }],
    ])('401 genérico para %s, não 400 nem 500', async (_caso, corpo) => {
      prisma.funcionario.findUnique.mockResolvedValue(null);

      const resposta = await http().post('/auth/login').send(corpo).expect(401);

      expect(resposta.body).toEqual({
        statusCode: 401,
        message: 'Login ou senha inválidos',
        error: 'Unauthorized',
      });
    });

    it.each([
      ['sem senha', { login: 'maria01' }],
      ['sem login', { senha: SENHA }],
      ['tipo errado', { login: 123, senha: SENHA }],
      ['campo extra', { login: 'maria01', senha: SENHA, cargo: 'ADMIN' }],
    ])('400 para corpo inválido (%s)', async (_caso, corpo) => {
      await http().post('/auth/login').send(corpo).expect(400);

      expect(prisma.funcionario.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('aluno', () => {
    const CPF = '52998224725';

    it('login 200 aceita CPF com máscara e assina { sub, tipo: ALUNO }', async () => {
      prisma.membro.findUnique.mockResolvedValue({
        id: ID,
        nome: 'João Aluno',
        ativo: true,
        senhaHash: hashSync(SENHA, 4),
      });

      const resposta = await http()
        .post('/auth/login-aluno')
        .send({ cpf: '529.982.247-25', senha: SENHA })
        .expect(200);

      const body = resposta.body as { accessToken: string; aluno: unknown };
      expect(body.aluno).toEqual({ id: ID, nome: 'João Aluno' });
      expect(prisma.membro.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cpf: CPF } }),
      );
      const payload = await jwt.verifyAsync<Record<string, unknown>>(
        body.accessToken,
      );
      expect(payload).toMatchObject({ sub: ID, tipo: 'ALUNO' });
    });

    it('login 401 genérico para membro sem acesso liberado', async () => {
      prisma.membro.findUnique.mockResolvedValue({
        id: ID,
        nome: 'João Aluno',
        ativo: true,
        senhaHash: null,
      });

      const resposta = await http()
        .post('/auth/login-aluno')
        .send({ cpf: CPF, senha: SENHA })
        .expect(401);

      expect(resposta.body).toMatchObject({
        message: 'Login ou senha inválidos',
      });
    });

    it('token de aluno: /auth/me 200 com os dados do membro', async () => {
      const membro = { id: ID, nome: 'João Aluno', cpf: CPF };
      prisma.membro.findFirst.mockResolvedValue({ id: ID });
      membros.findOne.mockResolvedValue(membro);
      const token = await jwt.signAsync({ sub: ID, tipo: 'ALUNO' });

      const resposta = await http()
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(resposta.body).toEqual(membro);
      expect(funcionarios.findOne).not.toHaveBeenCalled();
    });

    it.each(['/teste/admin', '/teste/protegida'])(
      'token de aluno em %s (rota de funcionário) → 403',
      async (rota) => {
        prisma.membro.findFirst.mockResolvedValue({ id: ID });
        const token = await jwt.signAsync({ sub: ID, tipo: 'ALUNO' });

        const resposta = await http()
          .get(rota)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);

        expect(resposta.body).toMatchObject({ message: MENSAGEM_PROIBIDO });
      },
    );

    it('token de aluno com acesso revogado ou inativo → 401', async () => {
      prisma.membro.findFirst.mockResolvedValue(null);
      const token = await jwt.signAsync({ sub: ID, tipo: 'ALUNO' });

      const resposta = await http()
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(resposta.body).toMatchObject({ message: MENSAGEM_TOKEN });
    });
  });

  describe('GET /auth/me', () => {
    it('200 com o funcionário logado', async () => {
      const logado = {
        id: ID,
        nome: 'Maria Souza',
        cargo: Cargo.RECEPCIONISTA,
        login: 'maria01',
        ativo: true,
      };
      prisma.funcionario.findUnique.mockResolvedValue(registro());
      funcionarios.findOne.mockResolvedValue(logado);

      const resposta = await http()
        .get('/auth/me')
        .set('Authorization', `Bearer ${await tokenValido()}`)
        .expect(200);

      expect(resposta.body).toEqual(logado);
      expect(funcionarios.findOne).toHaveBeenCalledWith(ID);
    });
  });

  describe('guard global', () => {
    it('rota pública funciona sem token', async () => {
      const resposta = await http().get('/teste/publica').expect(200);

      expect(resposta.body).toEqual({ ok: true });
    });

    it('@UsuarioAtual entrega id, tipo e cargo do banco', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        registro({ cargo: Cargo.ADMIN }),
      );

      const resposta = await http()
        .get('/teste/protegida')
        .set('Authorization', `Bearer ${await tokenValido()}`)
        .expect(200);

      expect(resposta.body).toEqual({
        id: ID,
        tipo: 'FUNCIONARIO',
        cargo: Cargo.ADMIN,
      });
    });

    it('401 sem token, com mensagem em português', async () => {
      const resposta = await http().get('/teste/protegida').expect(401);

      expect(resposta.body).toEqual({
        statusCode: 401,
        message: MENSAGEM_TOKEN,
        error: 'Unauthorized',
      });
    });

    it('401 com token malformado', async () => {
      const resposta = await http()
        .get('/teste/protegida')
        .set('Authorization', 'Bearer isto-nao-e-um-jwt')
        .expect(401);

      expect(resposta.body).toMatchObject({ message: MENSAGEM_TOKEN });
    });

    it('401 com token assinado por outro segredo', async () => {
      const token = await jwt.signAsync(
        { sub: ID, tipo: 'FUNCIONARIO', cargo: Cargo.ADMIN },
        { secret: 'outro-segredo-qualquer' },
      );

      const resposta = await http()
        .get('/teste/protegida')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(resposta.body).toMatchObject({ message: MENSAGEM_TOKEN });
    });

    it('401 com token expirado', async () => {
      const token = await jwt.signAsync(
        { sub: ID, tipo: 'FUNCIONARIO', cargo: Cargo.ADMIN },
        { expiresIn: -10 },
      );

      const resposta = await http()
        .get('/teste/protegida')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(resposta.body).toMatchObject({ message: MENSAGEM_TOKEN });
    });

    it('401 com token alg none', async () => {
      const token = `${codificar({ alg: 'none', typ: 'JWT' })}.${codificar({
        sub: ID,
        tipo: 'FUNCIONARIO',
        cargo: Cargo.ADMIN,
      })}.`;

      await http()
        .get('/teste/protegida')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      expect(prisma.funcionario.findUnique).not.toHaveBeenCalled();
    });

    it('401 quando o funcionário foi desativado depois do login', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        registro({ ativo: false }),
      );

      const resposta = await http()
        .get('/teste/protegida')
        .set('Authorization', `Bearer ${await tokenValido()}`)
        .expect(401);

      expect(resposta.body).toMatchObject({ message: MENSAGEM_TOKEN });
    });
  });

  describe('RBAC na cadeia global', () => {
    const tokenDeAdmin = () =>
      jwt.signAsync({ sub: ID, tipo: 'FUNCIONARIO', cargo: Cargo.ADMIN });

    it('401, e não 403, em rota com @Roles sem token', async () => {
      const resposta = await http().get('/teste/admin').expect(401);

      expect(resposta.body).toMatchObject({ message: MENSAGEM_TOKEN });
    });

    it('403 quando o cargo no banco não está no @Roles, mesmo com ADMIN no token', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        registro({ cargo: Cargo.RECEPCIONISTA }),
      );

      const resposta = await http()
        .get('/teste/admin')
        .set('Authorization', `Bearer ${await tokenDeAdmin()}`)
        .expect(403);

      expect(resposta.body).toEqual({
        statusCode: 403,
        message: MENSAGEM_PROIBIDO,
        error: 'Forbidden',
      });
    });

    it('200 quando o cargo no banco está no @Roles', async () => {
      prisma.funcionario.findUnique.mockResolvedValue(
        registro({ cargo: Cargo.ADMIN }),
      );

      await http()
        .get('/teste/admin')
        .set('Authorization', `Bearer ${await tokenDeAdmin()}`)
        .expect(200, { ok: true });
    });
  });
});
