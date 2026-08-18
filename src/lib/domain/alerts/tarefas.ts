// §4.1 — Tarefa atrasada / esquecida: casa eventos do dia com as ocorrências
// esperadas e classifica cada uma.
import { addMinutes, endOfDay, parseISO, subMinutes } from 'date-fns';
import { gerarOcorrenciasDoDia, type OcorrenciaEsperada } from '../schedule/ocorrencias';
import type { CareEvent, CareTask } from '../types';

export type SituacaoOcorrencia = 'ok' | 'futura' | 'pendente' | 'critica';

export interface AvaliacaoOcorrencia {
	ocorrencia: OcorrenciaEsperada;
	situacao: SituacaoOcorrencia;
	atrasoMin: number;
}

/**
 * | condição                                              | resultado  |
 * | evento da task entre [horário−30min, próxima ocorrência) | ok      |
 * | ainda dentro de horário+tolerância                    | futura     |
 * | passou horário+tolerância                             | pendente   |
 * | passou horário+60min e tipo=medicacao                 | critica    |
 * (evento registrado depois da tolerância também resolve — entra salvo
 *  como 'atrasado' e a ocorrência vira ok)
 */
export function avaliarOcorrencias(
	tasks: CareTask[],
	eventosDoDia: CareEvent[],
	agora: Date
): AvaliacaoOcorrencia[] {
	const ocorrencias = gerarOcorrenciasDoDia(tasks, agora);
	const eventosPorTarefa = new Map<string, Date[]>();
	for (const evento of eventosDoDia) {
		if (!evento.taskId) continue;
		const lista = eventosPorTarefa.get(evento.taskId) ?? [];
		lista.push(parseISO(evento.ocorridoEm));
		eventosPorTarefa.set(evento.taskId, lista);
	}
	for (const lista of eventosPorTarefa.values()) lista.sort((a, b) => a.getTime() - b.getTime());

	const usados = new Map<string, Set<number>>();

	return ocorrencias.map((ocorrencia) => {
		const daTarefa = ocorrencias.filter((o) => o.taskId === ocorrencia.taskId);
		const posicao = daTarefa.indexOf(ocorrencia);
		const proxima = daTarefa[posicao + 1];
		const inicioJanela = subMinutes(ocorrencia.momento, 30);
		const fimJanela = proxima ? subMinutes(proxima.momento, 30) : endOfDay(agora);

		const eventos = eventosPorTarefa.get(ocorrencia.taskId) ?? [];
		const consumidos = usados.get(ocorrencia.taskId) ?? new Set<number>();
		usados.set(ocorrencia.taskId, consumidos);
		const indice = eventos.findIndex(
			(quando, i) => !consumidos.has(i) && quando >= inicioJanela && quando < fimJanela
		);

		const atrasoMin = Math.floor((agora.getTime() - ocorrencia.momento.getTime()) / 60_000);
		let situacao: SituacaoOcorrencia;
		if (indice >= 0) {
			consumidos.add(indice);
			situacao = 'ok';
		} else if (agora <= addMinutes(ocorrencia.momento, ocorrencia.toleranciaMin)) {
			situacao = 'futura';
		} else if (ocorrencia.tipo === 'medicacao' && atrasoMin > 60) {
			situacao = 'critica';
		} else {
			situacao = 'pendente';
		}
		return { ocorrencia, situacao, atrasoMin };
	});
}
