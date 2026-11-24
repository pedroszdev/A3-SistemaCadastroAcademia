import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator';
import type { UsuarioAutenticado } from '../auth/usuario-autenticado';
import { QueryMeusPagamentosDto } from './dto/query-meus-pagamentos.dto';
import { PagamentosService } from './pagamentos.service';

// As mensalidades do próprio aluno, só leitura. O membroId vem do token (RN16).
@Roles('ALUNO')
@Controller('me/pagamentos')
export class MeusPagamentosController {
  constructor(private readonly pagamentos: PagamentosService) {}

  @Get()
  findAll(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query() query: QueryMeusPagamentosDto,
  ) {
    return this.pagamentos.findAll({ ...query, membroId: usuario.id });
  }

  // Situação (RN09), a próxima cobrança em aberto e o plano do aluno (RN18).
  @Get('resumo')
  resumo(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.pagamentos.resumoDoAluno(usuario.id);
  }
}
