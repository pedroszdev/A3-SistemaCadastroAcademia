import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FuncionariosModule } from '../funcionarios/funcionarios.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EXPIRACAO_PADRAO, expiracaoEmSegundos } from './expiracao-token';
import { JwtStrategy } from './jwt.strategy';
import { segredoJwt } from './segredo-jwt';

@Module({
  imports: [
    PassportModule,
    FuncionariosModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: segredoJwt(config),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: expiracaoEmSegundos(
            config.get<string>('JWT_EXPIRES_IN', EXPIRACAO_PADRAO),
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
