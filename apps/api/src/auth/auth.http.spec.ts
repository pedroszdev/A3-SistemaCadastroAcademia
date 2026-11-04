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
import { PrismaService } from '../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { UsuarioAtual } from './decorators/usuario-atual.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import type { UsuarioAutenticado } from './usuario-autenticado';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';
const SEGREDO = 'segredo-apenas-para-teste';
const SENHA = 'senha1234';
const MENSAGEM_TOKEN = 'Token ausente, inválido ou expirado';

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
}

// Exercita guard global, strategy, JWT real e pipes sobre HTTP, sem banco.
describe('Auth (HTTP)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const prisma = { funcionario: { findUnique: jest.fn() } };
  const funcionarios = { findOne: jest.fn() };

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
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: PrismaService, useValue: prisma },
        { provide: FuncionariosService, useValue: funcionarios },
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
});
