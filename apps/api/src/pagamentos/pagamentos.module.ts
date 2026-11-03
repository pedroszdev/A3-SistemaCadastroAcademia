import { Module } from '@nestjs/common';
import { MembrosSituacaoController } from './membros-situacao.controller';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';

@Module({
  controllers: [PagamentosController, MembrosSituacaoController],
  providers: [PagamentosService],
  exports: [PagamentosService],
})
export class PagamentosModule {}
