import { INestApplication, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { MetadataScanner, ModulesContainer } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { IS_PUBLIC_KEY } from '../src/auth/decorators/public.decorator';
import { Papel, ROLES_KEY } from '../src/auth/decorators/roles.decorator';
import { segredoJwt } from '../src/auth/segredo-jwt';
import { hoje } from '../src/common/utils/date';
import { Cargo } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  criarApp,
  criarAtividade,
  criarFuncionario,
  criarMembro,
  criarPagamento,
  diaIso,
  diasAtras,
  gerarCpf,
  limparBanco,
  loginComo,
  prismaDe,
  SENHA_PADRAO,
} from './utils';

// E2E-05: a matriz 4.2 do backlog, rota por rota e papel por papel (os três
// cargos e o ALUNO), contra o AppModule real. Evidência da issue #28 em
// docs/evidencias/permissoes/README.md.

const MENSAGEM_PROIBIDO = 'Você não tem permissão para acessar este recurso';
const { ADMIN, RECEPCIONISTA, INSTRUTOR } = Cargo;
const CARGOS = [ADMIN, RECEPCIONISTA, INSTRUTOR] as const;
const ALUNO = 'ALUNO' as const;
/** Os papéis do RolesGuard: os cargos de funcionário e o aluno. */
const PAPEIS: Papel[] = [...CARGOS, ALUNO];
const TODOS: Papel[] = [...CARGOS];
const GESTAO = [ADMIN, RECEPCIONISTA];

type Metodo = 'get' | 'post' | 'patch';

/** Ids da massa recriada antes de cada teste. */
interface Massa {
  membroId: string;
  membroInativoId: string;
  pagamentoId: string;
  atividadeId: string;
  funcionarioId: string;
  funcionarioInativoId: string;
}

interface Linha {
  metodo: Metodo;
  /** Rota como o Nest registra; `:id` é trocado pelo `id` da massa. */
  rota: string;
  id?: (m: Massa) => string;
  corpo?: (m: Massa) => object;
  permitidos: Papel[];
  sucesso: 200 | 201;
}

/**
 * Matriz 4.2 do backlog, uma linha por rota protegida. O ALUNO só aparece em
 * `permitidos` onde a rota tem `@Roles('ALUNO')` (RN17). Toda rota nova
 * entra aqui: o teste "toda rota está na matriz" falha se faltar.
 */
