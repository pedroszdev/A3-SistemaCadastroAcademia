import { HistoricoService } from '../historico/historico.service';
import { MembrosService } from '../membros/membros.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let membros: { findAll: jest.Mock };
  let pagamentos: {
    findAll: jest.Mock;
    contarInadimplentes: jest.Mock;
    receitaDoPeriodo: jest.Mock;
  };
  let historico: { findAll: jest.Mock };
  let service: DashboardService;

  beforeEach(() => {
    // hoje = 2026-11-05 em São Paulo
    jest.useFakeTimers().setSystemTime(new Date('2026-11-05T15:00:00Z'));
    membros = { findAll: jest.fn().mockResolvedValue({ total: 7 }) };
    pagamentos = {
      findAll: jest.fn().mockResolvedValue({ total: 4 }),
      contarInadimplentes: jest.fn().mockResolvedValue(2),
      receitaDoPeriodo: jest.fn().mockResolvedValue(1234.5),
    };
    historico = { findAll: jest.fn().mockResolvedValue({ total: 9 }) };
    service = new DashboardService(
      membros as unknown as MembrosService,
      pagamentos as unknown as PagamentosService,
      historico as unknown as HistoricoService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('compõe os cinco números a partir dos services, sem recalcular regra', async () => {
    await expect(service.resumo()).resolves.toEqual({
      membrosAtivos: 7,
      membrosInadimplentes: 2,
      pagamentosAtrasados: 4,
      receitaMes: 1234.5,
      atividadesHoje: 9,
    });

    expect(membros.findAll).toHaveBeenCalledWith({
      ativo: true,
      page: 1,
      pageSize: 1,
    });
    expect(pagamentos.contarInadimplentes).toHaveBeenCalledTimes(1);
    expect(pagamentos.findAll).toHaveBeenCalledWith({
      status: 'ATRASADO',
      page: 1,
      pageSize: 1,
    });
    expect(pagamentos.receitaDoPeriodo).toHaveBeenCalledWith(
      new Date('2026-11-01'),
      new Date('2026-12-01'),
    );
    expect(historico.findAll).toHaveBeenCalledWith({
      dataDe: new Date('2026-11-05'),
      dataAte: new Date('2026-11-05'),
      page: 1,
      pageSize: 1,
    });
  });

  it('em dezembro o mês termina em 1º de janeiro do ano seguinte', async () => {
    jest.setSystemTime(new Date('2026-12-20T15:00:00Z'));

    await service.resumo();

    expect(pagamentos.receitaDoPeriodo).toHaveBeenCalledWith(
      new Date('2026-12-01'),
      new Date('2027-01-01'),
    );
  });

  it('propaga o erro de um dos services', async () => {
    pagamentos.contarInadimplentes.mockRejectedValue(new Error('falha'));

    await expect(service.resumo()).rejects.toThrow('falha');
  });
});
