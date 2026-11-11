import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Cargo } from '../generated/prisma/enums';
import { QueryTreinoMembroDto } from './dto/query-treino.dto';
import { TreinosService } from './treinos.service';

// A rota fica em Treinos porque a consulta é daqui; o prefixo `membros`
// convive com o `MembrosController` sem colidir.
@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA, Cargo.INSTRUTOR)
@Controller('membros')
export class MembrosTreinosController {
  constructor(private readonly treinos: TreinosService) {}

  @Get(':id/treinos')
  findAll(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryTreinoMembroDto,
  ) {
    return this.treinos.findAllDoMembro(id, query);
  }
}
