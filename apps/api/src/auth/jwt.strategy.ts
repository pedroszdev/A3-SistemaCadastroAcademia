import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload, UsuarioAutenticado } from './usuario-autenticado';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }

  // Consulta o banco a cada requisição: funcionário desativado perde o acesso
  // na hora e o cargo vale o atual, não o do momento do login.
  async validate(payload: TokenPayload): Promise<UsuarioAutenticado | null> {
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