const MATRIZ: Linha[] = [
  // Funcionários (CRUD): só ADMIN
  { metodo: 'get', rota: '/funcionarios', permitidos: [ADMIN], sucesso: 200 },
  {
    metodo: 'post',
    rota: '/funcionarios',
    corpo: () => ({
      nome: 'Funcionário Novo',
      login: 'funcionarionovo',
      cargo: INSTRUTOR,
      senha: 'senha-segura-123',
    }),
    permitidos: [ADMIN],
    sucesso: 201,
  },
  {
    metodo: 'get',
    rota: '/funcionarios/:id',
    id: (m) => m.funcionarioId,
    permitidos: [ADMIN],
    sucesso: 200,
  },
  {
    metodo: 'patch',
    rota: '/funcionarios/:id',
    id: (m) => m.funcionarioId,
    corpo: () => ({ nome: 'Nome Editado' }),
    permitidos: [ADMIN],
    sucesso: 200,
  },
  {
    metodo: 'patch',
    rota: '/funcionarios/:id/desativar',
    id: (m) => m.funcionarioId,
    permitidos: [ADMIN],
    sucesso: 200,
  },
  {
    metodo: 'patch',
    rota: '/funcionarios/:id/reativar',
    id: (m) => m.funcionarioInativoId,
    permitidos: [ADMIN],
    sucesso: 200,
  },

  // Membros: todos listam e veem; ADMIN e RECEPCIONISTA alteram
  { metodo: 'get', rota: '/membros', permitidos: TODOS, sucesso: 200 },
  {
    metodo: 'get',
    rota: '/membros/:id',
    id: (m) => m.membroId,
    permitidos: TODOS,
    sucesso: 200,
  },
  {
    metodo: 'post',
    rota: '/membros',
    corpo: () => ({
      nome: 'Membro Novo',
      cpf: gerarCpf(),
      telefone: '48999990000',
      endereco: 'Rua Fictícia, 10',
    }),
    permitidos: GESTAO,
    sucesso: 201,
  },
  {
    metodo: 'patch',
    rota: '/membros/:id',
    id: (m) => m.membroId,
    corpo: () => ({ nome: 'Membro Editado' }),
    permitidos: GESTAO,
    sucesso: 200,
  },
  {
    metodo: 'patch',
    rota: '/membros/:id/desativar',
    id: (m) => m.membroId,
    permitidos: GESTAO,
    sucesso: 200,
  },
  {
    metodo: 'patch',
    rota: '/membros/:id/reativar',
    id: (m) => m.membroInativoId,
    permitidos: GESTAO,
    sucesso: 200,
  },

  // Situação financeira: segue pagamentos
  {
    metodo: 'get',
    rota: '/membros/:id/situacao',
    id: (m) => m.membroId,
    permitidos: GESTAO,
    sucesso: 200,
  },

  // Pagamentos: ADMIN e RECEPCIONISTA
  { metodo: 'get', rota: '/pagamentos', permitidos: GESTAO, sucesso: 200 },
  {
    metodo: 'post',
    rota: '/pagamentos',
    // vencimento diferente do pagamento da massa (RN06: um por vencimento)
    corpo: (m) => ({
      membroId: m.membroId,
      valor: 120,
      dataVencimento: diaIso(diasAtras(-30)),
    }),
    permitidos: GESTAO,
    sucesso: 201,
  },
  {
    metodo: 'get',
    rota: '/pagamentos/:id',
    id: (m) => m.pagamentoId,
    permitidos: GESTAO,
    sucesso: 200,
  },
  {
    metodo: 'patch',
    rota: '/pagamentos/:id/pagar',
    id: (m) => m.pagamentoId,
    corpo: () => ({}),
    permitidos: GESTAO,
    sucesso: 200,
  },
  {
    metodo: 'patch',
    rota: '/pagamentos/:id/cancelar',
    id: (m) => m.pagamentoId,
    permitidos: GESTAO,
    sucesso: 200,
  },

  // Histórico: todos consultam; ADMIN e INSTRUTOR registram
  { metodo: 'get', rota: '/atividades', permitidos: TODOS, sucesso: 200 },
  {
    metodo: 'get',
    rota: '/atividades/:id',
    id: (m) => m.atividadeId,
    permitidos: TODOS,
    sucesso: 200,
  },
  {
    metodo: 'get',
    rota: '/membros/:id/atividades',
    id: (m) => m.membroId,
    permitidos: TODOS,
    sucesso: 200,
  },
  {
    metodo: 'post',
    rota: '/atividades',
    corpo: (m) => ({
      membroId: m.membroId,
      atividade: 'Esteira',
      data: diaIso(hoje()),
      tempoExecucao: 30,
    }),
    permitidos: [ADMIN, INSTRUTOR],
    sucesso: 201,
  },

  // Meus dados
  {
    metodo: 'get',
    rota: '/auth/me',
    permitidos: [...CARGOS, ALUNO],
    sucesso: 200,
  },
];

const chave = (metodo: string, rota: string) =>
  `${metodo.toUpperCase()} ${rota}`;

