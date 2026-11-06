import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { isUUID } from 'class-validator';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { segredoJwt } from './segredo-jwt';
import { TokenPayload, UsuarioAutenticado } from './usuario-autenticado';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: segredoJwt(config),
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }

  // Consulta o banco a cada requisição: funcionário ou aluno desativado (ou
  // aluno com acesso revogado) perde o acesso na hora e o cargo vale o atual,
  // não o do momento do login.
  async validate(payload: TokenPayload): Promise<UsuarioAutenticado | null> {
    // sub fora do formato de UUID vira 401 aqui, em vez de 500 no Postgres.
    if (!isUUID(payload.sub)) {
      return null;
    }

    if (payload.tipo === 'ALUNO') {
      const aluno = await this.prisma.membro.findFirst({
        where: { id: payload.sub, ativo: true, senhaHash: { not: null } },
        select: { id: true },
      });
      return aluno ? { id: aluno.id, tipo: 'ALUNO' } : null;
    }

    if (payload.tipo !== 'FUNCIONARIO') {
      return null;
    }

    const funcionario = await this.prisma.funcionario.findUnique({
      where: { id: payload.sub },
      select: { id: true, cargo: true, ativo: true },
    });
    if (!funcionario?.ativo) {
      return null;
    }

    return {
      id: funcionario.id,
      tipo: 'FUNCIONARIO',
      cargo: funcionario.cargo,
    };
  }
}
