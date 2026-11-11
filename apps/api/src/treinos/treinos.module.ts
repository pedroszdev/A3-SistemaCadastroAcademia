import { Module } from '@nestjs/common';
import { MembrosModule } from '../membros/membros.module';
import { MembrosTreinosController } from './membros-treinos.controller';
import { MeusTreinosController } from './meus-treinos.controller';
import { TreinosController } from './treinos.controller';
import { TreinosService } from './treinos.service';

// Exporta o TreinosService para a ficha do membro.
@Module({
  imports: [MembrosModule],
  controllers: [
    TreinosController,
    MembrosTreinosController,
    MeusTreinosController,
  ],
  providers: [TreinosService],
  exports: [TreinosService],
})
export class TreinosModule {}