describe('Segurança: matriz de permissões (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const tokens = {} as Record<Papel, string>;
  const idsDosTokens: string[] = [];
  let alunoId: string;
  let massa: Massa;

  // Os donos dos tokens são criados uma vez; a massa, a cada teste.
  beforeAll(async () => {
    app = await criarApp();
    prisma = prismaDe(app);
    await limparBanco(prisma);
    for (const cargo of CARGOS) {
      const { token, funcionario } = await loginComo(app, cargo);
      tokens[cargo] = token;
      idsDosTokens.push(funcionario.id);
    }

    // aluno com acesso liberado (RN15), logado de verdade pelo CPF
    const aluno = await criarMembro(prisma, {
      senhaHash: hashSync(SENHA_PADRAO, 4),
    });
    alunoId = aluno.id;
    const resposta = await request(app.getHttpServer())
      .post('/auth/login-aluno')
      .send({ cpf: aluno.cpf, senha: SENHA_PADRAO })
      .expect(200);
    tokens[ALUNO] = (resposta.body as { accessToken: string }).accessToken;
  });

  // Ordem das FKs: filhos antes do membro e do funcionário.
  beforeEach(async () => {
    await prisma.historicoAtividade.deleteMany();
    await prisma.pagamento.deleteMany();
    await prisma.treino.deleteMany();
    await prisma.membro.deleteMany({ where: { id: { not: alunoId } } });
    await prisma.funcionario.deleteMany({
      where: { id: { notIn: idsDosTokens } },
    });

    const membro = await criarMembro(prisma);
    const membroInativo = await criarMembro(prisma, { ativo: false });
    const pagamento = await criarPagamento(prisma, membro.id);
    const atividade = await criarAtividade(prisma, { membroId: membro.id });
    const funcionario = await criarFuncionario(prisma, {
      cargo: RECEPCIONISTA,
    });
    const funcionarioInativo = await criarFuncionario(prisma, {
      cargo: INSTRUTOR,
      ativo: false,
    });
    massa = {
      membroId: membro.id,
      membroInativoId: membroInativo.id,
      pagamentoId: pagamento.id,
      atividadeId: atividade.id,
      funcionarioId: funcionario.id,
      funcionarioInativoId: funcionarioInativo.id,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  /** Monta a requisição da linha, já com o corpo válido, se a rota tiver um. */
  function chamar(linha: Linha, token?: string) {
    const url = linha.id
      ? linha.rota.replace(':id', linha.id(massa))
      : linha.rota;
    let req = request(app.getHttpServer())[linha.metodo](url);
    if (token) {
      req = req.set('Authorization', bearer(token));
    }
    return linha.corpo ? req.send(linha.corpo(massa)) : req;
  }

  function linha(metodo: Metodo, rota: string): Linha {
    const encontrada = MATRIZ.find(
      (l) => l.metodo === metodo && l.rota === rota,
    );
    if (!encontrada) {
      throw new Error(`${chave(metodo, rota)} não está na MATRIZ`);
    }
    return encontrada;
  }

  describe('sem token → 401', () => {
    it.each(MATRIZ.map((l) => [l.metodo.toUpperCase(), l.rota, l] as const))(
      '%s %s → 401',
      async (_metodo, _rota, l) => {
        await chamar(l).expect(401);
      },
    );
  });

  describe('por papel', () => {
    const casos = MATRIZ.flatMap((l) =>
      PAPEIS.map(
        (papel) =>
          [
            papel,
            l.metodo.toUpperCase(),
            l.rota,
            l.permitidos.includes(papel) ? l.sucesso : 403,
            l,
          ] as const,
      ),
    );

    it.each(casos)(
      '%s %s %s → %i',
      async (papel, _metodo, _rota, esperado, l) => {
        const resposta = await chamar(l, tokens[papel]).expect(esperado);

        if (esperado === 403) {
          expect(resposta.body).toEqual({
            statusCode: 403,
            message: MENSAGEM_PROIBIDO,
            error: 'Forbidden',
          });
        }
      },
    );
  });

  describe('contrato da issue #28', () => {
    it('INSTRUTOR não acessa pagamentos nem a situação financeira', async () => {
      const rotas = MATRIZ.filter(
        (l) => l.rota.startsWith('/pagamentos') || l.rota.endsWith('/situacao'),
      );
      expect(rotas).toHaveLength(6);

      for (const l of rotas) {
        await chamar(l, tokens[INSTRUTOR]).expect(403);
      }
      // o POST barrado não gravou nada além do pagamento da massa
      expect(await prisma.pagamento.count()).toBe(1);
    });

    it('RECEPCIONISTA não registra atividade: 403 e nada gravado', async () => {
      await chamar(linha('post', '/atividades'), tokens[RECEPCIONISTA]).expect(
        403,
      );

      expect(await prisma.historicoAtividade.count()).toBe(1);
    });

    it('só ADMIN gerencia funcionários', async () => {
      const rotas = MATRIZ.filter((l) => l.rota.startsWith('/funcionarios'));
      expect(rotas).toHaveLength(6);

      for (const l of rotas) {
        expect(l.permitidos).toEqual([ADMIN]);
        for (const cargo of [RECEPCIONISTA, INSTRUTOR]) {
          await chamar(l, tokens[cargo]).expect(403);
        }
      }
      expect(
        await prisma.funcionario.count({ where: { login: 'funcionarionovo' } }),
      ).toBe(0);
    });

    it('ALUNO só lê os próprios dados: 403 em toda rota de funcionário e nada gravado (RN17)', async () => {
      const rotas = MATRIZ.filter((l) => !l.permitidos.includes(ALUNO));
      expect(rotas).toHaveLength(MATRIZ.length - 1);

      for (const l of rotas) {
        await chamar(l, tokens[ALUNO]).expect(403);
      }
      expect(await prisma.pagamento.count()).toBe(1);
      expect(await prisma.historicoAtividade.count()).toBe(1);
      // a massa (2) e o próprio aluno; nenhum membro criado
      expect(await prisma.membro.count()).toBe(3);
    });

    it('corpo inválido com cargo sem permissão → 403, não 400', async () => {
      await request(app.getHttpServer())
        .post('/pagamentos')
        .set('Authorization', bearer(tokens[INSTRUTOR]))
        .send({})
        .expect(403);
    });
  });

  describe('token', () => {
    const rota = '/membros';

    it('malformado → 401', async () => {
      await request(app.getHttpServer())
        .get(rota)
        .set('Authorization', 'Bearer nao-e-um-jwt')
        .expect(401);
    });

    it('assinado com outro segredo → 401', async () => {
      const [adminId] = idsDosTokens;
      const forjado = new JwtService({ secret: 'x'.repeat(64) }).sign({
        sub: adminId,
        tipo: 'FUNCIONARIO',
        cargo: ADMIN,
      });

      await request(app.getHttpServer())
        .get(rota)
        .set('Authorization', bearer(forjado))
        .expect(401);
    });

    it('expirado → 401', async () => {
      const [adminId] = idsDosTokens;
      const agora = Math.floor(Date.now() / 1000);
      const expirado = new JwtService({
        secret: segredoJwt(app.get(ConfigService)),
      }).sign({
        sub: adminId,
        tipo: 'FUNCIONARIO',
        cargo: ADMIN,
        iat: agora - 120,
        exp: agora - 60,
      });

      await request(app.getHttpServer())
        .get(rota)
        .set('Authorization', bearer(expirado))
        .expect(401);
    });
  });

  describe('cobertura da matriz', () => {
    const caminhos = (valor: unknown): string[] =>
      valor === undefined
        ? ['']
        : (Array.isArray(valor) ? valor : [valor]).map(String);

    const juntar = (...partes: string[]) =>
      '/' +
      partes
        .map((p) => p.replace(/^\/+|\/+$/g, ''))
        .filter(Boolean)
        .join('/');

    /** Todas as rotas registradas no AppModule, com os metadados de acesso. */
    function rotasRegistradas() {
      const scanner = new MetadataScanner();
      const rotas: { chave: string; publica: boolean; temRoles: boolean }[] =
        [];

      for (const modulo of app.get(ModulesContainer).values()) {
        // Lê o protótipo da classe, não a instância: controller request-scoped
        // não tem instância aqui e não pode escapar da checagem.
        for (const { metatype } of modulo.controllers.values()) {
          if (typeof metatype !== 'function') {
            continue;
          }
          const prototipo = metatype.prototype as Record<string, unknown>;
          const bases = caminhos(Reflect.getMetadata(PATH_METADATA, metatype));

          for (const nome of scanner.getAllMethodNames(prototipo)) {
            const handler = prototipo[nome];
            if (typeof handler !== 'function') {
              continue;
            }
            const sufixos = Reflect.getMetadata(PATH_METADATA, handler) as
              string | string[] | undefined;
            if (sufixos === undefined) {
              continue;
            }
            const metodo =
              RequestMethod[
                Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod
              ];
            // mesma precedência do getAllAndOverride: o método vale sobre a classe
            const meta = (k: string): unknown =>
              (Reflect.getMetadata(k, handler) as unknown) ??
              (Reflect.getMetadata(k, metatype) as unknown);

            // @Controller(['a', 'b']) e @Get(['x', 'y']) registram cada combinação
            for (const base of bases) {
              for (const sufixo of caminhos(sufixos)) {
                rotas.push({
                  chave: chave(metodo, juntar(base, sufixo)),
                  publica: meta(IS_PUBLIC_KEY) === true,
                  temRoles: meta(ROLES_KEY) !== undefined,
                });
              }
            }
          }
        }
      }
      return rotas;
    }

    it('toda rota declara @Roles ou @Public', () => {
      const semDeclaracao = rotasRegistradas()
        .filter((r) => !r.publica && !r.temRoles)
        .map((r) => r.chave);

      expect(semDeclaracao).toEqual([]);
    });

    it('toda rota não pública está na MATRIZ, e a MATRIZ só tem rotas que existem', () => {
      const registradas = rotasRegistradas();
      const protegidas = registradas
        .filter((r) => !r.publica)
        .map((r) => r.chave)
        .sort();
      const naMatriz = MATRIZ.map((l) => chave(l.metodo, l.rota)).sort();

      expect(protegidas).toEqual(naMatriz);
    });
  });
});
