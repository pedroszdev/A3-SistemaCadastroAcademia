import { Module } from '@nestjs/common';
import { MembrosSituacaoController } from './membros-situacao.controller';
import { MeusPagamentosController } from './meus-pagamentos.controller';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';

@Module({
  controllers: [
    PagamentosController,
    MembrosSituacaoController,
    MeusPagamentosController,
  ],
  providers: [PagamentosService],
  exports: [PagamentosService],
})
export class PagamentosModule {}
