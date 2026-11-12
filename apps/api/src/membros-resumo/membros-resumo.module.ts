import { Module } from '@nestjs/common';
import { HistoricoModule } from '../historico/historico.module';
import { MembrosModule } from '../membros/membros.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { MembrosResumoController } from './membros-resumo.controller';
import { MembrosResumoService } from './membros-resumo.service';

// Módulo próprio para compor Membros, Pagamentos e Histórico sem criar
// dependência circular entre eles. O treino vem do PrismaService (global).
@Module({
  imports: [MembrosModule, PagamentosModule, HistoricoModule],
  controllers: [MembrosResumoController],
  providers: [MembrosResumoService],
})
export class MembrosResumoModule {}
