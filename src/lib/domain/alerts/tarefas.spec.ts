import { formatISO } from 'date-fns';
import { describe, expect, it } from 'vitest';
import type { CareEvent, CareTask } from '../types';
import { avaliarOcorrencias } from './tarefas';

// qua, 12 ago 2026
const dia = (h: number, m = 0) => new Date(2026, 7, 12, h, m, 0);

const losartana: CareTask = {
	id: 'losartana',
	patientId: 'p1',
	tipo: 'medicacao',
	titulo: 'Losartana 50mg',
	horarios: ['08:00', '20:00'],
	diasSemana: [0, 1, 2, 3, 4, 5, 6],
	toleranciaMin: 30,
	lembreteAntesMin: 15,
	medicacao: { dose: '50 mg', via: 'oral', inicioTratamento: '2026-08-01T00:00:00-03:00' },
	ativo: true
};

const almoco: CareTask = {
	id: 'almoco',
	patientId: 'p1',
	tipo: 'refeicao',
	titulo: 'Almoço',
	horarios: ['12:00'],
	diasSemana: [0, 1, 2, 3, 4, 5, 6],
	toleranciaMin: 30,
	lembreteAntesMin: 15,
	ativo: true
};

const evento = (taskId: string, quando: Date): CareEvent => ({
	id: `e-${taskId}-${quando.getTime()}`,
	patientId: 'p1',
	taskId,
	tipo: 'medicacao',
	titulo: 'x',
	ocorridoEm: formatISO(quando),
	registradoEm: formatISO(quando),
	registradoPor: 'c1',
	status: 'realizado',
	sincronizado: false
});

const situacaoDe = (avaliacoes: ReturnType<typeof avaliarOcorrencias>, horario: string) =>
	avaliacoes.find((a) => a.ocorrencia.horario === horario)?.situacao;

describe('avaliarOcorrencias (§4.1)', () => {
	it('evento dentro de [horário−30, horário+tolerância] → ok', () => {
		const avaliacoes = avaliarOcorrencias([losartana], [evento('losartana', dia(8, 15))], dia(9));
		expect(situacaoDe(avaliacoes, '08:00')).toBe('ok');
	});

	it('sem evento e passou a tolerância → pendente (atenção)', () => {
		const avaliacoes = avaliarOcorrencias([almoco], [], dia(12, 45));
		expect(situacaoDe(avaliacoes, '12:00')).toBe('pendente');
	});

	it('medicação sem evento há mais de 60min → crítica', () => {
		const avaliacoes = avaliarOcorrencias([losartana], [], dia(9, 10));
		expect(situacaoDe(avaliacoes, '08:00')).toBe('critica');
	});

	it('refeição atrasada há mais de 60min continua só pendente (não é medicação)', () => {
		const avaliacoes = avaliarOcorrencias([almoco], [], dia(13, 30));
		expect(situacaoDe(avaliacoes, '12:00')).toBe('pendente');
	});

	it('antes de estourar a tolerância → futura (sem alerta)', () => {
		const avaliacoes = avaliarOcorrencias([losartana], [], dia(8, 20));
		expect(situacaoDe(avaliacoes, '08:00')).toBe('futura');
	});

	it('evento registrado DEPOIS da tolerância resolve a ocorrência', () => {
		const avaliacoes = avaliarOcorrencias([losartana], [evento('losartana', dia(9, 30))], dia(10));
		expect(situacaoDe(avaliacoes, '08:00')).toBe('ok');
	});

	it('cada evento satisfaz UMA ocorrência: dose da manhã não cobre a da noite', () => {
		const avaliacoes = avaliarOcorrencias(
			[losartana],
			[evento('losartana', dia(8, 10))],
			dia(21, 30)
		);
		expect(situacaoDe(avaliacoes, '08:00')).toBe('ok');
		expect(situacaoDe(avaliacoes, '20:00')).toBe('critica');
	});

	it('evento da noite casa com a ocorrência da noite (janela por proximidade)', () => {
		const avaliacoes = avaliarOcorrencias(
			[losartana],
			[evento('losartana', dia(19, 45))],
			dia(21)
		);
		expect(situacaoDe(avaliacoes, '20:00')).toBe('ok');
		expect(situacaoDe(avaliacoes, '08:00')).toBe('critica');
	});
});
