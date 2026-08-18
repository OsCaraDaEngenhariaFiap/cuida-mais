// §7 — regra de notificação: DOIS disparos por ocorrência e só isso.
// | horário − lembreteAntesMin | "Em X min: Losartana 50mg — Maria" |
// | horário exato              | "Agora: Losartana 50mg — Maria"    |
// | depois do horário          | nenhuma — vira alerta in-app (§4.1)|
import { subMinutes } from 'date-fns';
import type { OcorrenciaEsperada } from './ocorrencias';

export interface DisparoNotificacao {
	quando: Date;
	titulo: string;
	corpo: string;
	/** identidade estável do disparo — evita disparo duplicado ao reagendar */
	tag: string;
}

export function disparosDeNotificacao(
	ocorrencias: OcorrenciaEsperada[],
	nomePaciente: (patientId: string) => string,
	agora: Date
): DisparoNotificacao[] {
	const disparos: DisparoNotificacao[] = [];
	for (const ocorrencia of ocorrencias) {
		const nome = nomePaciente(ocorrencia.patientId);
		const lembrete = subMinutes(ocorrencia.momento, ocorrencia.lembreteAntesMin);
		if (lembrete > agora && ocorrencia.lembreteAntesMin > 0) {
			disparos.push({
				quando: lembrete,
				titulo: `Em ${ocorrencia.lembreteAntesMin} min: ${ocorrencia.titulo}`,
				corpo: `${nome} — previsto às ${ocorrencia.horario}`,
				tag: `${ocorrencia.taskId}|${ocorrencia.horario}|lembrete`
			});
		}
		if (ocorrencia.momento > agora) {
			disparos.push({
				quando: ocorrencia.momento,
				titulo: `Agora: ${ocorrencia.titulo}`,
				corpo: `${nome} — ${ocorrencia.horario}`,
				tag: `${ocorrencia.taskId}|${ocorrencia.horario}|agora`
			});
		}
		// depois do horário: nada — sem insistência (§2)
	}
	return disparos.sort((a, b) => a.quando.getTime() - b.quando.getTime());
}
