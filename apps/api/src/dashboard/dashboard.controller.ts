import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { Cargo } from '../generated/prisma/enums';
import { DashboardService } from './dashboard.service';

@Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA, Cargo.INSTRUTOR)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  resumo() {
    return this.dashboard.resumo();
  }

  // Matriz 4.2: situação financeira é só ADMIN e RECEPCIONISTA.
  @Get('inadimplentes')
  @Roles(Cargo.ADMIN, Cargo.RECEPCIONISTA)
  inadimplentes() {
    return this.dashboard.inadimplentes();
  }
}
