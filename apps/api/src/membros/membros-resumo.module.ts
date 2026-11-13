import { Module } from '@nestjs/common';
import { HistoricoModule } from '../historico/historico.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { TreinosModule } from '../treinos/treinos.module';
import { MembrosModule } from './membros.module';
import { MembrosResumoController } from './membros-resumo.controller';
import { MembrosResumoService } from './membros-resumo.service';

// Fica num módulo próprio porque Treinos e Histórico já importam o MembrosModule.
@Module({
  imports: [MembrosModule, PagamentosModule, TreinosModule, HistoricoModule],
  controllers: [MembrosResumoController],
  providers: [MembrosResumoService],
})
export class MembrosResumoModule {}
