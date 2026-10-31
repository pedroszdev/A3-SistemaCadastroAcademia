import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { paginacaoPrisma, paginate } from '../common/utils/paginate';
import { Cargo } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { QueryFuncionarioDto } from './dto/query-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';

// RN12: senhaHash nunca sai do service.
export const FUNCIONARIO_SELECT = {
  id: true,
  nome: true,
  cargo: true,
  login: true,
  ativo: true,
} as const;

const SALT_ROUNDS = 10;

@Injectable()
export class FuncionariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFuncionarioDto) {
    const existente = await this.prisma.funcionario.findUnique({
      where: { login: dto.login },
      select: { id: true },
    });
    if (existente) {
      throw new ConflictException('Login já cadastrado');
    }

    const senhaHash = await hash(dto.senha, SALT_ROUNDS);
    return this.prisma.funcionario.create({
      data: { nome: dto.nome, cargo: dto.cargo, login: dto.login, senhaHash },
      select: FUNCIONARIO_SELECT,
    });
  }

  async findAll(query: QueryFuncionarioDto) {
    const where = { cargo: query.cargo, ativo: query.ativo };
    const [data, total] = await Promise.all([
      this.prisma.funcionario.findMany({
        where,
        select: FUNCIONARIO_SELECT,
        orderBy: { nome: 'asc' },
        ...paginacaoPrisma(query),
      }),
      this.prisma.funcionario.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async findOne(id: string) {
    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id },
      select: FUNCIONARIO_SELECT,
    });
    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }
    return funcionario;
  }

  async update(id: string, dto: UpdateFuncionarioDto) {
    const atual = await this.findOne(id);
    if (
      dto.cargo &&
      dto.cargo !== Cargo.ADMIN &&
      atual.cargo === Cargo.ADMIN &&
      atual.ativo
    ) {
      await this.assertNaoEUltimoAdmin();
    }

    const data = {
      nome: dto.nome,
      cargo: dto.cargo,
      ...(dto.senha && { senhaHash: await hash(dto.senha, SALT_ROUNDS) }),
    };
    return this.prisma.funcionario.update({
      where: { id },
      data,
      select: FUNCIONARIO_SELECT,
    });
  }

  async desativar(id: string, solicitanteId?: string) {
    if (solicitanteId === id) {
      throw new UnprocessableEntityException(
        'Você não pode desativar o próprio usuário',
      );
    }

    const atual = await this.findOne(id);
    if (atual.cargo === Cargo.ADMIN && atual.ativo) {
      await this.assertNaoEUltimoAdmin();
    }

    return this.prisma.funcionario.update({
      where: { id },
      data: { ativo: false },
      select: FUNCIONARIO_SELECT,
    });
  }

  async reativar(id: string) {
    await this.findOne(id);
    return this.prisma.funcionario.update({
      where: { id },
      data: { ativo: true },
      select: FUNCIONARIO_SELECT,
    });
  }

  private async assertNaoEUltimoAdmin() {
    const admins = await this.prisma.funcionario.count({
      where: { cargo: Cargo.ADMIN, ativo: true },
    });
    if (admins <= 1) {
      throw new UnprocessableEntityException(
        'O sistema precisa de pelo menos um administrador ativo',
      );
    }
  }
}
