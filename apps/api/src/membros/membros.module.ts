import { Module } from '@nestjs/common';
import { MembrosController } from './membros.controller';
import { MembrosService } from './membros.service';

// Expõe as rotas /membros e exporta o MembrosService para Treinos, Pagamentos e
// Histórico usarem o assertMembroAtivo (RN04).
@Module({
  controllers: [MembrosController],
  providers: [MembrosService],
  exports: [MembrosService],
})
export class MembrosModule {}
