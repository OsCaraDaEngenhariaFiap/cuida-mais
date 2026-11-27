import { format } from 'date-fns';
import { selecionarUltimoCuidado } from '$lib/domain/ultimo-cuidado';
import { avaliarOcorrencias } from '$lib/domain/alerts/tarefas';
import { proximasOcorrencias } from '$lib/domain/schedule/ocorrencias';
import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { cuidador } = await parent();
	const agora = new Date();
	const [pacientes, alertas] = await Promise.all([
		services.patients.listar(cuidador.id),
		services.alerts.listar()
	]);
	const dadosPacientes = await Promise.all(
		pacientes.map(async (paciente) => {
			const [tarefas, eventos] = await Promise.all([
				services.tasks.listarPorPaciente(paciente.id),
				services.events.listarHistorico(paciente.id)
			]);
			return { tarefas, eventos };
		})
	);

	const hoje = format(agora, 'yyyy-MM-dd');
	let pendencias = 0;
	let realizadosHoje = 0;
	const tarefas = dadosPacientes.flatMap(({ tarefas }) => tarefas);
	for (const { tarefas: tarefasDoPaciente, eventos } of dadosPacientes) {
		const eventosHoje = eventos.filter((evento) => evento.ocorridoEm.startsWith(hoje));
		realizadosHoje += eventosHoje.filter((evento) => evento.status !== 'pulado').length;
		pendencias += avaliarOcorrencias(tarefasDoPaciente, eventosHoje, agora).filter(
			(a) => a.situacao === 'pendente' || a.situacao === 'critica'
		).length;
	}

	const ultimoCuidado = selecionarUltimoCuidado(dadosPacientes.flatMap(({ eventos }) => eventos));

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
		totalAlertas: alertas.length,
		ultimoPacienteId: ultimoCuidado?.patientId
	};
};
