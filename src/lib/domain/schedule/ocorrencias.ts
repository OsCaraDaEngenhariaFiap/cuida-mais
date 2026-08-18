// Ocorrências esperadas (§4.1): cada horário previsto do dia de uma CareTask
// ativa vira uma ocorrência. Puro — recebe dados, devolve dados.
import { endOfDay, parseISO, set, startOfDay } from 'date-fns';
import type { CareTask, TipoCuidado, UUID } from '../types';

export interface OcorrenciaEsperada {
	taskId: UUID;
	patientId: UUID;
	tipo: TipoCuidado;
	titulo: string;
	horario: string; // "08:00"
	momento: Date; // dia + horário
	toleranciaMin: number;
	lembreteAntesMin: number;
}

/** Tarefa vale para o dia? (ativa, dia da semana e período de tratamento) */
export function tarefaValeNoDia(task: CareTask, dia: Date): boolean {
	if (!task.ativo) return false;
	if (!task.diasSemana.includes(dia.getDay())) return false;
	if (task.medicacao) {
		const inicio = parseISO(task.medicacao.inicioTratamento);
		if (endOfDay(dia) < inicio) return false;
		if (task.medicacao.fimTratamento && startOfDay(dia) > parseISO(task.medicacao.fimTratamento)) {
			return false;
		}
	}
	return true;
}

export function gerarOcorrenciasDoDia(tasks: CareTask[], dia: Date): OcorrenciaEsperada[] {
	const ocorrencias: OcorrenciaEsperada[] = [];
	for (const task of tasks) {
		if (!tarefaValeNoDia(task, dia)) continue;
		for (const horario of task.horarios) {
			const [h, m] = horario.split(':').map(Number);
			ocorrencias.push({
				taskId: task.id,
				patientId: task.patientId,
				tipo: task.tipo,
				titulo: task.titulo,
				horario,
				momento: set(dia, { hours: h, minutes: m, seconds: 0, milliseconds: 0 }),
				toleranciaMin: task.toleranciaMin,
				lembreteAntesMin: task.lembreteAntesMin
			});
		}
	}
	return ocorrencias.sort((a, b) => a.momento.getTime() - b.momento.getTime());
}

/** Ocorrências de hoje ainda por vir — o "próximos horários" do dashboard. */
export function proximasOcorrencias(
	tasks: CareTask[],
	agora: Date,
	limite = 8
): OcorrenciaEsperada[] {
	return gerarOcorrenciasDoDia(tasks, agora)
		.filter((o) => o.momento >= agora)
		.slice(0, limite);
}
