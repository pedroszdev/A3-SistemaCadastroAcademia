import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { paginacaoPrisma, paginate } from '../common/utils/paginate';
import { normalizarCpf } from '../common/validators/cpf';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembroDto } from './dto/create-membro.dto';
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
      return await this.prisma.membro.create({
        data: {
          nome: dto.nome,
          cpf: dto.cpf,
          telefone: dto.telefone,
          endereco: dto.endereco,
        },
        select: MEMBRO_SELECT,
      });
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
        select: MEMBRO_SELECT,
        // id desempata nomes iguais, para a paginação não repetir nem pular
        orderBy: [{ nome: 'asc' }, { id: 'asc' }],
        ...paginacaoPrisma(query),
      }),
      this.prisma.membro.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async findOne(id: string) {
    const membro = await this.prisma.membro.findUnique({
      where: { id },
      select: MEMBRO_SELECT,
    });
    if (!membro) {
      throw new NotFoundException('Membro não encontrado');
    }
    return membro;
  }

  // RN02: o CPF fica de fora; o DTO já recusa a tentativa de alterá-lo.
  async update(id: string, dto: UpdateMembroDto) {
    await this.findOne(id);
    return this.prisma.membro.update({
      where: { id },
      data: { nome: dto.nome, telefone: dto.telefone, endereco: dto.endereco },
      select: MEMBRO_SELECT,
    });
  }

  // RN03: membro não é excluído, só desativado e reativado.
  async desativar(id: string) {
    await this.findOne(id);
    return this.prisma.membro.update({
      where: { id },
      data: { ativo: false },
      select: MEMBRO_SELECT,
    });
  }

  async reativar(id: string) {
    await this.findOne(id);
    return this.prisma.membro.update({
      where: { id },
      data: { ativo: true },
      select: MEMBRO_SELECT,
    });
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
