import { describe, expect, it } from 'vitest';
import type { CareTask } from '../types';
import { disparosDeNotificacao } from './notificacoes';
import { gerarOcorrenciasDoDia } from './ocorrencias';

const tarefa: CareTask = {
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

const nome = () => 'Maria';

describe('disparosDeNotificacao (§7)', () => {
	it('cada ocorrência futura gera exatamente 2 disparos: lembrete e horário', () => {
		const agora = new Date(2026, 7, 12, 6, 0);
		const disparos = disparosDeNotificacao(gerarOcorrenciasDoDia([tarefa], agora), nome, agora);
		expect(disparos).toHaveLength(4); // 2 horários × 2 disparos
		expect(disparos[0].titulo).toBe('Em 15 min: Losartana 50mg');
		expect(disparos[0].quando).toEqual(new Date(2026, 7, 12, 7, 45));
		expect(disparos[1].titulo).toBe('Agora: Losartana 50mg');
		expect(disparos[1].quando).toEqual(new Date(2026, 7, 12, 8, 0));
		expect(disparos[0].corpo).toContain('Maria');
	});

	it('depois do horário NÃO há notificação — vira alerta in-app', () => {
		const agora = new Date(2026, 7, 12, 8, 5); // 08:00 já passou
		const disparos = disparosDeNotificacao(gerarOcorrenciasDoDia([tarefa], agora), nome, agora);
		expect(disparos.map((d) => d.tag)).toEqual(['t1|20:00|lembrete', 't1|20:00|agora']);
	});

	it('entre lembrete e horário, só o disparo do horário resta', () => {
		const agora = new Date(2026, 7, 12, 7, 50); // lembrete das 07:45 já passou
		const disparos = disparosDeNotificacao(gerarOcorrenciasDoDia([tarefa], agora), nome, agora);
		expect(disparos.filter((d) => d.tag.includes('08:00')).map((d) => d.tag)).toEqual([
			't1|08:00|agora'
		]);
	});

	it('lembreteAntesMin = 0 desliga o pré-aviso', () => {
		const semLembrete = { ...tarefa, lembreteAntesMin: 0, horarios: ['08:00'] };
		const agora = new Date(2026, 7, 12, 6, 0);
		const disparos = disparosDeNotificacao(gerarOcorrenciasDoDia([semLembrete], agora), nome, agora);
		expect(disparos).toHaveLength(1);
		expect(disparos[0].tag).toContain('agora');
	});
});
