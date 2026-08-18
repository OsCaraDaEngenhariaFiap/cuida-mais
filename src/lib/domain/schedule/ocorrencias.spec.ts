import { describe, expect, it } from 'vitest';
import type { CareTask } from '../types';
import { gerarOcorrenciasDoDia, proximasOcorrencias, tarefaValeNoDia } from './ocorrencias';

// qua, 12 ago 2026 (getDay() = 3)
const quarta = new Date(2026, 7, 12, 10, 0, 0);

const base: CareTask = {
	id: 't1',
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

describe('gerarOcorrenciasDoDia (§4.1)', () => {
	it('cada horário do dia vira uma ocorrência, em ordem', () => {
		const ocorrencias = gerarOcorrenciasDoDia([base], quarta);
		expect(ocorrencias).toHaveLength(2);
		expect(ocorrencias.map((o) => o.horario)).toEqual(['08:00', '20:00']);
		expect(ocorrencias[0].momento.getHours()).toBe(8);
	});

	it('tarefa inativa não gera ocorrência', () => {
		expect(gerarOcorrenciasDoDia([{ ...base, ativo: false }], quarta)).toHaveLength(0);
	});

	it('respeita os dias da semana', () => {
		const somenteSegunda = { ...base, diasSemana: [1] };
		expect(gerarOcorrenciasDoDia([somenteSegunda], quarta)).toHaveLength(0);
		expect(tarefaValeNoDia({ ...base, diasSemana: [3] }, quarta)).toBe(true);
	});

	it('fora do período inicioTratamento–fimTratamento não gera', () => {
		const aindaNaoComecou = {
			...base,
			medicacao: { ...base.medicacao!, inicioTratamento: '2026-08-20T00:00:00-03:00' }
		};
		expect(gerarOcorrenciasDoDia([aindaNaoComecou], quarta)).toHaveLength(0);

		const jaAcabou = {
			...base,
			medicacao: {
				...base.medicacao!,
				inicioTratamento: '2026-08-01T00:00:00-03:00',
				fimTratamento: '2026-08-10T00:00:00-03:00'
			}
		};
		expect(gerarOcorrenciasDoDia([jaAcabou], quarta)).toHaveLength(0);
	});

	it('sem fimTratamento é uso contínuo; começa no próprio dia do início', () => {
		const começaHoje = {
			...base,
			medicacao: { ...base.medicacao!, inicioTratamento: '2026-08-12T09:00:00-03:00' }
		};
		expect(gerarOcorrenciasDoDia([começaHoje], quarta)).toHaveLength(2);
	});

	it('tarefa sem medicação (refeição) não tem período — sempre vale', () => {
		const refeicao: CareTask = {
			...base,
			tipo: 'refeicao',
			titulo: 'Almoço',
			horarios: ['12:00'],
			medicacao: undefined
		};
		expect(gerarOcorrenciasDoDia([refeicao], quarta)).toHaveLength(1);
	});
});

describe('proximasOcorrencias (dashboard)', () => {
	it('só devolve o que ainda vem hoje, ordenado e limitado', () => {
		const outra: CareTask = {
			...base,
			id: 't2',
			tipo: 'refeicao',
			titulo: 'Almoço',
			horarios: ['12:00'],
			medicacao: undefined
		};
		// agora = 10:00 → 08:00 já passou; vêm 12:00 e 20:00
		const proximas = proximasOcorrencias([base, outra], quarta);
		expect(proximas.map((o) => o.horario)).toEqual(['12:00', '20:00']);
		expect(proximasOcorrencias([base, outra], quarta, 1).map((o) => o.horario)).toEqual(['12:00']);
	});
});
