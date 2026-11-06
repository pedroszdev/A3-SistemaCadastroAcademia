import { Module } from '@nestjs/common';
import { HistoricoModule } from '../historico/historico.module';
import { MembrosModule } from '../membros/membros.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [MembrosModule, PagamentosModule, HistoricoModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
