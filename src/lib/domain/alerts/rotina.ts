// §4.3 (sem registro há tempo demais) e §4.4 (estoque baixo) — funções puras.
import { differenceInMinutes, parseISO } from 'date-fns';
import type { CareTask, ISODate, MeasurementType } from '../types';

export interface AvaliacaoEstoque {
	baixo: boolean;
	quantidadeAtual?: number;
	unidade?: string;
	diasRestantes?: number;
}

/** §4.4: quantidadeAtual ≤ alertarAbaixoDe → alerta, com estimativa de dias. */
export function avaliarEstoque(task: CareTask): AvaliacaoEstoque {
	const estoque = task.medicacao?.estoque;
	if (!estoque || !task.ativo) return { baixo: false };
	const dosesPorDia = task.horarios.length * (task.diasSemana.length / 7);
	const consumoDiario = estoque.consumoPorDose * dosesPorDia;
	const diasRestantes =
		consumoDiario > 0 ? Math.floor(estoque.quantidadeAtual / consumoDiario) : undefined;
	return {
		baixo: estoque.quantidadeAtual <= estoque.alertarAbaixoDe,
		quantidadeAtual: estoque.quantidadeAtual,
		unidade: estoque.unidade,
		diasRestantes
	};
}

export interface AvaliacaoSemRegistro {
	alerta: boolean;
	horasDesde?: number;
	limiteHoras?: number;
}

/**
 * §4.3: tipo com alertaSemRegistroHoras e última leitura mais antiga que o
 * limite → atenção. Paciente que NUNCA registrou o tipo não alerta — só há
 * "sem registro há tempo demais" quando a série existe.
 */
export function semRegistroHaMuito(
	tipo: MeasurementType,
	ultimaLeituraEm: ISODate | undefined,
	agora: Date
): AvaliacaoSemRegistro {
	if (!tipo.alertaSemRegistroHoras || !tipo.ativo || !ultimaLeituraEm) return { alerta: false };
	const horasDesde = differenceInMinutes(agora, parseISO(ultimaLeituraEm)) / 60;
	return {
		alerta: horasDesde > tipo.alertaSemRegistroHoras,
		horasDesde,
		limiteHoras: tipo.alertaSemRegistroHoras
	};
}
