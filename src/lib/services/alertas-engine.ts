// Runner do motor de alertas: busca dados via services, decide com as funções
// puras de domain/alerts e persiste com deduplicação (§4.5). Reavaliado ao
// abrir o app, ao salvar um evento e a cada 60s (§4).
import { avaliarLeitura } from '$lib/domain/alerts/leituras';
import { avaliarEstoque, semRegistroHaMuito } from '$lib/domain/alerts/rotina';
import { avaliarOcorrencias, type AvaliacaoOcorrencia } from '$lib/domain/alerts/tarefas';
import type { MeasurementType, Patient, Reading } from '$lib/domain/types';
import { services } from '$lib/services';

const formatarValor = (leitura: Reading, tipo: MeasurementType): string => {
	const campo = tipo.campos.find((c) => c.chave === leitura.campo);
	const unidade = campo?.unidade ? ` ${campo.unidade}` : '';
	return `${leitura.valorNum ?? leitura.valorTexto ?? '—'}${unidade}`;
};

async function avaliarTarefasDoPaciente(paciente: Patient, agora: Date): Promise<void> {
	const tarefas = await services.tasks.listarPorPaciente(paciente.id);
	const eventos = await services.events.listarPorDia(paciente.id, agora);
	const avaliacoes = avaliarOcorrencias(tarefas, eventos, agora);

	// pior situação por tarefa (crítica > pendente > futura/ok)
	const peso = { critica: 3, pendente: 2, futura: 1, ok: 0 } as const;
	const porTarefa = new Map<string, AvaliacaoOcorrencia>();
	for (const avaliacao of avaliacoes) {
		const atual = porTarefa.get(avaliacao.ocorrencia.taskId);
		if (!atual || peso[avaliacao.situacao] > peso[atual.situacao]) {
			porTarefa.set(avaliacao.ocorrencia.taskId, avaliacao);
		}
	}

	for (const [taskId, { ocorrencia, situacao, atrasoMin }] of porTarefa) {
		if (situacao === 'critica') {
			await services.alerts.resolverPorReferencia('tarefa_pendente', taskId, paciente.id);
			await services.alerts.criarSeNovo({
				patientId: paciente.id,
				tipo: 'medicacao_atrasada',
				severidade: 'critico',
				titulo: 'Medicação atrasada',
				detalhe: `${ocorrencia.titulo} — previsto às ${ocorrencia.horario}, há ${atrasoMin} min sem registro`,
				referenciaId: taskId
			});
		} else if (situacao === 'pendente') {
			await services.alerts.criarSeNovo({
				patientId: paciente.id,
				tipo: 'tarefa_pendente',
				severidade: 'atencao',
				titulo: 'Tarefa pendente',
				detalhe: `${ocorrencia.titulo} — previsto às ${ocorrencia.horario}`,
				referenciaId: taskId
			});
		} else {
			await services.alerts.resolverPorReferencia('medicacao_atrasada', taskId, paciente.id);
			await services.alerts.resolverPorReferencia('tarefa_pendente', taskId, paciente.id);
		}
	}

	// §4.4 — estoque baixo
	for (const tarefa of tarefas) {
		const estoque = avaliarEstoque(tarefa);
		if (estoque.baixo) {
			await services.alerts.criarSeNovo({
				patientId: paciente.id,
				tipo: 'estoque_baixo',
				severidade: 'atencao',
				titulo: 'Estoque baixo',
				detalhe: `${tarefa.titulo}: restam ${estoque.quantidadeAtual} ${estoque.unidade}${
					estoque.diasRestantes !== undefined ? ` — acaba em ~${estoque.diasRestantes} dia(s)` : ''
				}`,
				referenciaId: tarefa.id
			});
		} else {
			await services.alerts.resolverPorReferencia('estoque_baixo', tarefa.id, paciente.id);
		}
	}
}

async function avaliarAfericoesDoPaciente(
	paciente: Patient,
	tipos: MeasurementType[],
	agora: Date
): Promise<void> {
	// §4.3 — sem registro há tempo demais
	for (const tipo of tipos) {
		if (!tipo.alertaSemRegistroHoras) continue;
		const ultima = await services.measurements.ultimaLeituraDoTipo(paciente.id, tipo.id);
		const avaliacao = semRegistroHaMuito(tipo, ultima?.aferidoEm, agora);
		if (avaliacao.alerta) {
			await services.alerts.criarSeNovo({
				patientId: paciente.id,
				tipo: 'sem_registro',
				severidade: 'atencao',
				titulo: `${tipo.nome} sem registro`,
				detalhe: `Há ${Math.floor(avaliacao.horasDesde ?? 0)}h sem registro (limite: ${avaliacao.limiteHoras}h)`,
				referenciaId: tipo.id
			});
		} else {
			await services.alerts.resolverPorReferencia('sem_registro', tipo.id, paciente.id);
		}
	}

	// §4.2 — leituras fora do padrão viram alerta (dedup por leitura)
	const tiposPorId = new Map(tipos.map((t) => [t.id, t]));
	const foraDoPadrao = await services.measurements.leiturasForaDoPadrao(paciente.id);
	for (const leitura of foraDoPadrao) {
		const tipo = tiposPorId.get(leitura.measurementTypeId);
		const campo = tipo?.campos.find((c) => c.chave === leitura.campo);
		if (!tipo || !campo) continue;
		const anteriores = (
			await services.measurements.leituras(paciente.id, tipo.id, leitura.campo)
		).filter((r) => r.aferidoEm < leitura.aferidoEm);
		const historico = anteriores
			.map((r) => r.valorNum)
			.filter((v): v is number => v !== undefined)
			.slice(0, 10);
		const resultado = avaliarLeitura(campo, leitura, historico);
		const severidade = resultado.severidade ?? 'atencao';
		const detalhe =
			resultado.motivo === 'baseline' && resultado.media !== undefined
				? `${tipo.nome} ${formatarValor(leitura, tipo)} — média habitual ${Number(resultado.media.toFixed(1))} (${resultado.amostras} aferições)`
				: resultado.motivo === 'esperado'
					? `${tipo.nome}: registrado "${leitura.valorTexto ?? (leitura.valorNum === 1 ? 'sim' : 'não')}", diferente do esperado`
					: `${tipo.nome} ${formatarValor(leitura, tipo)} — fora da faixa normal`;
		await services.alerts.criarSeNovo({
			patientId: paciente.id,
			tipo: 'sinal_fora_padrao',
			severidade,
			titulo: `${tipo.nome} fora do padrão`,
			detalhe,
			referenciaId: leitura.id
		});
	}
}

/** Passada completa do motor. Devolve o total de alertas ativos após a passada. */
export async function reavaliarAlertas(): Promise<number> {
	const cuidador = await services.auth.sessaoAtual();
	if (!cuidador) return 0;
	const agora = new Date();
	const [pacientes, tipos] = await Promise.all([
		services.patients.listar(cuidador.id),
		services.measurements.listarTipos()
	]);
	for (const paciente of pacientes) {
		await avaliarTarefasDoPaciente(paciente, agora);
		await avaliarAfericoesDoPaciente(paciente, tipos, agora);
	}
	return (await services.alerts.listar()).length;
}
