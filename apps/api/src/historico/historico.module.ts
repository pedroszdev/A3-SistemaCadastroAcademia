import { Module } from '@nestjs/common';
import { MembrosModule } from '../membros/membros.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { HistoricoService } from './historico.service';

// Exporta o HistoricoService para o Histórico do aluno, a ficha do membro e o dashboard.
@Module({
  imports: [MembrosModule, PagamentosModule],
  providers: [HistoricoService],
  exports: [HistoricoService],
})
export class HistoricoModule {}
