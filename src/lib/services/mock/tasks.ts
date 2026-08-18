import type { CareTask } from '$lib/domain/types';
import type { TaskService } from '../types';
import { db } from './db';
import { novoId } from './ids';

export const tasksMock: TaskService = {
	async listarPorPaciente(patientId, incluirInativas = false) {
		const lista = await db.tasks.where('patientId').equals(patientId).toArray();
		return (incluirInativas ? lista : lista.filter((t) => t.ativo)).sort((a, b) =>
			a.titulo.localeCompare(b.titulo)
		);
	},

	obter: (id) => db.tasks.get(id),

	async criar(dados) {
		const tarefa: CareTask = { ...dados, id: novoId(), ativo: true };
		await db.tasks.add(tarefa);
		return tarefa;
	},

	async atualizar(id, mudancas) {
		await db.tasks.update(id, mudancas);
		const tarefa = await db.tasks.get(id);
		if (!tarefa) throw new Error('Rotina não encontrada');
		return tarefa;
	},

	async alternarAtivo(id, ativo) {
		await db.tasks.update(id, { ativo });
	},

	async reporEstoque(id, quantidade) {
		const tarefa = await db.tasks.get(id);
		if (!tarefa?.medicacao?.estoque) throw new Error('Rotina sem estoque configurado');
		tarefa.medicacao.estoque.quantidadeAtual = quantidade;
		await db.tasks.put(tarefa);
		return tarefa;
	}
};
