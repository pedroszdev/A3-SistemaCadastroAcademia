import { Module } from '@nestjs/common';
import { MembrosModule } from '../membros/membros.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { HistoricoController } from './historico.controller';
import { HistoricoService } from './historico.service';
import { MembrosAtividadesController } from './membros-atividades.controller';

// Exporta o HistoricoService para o Histórico do aluno, a ficha do membro e o dashboard.
@Module({
  imports: [MembrosModule, PagamentosModule],
  controllers: [HistoricoController, MembrosAtividadesController],
  providers: [HistoricoService],
  exports: [HistoricoService],
})
export class HistoricoModule {}
