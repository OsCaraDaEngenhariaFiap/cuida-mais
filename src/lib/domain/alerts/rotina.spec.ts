import { describe, expect, it } from 'vitest';
import type { CareTask, MeasurementType } from '../types';
import { avaliarEstoque, semRegistroHaMuito } from './rotina';

const tarefa: CareTask = {
	id: 't1',
	patientId: 'p1',
	tipo: 'medicacao',
	titulo: 'Losartana 50mg',
	horarios: ['08:00', '20:00'],
	diasSemana: [0, 1, 2, 3, 4, 5, 6],
	toleranciaMin: 30,
	lembreteAntesMin: 15,
	medicacao: {
		dose: '50 mg',
		via: 'oral',
		inicioTratamento: '2026-08-01T00:00:00-03:00',
		estoque: { quantidadeAtual: 4, unidade: 'comprimidos', consumoPorDose: 1, alertarAbaixoDe: 6 }
	},
	ativo: true
};

describe('avaliarEstoque (§4.4)', () => {
	it('quantidade ≤ alertarAbaixoDe → baixo, com estimativa de dias', () => {
		const r = avaliarEstoque(tarefa);
		expect(r.baixo).toBe(true);
		expect(r.diasRestantes).toBe(2); // 4 comprimidos ÷ (1 × 2 doses/dia)
	});

	it('acima do limite não alerta', () => {
		const cheia: CareTask = {
			...tarefa,
			medicacao: {
				...tarefa.medicacao!,
				estoque: { ...tarefa.medicacao!.estoque!, quantidadeAtual: 30 }
			}
		};
		expect(avaliarEstoque(cheia)).toMatchObject({ baixo: false, diasRestantes: 15 });
	});

	it('sem estoque configurado ou tarefa inativa → nunca alerta', () => {
		expect(avaliarEstoque({ ...tarefa, medicacao: { ...tarefa.medicacao!, estoque: undefined } }).baixo).toBe(false);
		expect(avaliarEstoque({ ...tarefa, ativo: false }).baixo).toBe(false);
	});
});

describe('semRegistroHaMuito (§4.3)', () => {
	const evacuacao: MeasurementType = {
		id: 'ev',
		slug: 'evacuacao',
		nome: 'Evacuação',
		icone: '🚽',
		sistema: true,
		ativo: true,
		alertaSemRegistroHoras: 72,
		campos: [{ chave: 'ocorreu', rotulo: 'Ocorreu', formato: 'booleano' }]
	};
	const agora = new Date(2026, 7, 12, 10, 0);

	it('última leitura além do limite → alerta (não evacua há 4 dias)', () => {
		const r = semRegistroHaMuito(evacuacao, '2026-08-08T08:00:00-03:00', agora);
		expect(r.alerta).toBe(true);
		expect(r.horasDesde).toBeGreaterThan(72);
	});

	it('dentro do limite não alerta', () => {
		expect(semRegistroHaMuito(evacuacao, '2026-08-11T08:00:00-03:00', agora).alerta).toBe(false);
	});

	it('sem limite configurado ou sem nenhuma leitura → não alerta', () => {
		const semLimite = { ...evacuacao, alertaSemRegistroHoras: undefined };
		expect(semRegistroHaMuito(semLimite, '2026-08-01T08:00:00-03:00', agora).alerta).toBe(false);
		expect(semRegistroHaMuito(evacuacao, undefined, agora).alerta).toBe(false);
	});
});
