import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let service: { resumo: jest.Mock; inadimplentes: jest.Mock };
  let controller: DashboardController;

  beforeEach(() => {
    service = { resumo: jest.fn(), inadimplentes: jest.fn() };
    controller = new DashboardController(
      service as unknown as DashboardService,
    );
  });

  it('resumo delega ao service e devolve o resultado', async () => {
    const resumo = {
      membrosAtivos: 2,
      membrosInadimplentes: 1,
      pagamentosAtrasados: 2,
      receitaMes: 100,
      atividadesHoje: 1,
    };
    service.resumo.mockResolvedValue(resumo);

    await expect(controller.resumo()).resolves.toBe(resumo);
    expect(service.resumo).toHaveBeenCalledTimes(1);
  });

  it('inadimplentes delega ao service e devolve o resultado', async () => {
    const lista = [{ id: 'm1', nome: 'João Pereira', maiorAtrasoDias: 15 }];
    service.inadimplentes.mockResolvedValue(lista);

    await expect(controller.inadimplentes()).resolves.toBe(lista);
    expect(service.inadimplentes).toHaveBeenCalledTimes(1);
  });
});
