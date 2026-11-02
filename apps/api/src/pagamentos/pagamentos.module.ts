import { Module } from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';

@Module({
  providers: [PagamentosService],
  exports: [PagamentosService],
})
export class PagamentosModule {}
