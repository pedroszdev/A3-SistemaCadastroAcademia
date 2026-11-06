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
}
