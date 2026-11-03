import { Module } from '@nestjs/common';
import { MembrosService } from './membros.service';

// Exporta o MembrosService para Treinos, Pagamentos e Histórico usarem o
// assertMembroAtivo (RN04).
@Module({
  providers: [MembrosService],
  exports: [MembrosService],
})
export class MembrosModule {}
