import { avaliarOcorrencias } from '$lib/domain/alerts/tarefas';
import { proximasOcorrencias } from '$lib/domain/schedule/ocorrencias';
import { services } from '$lib/services';
import { reavaliarAlertas } from '$lib/services/alertas-engine';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { cuidador } = await parent();
	await reavaliarAlertas();
	const agora = new Date();
	const [pacientes, alertas] = await Promise.all([
		services.patients.listar(cuidador.id),
		services.alerts.listar()
	]);

	let pendencias = 0;
	let realizadosHoje = 0;
	const tarefas = [];
	for (const paciente of pacientes) {
		const [tarefasDoPaciente, eventos] = await Promise.all([
			services.tasks.listarPorPaciente(paciente.id),
			services.events.listarPorDia(paciente.id, agora)
		]);
		tarefas.push(...tarefasDoPaciente);
		realizadosHoje += eventos.filter((e) => e.status !== 'pulado').length;
		pendencias += avaliarOcorrencias(tarefasDoPaciente, eventos, agora).filter(
			(a) => a.situacao === 'pendente' || a.situacao === 'critica'
		).length;
	}

	const nomes = new Map(pacientes.map((p) => [p.id, p.nome]));
	const proximos = proximasOcorrencias(tarefas, agora).map((o) => ({
		...o,
		paciente: nomes.get(o.patientId) ?? '—'
	}));
	const criticos = alertas.filter((a) => a.severidade === 'critico');

	return {
		pacientes,
		proximos,
		pendencias,
		realizadosHoje,
		criticos,
		nomesPacientes: nomes,
		totalAlertas: alertas.length
	};
};
