import { NotFoundException } from '@nestjs/common';
import { HistoricoService } from '../historico/historico.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { TreinosService } from '../treinos/treinos.service';
import { MembrosResumoService } from './membros-resumo.service';
import { MembrosService } from './membros.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

describe('MembrosResumoService', () => {
  let membros: { findOne: jest.Mock };
  let pagamentos: { situacaoMembro: jest.Mock };
  let treinos: { findAll: jest.Mock };
  let historico: { resumoMembro: jest.Mock };
  let service: MembrosResumoService;

  const membro = { id: ID, nome: 'Ana Pereira', acessoLiberado: false };
  const situacao = {
    situacao: 'INADIMPLENTE',
    pagamentosAtrasados: 2,
    maiorAtrasoDias: 15,
  };
  const treino = { id: 't1', tipo: 'Musculação', dataInicio: '2026-11-01' };

  beforeEach(() => {
    // hoje = 2026-11-05 em São Paulo
    jest.useFakeTimers().setSystemTime(new Date('2026-11-05T15:00:00Z'));
    membros = { findOne: jest.fn().mockResolvedValue(membro) };
    pagamentos = { situacaoMembro: jest.fn().mockResolvedValue(situacao) };
    treinos = {
      findAll: jest.fn().mockResolvedValue({ data: [treino], total: 3 }),
    };
    historico = {
      resumoMembro: jest
        .fn()
        .mockResolvedValue({ totalAtividades: 12, totalMinutos: 540 }),
    };
    service = new MembrosResumoService(
      membros as unknown as MembrosService,
      pagamentos as unknown as PagamentosService,
      treinos as unknown as TreinosService,
      historico as unknown as HistoricoService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('compõe as quatro partes a partir dos services, sem recalcular regra', async () => {
    await expect(service.resumo(ID)).resolves.toEqual({
      membro,
      situacaoFinanceira: situacao,
      treinoMaisRecente: treino,
      atividadesUltimos30Dias: 12,
    });

    expect(membros.findOne).toHaveBeenCalledWith(ID);
    expect(pagamentos.situacaoMembro).toHaveBeenCalledWith(ID);
    expect(treinos.findAll).toHaveBeenCalledWith({
      membroId: ID,
      page: 1,
      pageSize: 1,
    });
    // 30 dias contando hoje: de 07/10 a 05/11
    expect(historico.resumoMembro).toHaveBeenCalledWith(
      ID,
      new Date('2026-10-07'),
      new Date('2026-11-05'),
    );
  });

  it('sem treino, treinoMaisRecente é null', async () => {
    treinos.findAll.mockResolvedValue({ data: [], total: 0 });

    const resposta = await service.resumo(ID);

    expect(resposta.treinoMaisRecente).toBeNull();
  });

  it('a janela de 30 dias usa o dia de São Paulo, não o de UTC', async () => {
    // 23h do dia 05/11 em São Paulo já é 06/11 em UTC
    jest.setSystemTime(new Date('2026-11-06T02:00:00Z'));

    await service.resumo(ID);

    expect(historico.resumoMembro).toHaveBeenCalledWith(
      ID,
      new Date('2026-10-07'),
      new Date('2026-11-05'),
    );
  });

  it('membro inexistente: propaga o 404 sem consultar o resto', async () => {
    membros.findOne.mockRejectedValue(
      new NotFoundException('Membro não encontrado'),
    );

    await expect(service.resumo(ID)).rejects.toThrow(NotFoundException);

    expect(pagamentos.situacaoMembro).not.toHaveBeenCalled();
    expect(treinos.findAll).not.toHaveBeenCalled();
    expect(historico.resumoMembro).not.toHaveBeenCalled();
  });
});
