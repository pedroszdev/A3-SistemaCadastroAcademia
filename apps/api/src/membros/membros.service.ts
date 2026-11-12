import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { paginacaoPrisma, paginate } from '../common/utils/paginate';
import { hashSenha } from '../common/utils/senha';
import { normalizarCpf } from '../common/validators/cpf';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembroDto } from './dto/create-membro.dto';
import { LiberarAcessoDto } from './dto/liberar-acesso.dto';
import { QueryMembroDto } from './dto/query-membro.dto';
import { UpdateMembroDto } from './dto/update-membro.dto';

export const MEMBRO_SELECT = {
  id: true,
  nome: true,
  cpf: true,
  telefone: true,
  endereco: true,
  ativo: true,
  dataCadastro: true,
} as const;

// RN12: o hash só é lido para virar o acessoLiberado e não sai do service.
export const MEMBRO_SELECT_COM_HASH = {
  ...MEMBRO_SELECT,
  senhaHash: true,
} as const;

type MembroComHash = Prisma.MembroGetPayload<{
  select: typeof MEMBRO_SELECT_COM_HASH;
}>;

/** O membro como a API devolve: sem o hash, com o acessoLiberado (RN15). */
export function paraResposta({ senhaHash, ...membro }: MembroComHash) {
  return { ...membro, acessoLiberado: senhaHash !== null };
}

const SO_DIGITOS = /^\d+$/;
const ESPACOS = /\s/g;

// Busca só com números (com ou sem a máscara ou espaços) procura pelo início
// do CPF; qualquer outra coisa procura no nome, sem diferenciar maiúsculas.
export function filtroBusca(busca?: string): Prisma.MembroWhereInput {
  if (!busca) {
    return {};
  }
  const cpf = normalizarCpf(busca).replace(ESPACOS, '');
  if (SO_DIGITOS.test(cpf)) {
    return { cpf: { startsWith: cpf } };
  }
  return { nome: { contains: busca, mode: 'insensitive' } };
}

@Injectable()
export class MembrosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMembroDto) {
    const existente = await this.prisma.membro.findUnique({
      where: { cpf: dto.cpf },
      select: { id: true },
    });
    if (existente) {
      throw new ConflictException('CPF já cadastrado');
    }

    try {
      return paraResposta(
        await this.prisma.membro.create({
          data: {
            nome: dto.nome,
            cpf: dto.cpf,
            telefone: dto.telefone,
            endereco: dto.endereco,
          },
          select: MEMBRO_SELECT_COM_HASH,
        }),
      );
    } catch (erro) {
      // Outro cadastro com o mesmo CPF pode entrar entre a consulta e o insert;
      // o índice único recusa, e a resposta continua a mesma da RN02.
      if (
        erro instanceof PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ConflictException('CPF já cadastrado');
      }
      throw erro;
    }
  }

  async findAll(query: QueryMembroDto) {
    const where: Prisma.MembroWhereInput = {
      ativo: query.ativo,
      ...filtroBusca(query.busca),
    };
    const [data, total] = await Promise.all([
      this.prisma.membro.findMany({
        where,
        select: MEMBRO_SELECT_COM_HASH,
        // id desempata nomes iguais, para a paginação não repetir nem pular
        orderBy: [{ nome: 'asc' }, { id: 'asc' }],
        ...paginacaoPrisma(query),
      }),
      this.prisma.membro.count({ where }),
    ]);
    return paginate(
      data.map((m) => paraResposta(m)),
      total,
      query,
    );
  }

  async findOne(id: string) {
    const membro = await this.prisma.membro.findUnique({
      where: { id },
      select: MEMBRO_SELECT_COM_HASH,
    });
    if (!membro) {
      throw new NotFoundException('Membro não encontrado');
    }
    return paraResposta(membro);
  }

  // RN02: o CPF fica de fora; o DTO já recusa a tentativa de alterá-lo.
  async update(id: string, dto: UpdateMembroDto) {
    await this.findOne(id);
    return paraResposta(
      await this.prisma.membro.update({
        where: { id },
        data: {
          nome: dto.nome,
          telefone: dto.telefone,
          endereco: dto.endereco,
        },
        select: MEMBRO_SELECT_COM_HASH,
      }),
    );
  }

  // RN03: membro não é excluído, só desativado e reativado.
  async desativar(id: string) {
    await this.findOne(id);
    return paraResposta(
      await this.prisma.membro.update({
        where: { id },
        data: { ativo: false },
        select: MEMBRO_SELECT_COM_HASH,
      }),
    );
  }

  async reativar(id: string) {
    await this.findOne(id);
    return paraResposta(
      await this.prisma.membro.update({
        where: { id },
        data: { ativo: true },
        select: MEMBRO_SELECT_COM_HASH,
      }),
    );
  }

  // RN15: libera o acesso do aluno ou redefine a senha. O hashSenha usa o
  // SALT_ROUNDS do login (auth.service.ts), para o tempo do compare não revelar
  // a conta.
  async liberarAcesso(id: string, dto: LiberarAcessoDto) {
    await this.assertMembroAtivo(
      id,
      'Membro inativo não pode ter o acesso liberado',
    );
    const senhaHash = await hashSenha(dto.senha);
    return paraResposta(
      await this.prisma.membro.update({
        where: { id },
        data: { senhaHash },
        select: MEMBRO_SELECT_COM_HASH,
      }),
    );
  }

  // Revogar vale também para o membro inativo: só tira o acesso.
  async revogarAcesso(id: string) {
    await this.findOne(id);
    return paraResposta(
      await this.prisma.membro.update({
        where: { id },
        data: { senhaHash: null },
        select: MEMBRO_SELECT_COM_HASH,
      }),
    );
  }

  /**
   * RN04: usado por Treinos, Pagamentos e Histórico antes de criar algo para o
   * membro. 404 se ele não existe; 422 se está inativo.
   */
  async assertMembroAtivo(id: string, mensagem = 'Membro inativo') {
    const membro = await this.prisma.membro.findUnique({
      where: { id },
      select: { ativo: true },
    });
    if (!membro) {
      throw new NotFoundException('Membro não encontrado');
    }
    if (!membro.ativo) {
      throw new UnprocessableEntityException(mensagem);
    }
  }
}
