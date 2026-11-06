import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { DashboardModule } from './dashboard/dashboard.module';
import { FuncionariosModule } from './funcionarios/funcionarios.module';
import { HistoricoModule } from './historico/historico.module';
import { MembrosModule } from './membros/membros.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FuncionariosModule,
    MembrosModule,
    PagamentosModule,
    HistoricoModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
