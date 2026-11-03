import { Module } from '@nestjs/common';
import { MembrosSituacaoController } from './membros-situacao.controller';
import { PagamentosService } from './pagamentos.service';

@Module({
  controllers: [MembrosSituacaoController],
  providers: [PagamentosService],
  exports: [PagamentosService],
})
export class PagamentosModule {}
