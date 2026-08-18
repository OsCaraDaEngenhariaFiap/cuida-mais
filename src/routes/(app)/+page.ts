import { proximasOcorrencias } from '$lib/domain/schedule/ocorrencias';
import { services } from '$lib/services';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { cuidador } = await parent();
	const pacientes = await services.patients.listar(cuidador.id);
	const tarefas = (
		await Promise.all(pacientes.map((p) => services.tasks.listarPorPaciente(p.id)))
	).flat();
	const nomes = new Map(pacientes.map((p) => [p.id, p.nome]));
	const proximos = proximasOcorrencias(tarefas, new Date()).map((o) => ({
		...o,
		paciente: nomes.get(o.patientId) ?? '—'
	}));
	return { pacientes, proximos };
};
