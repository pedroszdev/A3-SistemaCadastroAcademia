import { NotFoundException } from '@nestjs/common';
import { Cargo } from '../generated/prisma/enums';
import { HistoricoService } from '../historico/historico.service';
import { MembrosService } from '../membros/membros.service';
import { PagamentosService } from '../pagamentos/pagamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { MembrosResumoService } from './membros-resumo.service';

const ID = '0199f0a2-7b3c-7d4e-8f00-123456789abc';

const MEMBRO = {
  id: ID,
  nome: 'Maria Souza',
  cpf: '52998224725',
  telefone: '11999990000',
  endereco: 'Rua A, 10',
  ativo: true,
  dataCadastro: new Date('2026-01-10T00:00:00.000Z'),
  acessoLiberado: false,
};

const SITUACAO = {
  situacao: 'INADIMPLENTE',
  pagamentosAtrasados: 2,
  maiorAtrasoDias: 15,
};

const TREINO = {
  id: '0199f0a2-7b3c-7d4e-8f00-123456789d01',
  tipo: 'Musculação',
  descricao: 'Treino de peito e tríceps',
  duracao: 60,
  dataInicio: new Date('2026-11-01T00:00:00.000Z'),
};

describe('MembrosResumoService', () => {
  let prisma: { treino: { findFirst: jest.Mock } };
  let membros: { findOne: jest.Mock };
  let pagamentos: { situacaoMembro: jest.Mock };
  let historico: { resumoMembro: jest.Mock };
  let service: MembrosResumoService;

  beforeEach(() => {
    // hoje = 2026-11-11 em São Paulo
    jest.useFakeTimers().setSystemTime(new Date('2026-11-11T15:00:00Z'));
    prisma = { treino: { findFirst: jest.fn().mockResolvedValue(TREINO) } };
    membros = { findOne: jest.fn().mockResolvedValue(MEMBRO) };
    pagamentos = { situacaoMembro: jest.fn().mockResolvedValue(SITUACAO) };
    historico = {
      resumoMembro: jest
        .fn()
        .mockResolvedValue({ totalAtividades: 7, totalMinutos: 300 }),
    };
    service = new MembrosResumoService(
      prisma as unknown as PrismaService,
      membros as unknown as MembrosService,
      pagamentos as unknown as PagamentosService,
      historico as unknown as HistoricoService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([Cargo.ADMIN, Cargo.RECEPCIONISTA])(
    '%s recebe o resumo completo, com a situação financeira',
    async (cargo) => {
      await expect(service.resumo(ID, cargo)).resolves.toEqual({
        membro: MEMBRO,
        situacaoFinanceira: SITUACAO,
        treinoMaisRecente: TREINO,
        atividadesUltimos30Dias: 7,
      });

      expect(membros.findOne).toHaveBeenCalledWith(ID);
      expect(pagamentos.situacaoMembro).toHaveBeenCalledWith(ID);
    },
  );

  it('INSTRUTOR recebe situacaoFinanceira null e o PagamentosService não é chamado', async () => {
    const resumo = await service.resumo(ID, Cargo.INSTRUTOR);

    expect(resumo.situacaoFinanceira).toBeNull();
    expect(resumo.treinoMaisRecente).toBe(TREINO);
    expect(pagamentos.situacaoMembro).not.toHaveBeenCalled();
  });

  it('sem cargo não chama o PagamentosService (nega por padrão)', async () => {
    const resumo = await service.resumo(ID);

    expect(resumo.situacaoFinanceira).toBeNull();
    expect(pagamentos.situacaoMembro).not.toHaveBeenCalled();
  });

  it('pega o treino de maior dataInicio, com o id desempatando', async () => {
    await service.resumo(ID, Cargo.ADMIN);

    expect(prisma.treino.findFirst).toHaveBeenCalledWith({
      where: { membroId: ID },
      orderBy: [{ dataInicio: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        tipo: true,
        descricao: true,
        duracao: true,
        dataInicio: true,
      },
    });
  });

  it('treinoMaisRecente é null quando o membro não tem treino', async () => {
    prisma.treino.findFirst.mockResolvedValue(null);

    const resumo = await service.resumo(ID, Cargo.ADMIN);

    expect(resumo.treinoMaisRecente).toBeNull();
  });

  it('conta as atividades só na janela de 30 dias, de hoje - 29 até hoje', async () => {
    await service.resumo(ID, Cargo.ADMIN);

    expect(historico.resumoMembro).toHaveBeenCalledWith(
      ID,
      new Date('2026-10-13T00:00:00.000Z'),
      new Date('2026-11-11T00:00:00.000Z'),
    );
  });

  it('usa o dia de São Paulo para a janela, mesmo com o UTC já no dia seguinte', async () => {
    // 01:00 UTC de 12/11 ainda é 22:00 de 11/11 em São Paulo
    jest.setSystemTime(new Date('2026-11-12T01:00:00Z'));

    await service.resumo(ID, Cargo.ADMIN);

    expect(historico.resumoMembro).toHaveBeenCalledWith(
      ID,
      new Date('2026-10-13T00:00:00.000Z'),
      new Date('2026-11-11T00:00:00.000Z'),
    );
  });

  it('atividadesUltimos30Dias é 0 sem atividades na janela', async () => {
    historico.resumoMembro.mockResolvedValue({
      totalAtividades: 0,
      totalMinutos: 0,
    });

    const resumo = await service.resumo(ID, Cargo.ADMIN);

    expect(resumo.atividadesUltimos30Dias).toBe(0);
  });

  it('propaga o 404 do membro inexistente sem consultar o resto', async () => {
    membros.findOne.mockRejectedValue(
      new NotFoundException('Membro não encontrado'),
    );

    await expect(service.resumo(ID, Cargo.ADMIN)).rejects.toThrow(
      NotFoundException,
    );
    expect(pagamentos.situacaoMembro).not.toHaveBeenCalled();
    expect(prisma.treino.findFirst).not.toHaveBeenCalled();
    expect(historico.resumoMembro).not.toHaveBeenCalled();
  });
});
