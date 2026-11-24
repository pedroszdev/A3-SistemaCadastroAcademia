import { Module } from '@nestjs/common';
import { MensalidadesService } from './mensalidades.service';

// RN18. Exporta o service para Membros gerar a primeira cobrança no cadastro.
@Module({
  providers: [MensalidadesService],
  exports: [MensalidadesService],
})
export class MensalidadesModule {}
