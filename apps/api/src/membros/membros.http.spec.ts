import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configurarApp } from '../configurar-app';
import { MembrosController } from './membros.controller';
import { MembrosService } from './membros.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

// CPF gerado para testes, não pertence a ninguém.
const CORPO = {
  nome: 'Ana Pereira',
  cpf: '529.982.247-25',
  telefone: '(48) 99999-1234',
  endereco: 'Rua das Flores, 100',
};

// Exercita roteamento, pipes e validação sobre HTTP, sem banco: o service é mockado.
describe('MembrosController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    desativar: jest.fn(),
    reativar: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MembrosController],
      providers: [{ provide: MembrosService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    // a mesma configuração do main.ts
    configurarApp(app);
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('rotas', () => {
    it('GET /membros chama findAll com a query convertida', async () => {
      await http()
        .get('/membros?busca=%20ana%20&ativo=false&page=2&pageSize=10')
        .expect(200);

      expect(service.findAll).toHaveBeenCalledWith({
        busca: 'ana',
        ativo: false,
        page: 2,
        pageSize: 10,
      });
    });

    it('POST /membros chama create com CPF e telefone só com dígitos', async () => {
      await http().post('/membros').send(CORPO).expect(201);

      expect(service.create).toHaveBeenCalledWith({
        ...CORPO,
        cpf: '52998224725',
        telefone: '48999991234',
      });
    });

    it('GET /membros/:id chama findOne', async () => {
      await http().get(`/membros/${ID}`).expect(200);

      expect(service.findOne).toHaveBeenCalledWith(ID);
    });

    it('PATCH /membros/:id chama update', async () => {
      await http()
        .patch(`/membros/${ID}`)
        .send({ nome: 'Novo Nome' })
        .expect(200);

      expect(service.update).toHaveBeenCalledWith(ID, { nome: 'Novo Nome' });
    });

    it('PATCH /membros/:id/desativar chama só desativar', async () => {
      await http().patch(`/membros/${ID}/desativar`).expect(200);

      expect(service.desativar).toHaveBeenCalledWith(ID);
      expect(service.reativar).not.toHaveBeenCalled();
    });

    it('PATCH /membros/:id/reativar chama só reativar', async () => {
      await http().patch(`/membros/${ID}/reativar`).expect(200);

      expect(service.reativar).toHaveBeenCalledWith(ID);
      expect(service.desativar).not.toHaveBeenCalled();
    });
  });

  describe('id inválido', () => {
    it.each([
      ['get', '/membros/abc'],
      ['patch', '/membros/abc'],
      ['patch', '/membros/abc/desativar'],
      ['patch', '/membros/abc/reativar'],
    ] as const)('%s %s → 400', async (metodo, rota) => {
      await http()[metodo](rota).expect(400);

      expect(service.findOne).not.toHaveBeenCalled();
      expect(service.update).not.toHaveBeenCalled();
      expect(service.desativar).not.toHaveBeenCalled();
      expect(service.reativar).not.toHaveBeenCalled();
    });
  });

  describe('validação', () => {
    it('POST com CPF inválido → 400, sem create', async () => {
      await http()
        .post('/membros')
        .send({ ...CORPO, cpf: '529.982.247-26' })
        .expect(400);

      expect(service.create).not.toHaveBeenCalled();
    });

    it('POST com campo extra → 400, sem create', async () => {
      await http()
        .post('/membros')
        .send({ ...CORPO, ativo: false })
        .expect(400);

      expect(service.create).not.toHaveBeenCalled();
    });

    it('PATCH com cpf → 400 com a mensagem da RN02, sem update', async () => {
      const resposta = await http()
        .patch(`/membros/${ID}`)
        .send({ cpf: '529.982.247-25' })
        .expect(400);

      expect(JSON.stringify(resposta.body)).toContain(
        'cpf não pode ser alterado',
      );
      expect(service.update).not.toHaveBeenCalled();
    });
  });
});
