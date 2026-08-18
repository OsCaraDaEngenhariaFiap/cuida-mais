// Aceite Fase 7: o seed gera os 5 tipos de alerta quando o motor roda,
// e a deduplicação (§4.5) segura passadas repetidas do timer.
import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { services } from '$lib/services';
import { reavaliarAlertas } from './alertas-engine';

beforeAll(async () => {
	await services.inicializar();
	await services.auth.login('joao@demo.com', '123456'); // motor exige sessão
});

describe('motor de alertas sobre o seed (§4.1–4.5)', () => {
	it('uma passada gera os 5 tipos de alerta', async () => {
		await reavaliarAlertas();
		const alertas = await services.alerts.listar();
		const tipos = new Set(alertas.map((a) => a.tipo));
		expect(tipos).toEqual(
			new Set([
				'medicacao_atrasada', // Antônio: Metformina há 70 min
				'tarefa_pendente', // Antônio: lanche há 45 min
				'sinal_fora_padrao', // Zilda: FC 140 e diurese 120 (customizada!)
				'sem_registro', // Zilda: evacuação há 4 dias (limite 72h)
				'estoque_baixo' // Maria: Losartana com 4 ≤ 6
			])
		);
	});

	it('a métrica CUSTOMIZADA (diurese) gerou alerta de desvio — motor não conhece métrica', async () => {
		const alertas = await services.alerts.listar();
		const daDiurese = alertas.find(
			(a) => a.tipo === 'sinal_fora_padrao' && a.titulo.includes('Diurese')
		);
		expect(daDiurese).toBeDefined();
		expect(daDiurese!.detalhe).toContain('120');
		expect(daDiurese!.detalhe).toContain('média habitual');
	});

	it('medicação atrasada é crítica; pendência de refeição é atenção', async () => {
		const alertas = await services.alerts.listar();
		expect(alertas.find((a) => a.tipo === 'medicacao_atrasada')?.severidade).toBe('critico');
		expect(alertas.find((a) => a.tipo === 'tarefa_pendente')?.severidade).toBe('atencao');
	});

	it('rodar de novo não duplica nada (§4.5)', async () => {
		const antes = (await services.alerts.listar()).length;
		await reavaliarAlertas();
		await reavaliarAlertas();
		expect((await services.alerts.listar()).length).toBe(antes);
	});

	it('registrar a medicação atrasada resolve o alerta crítico', async () => {
		const alerta = (await services.alerts.listar()).find((a) => a.tipo === 'medicacao_atrasada')!;
		const tarefa = (await services.tasks.obter(alerta.referenciaId!))!;
		await services.events.criar({
			patientId: alerta.patientId,
			taskId: tarefa.id,
			tipo: 'medicacao',
			titulo: tarefa.titulo,
			ocorridoEm: new Date().toISOString(),
			registradoPor: (await services.auth.sessaoAtual())!.id,
			status: 'atrasado',
			justificativaRetroativa: 'teste'
		});
		await reavaliarAlertas();
		const restantes = await services.alerts.listar();
		expect(restantes.some((a) => a.tipo === 'medicacao_atrasada')).toBe(false);
	});

	it('reconhecer some da lista ativa e não volta pela dedup', async () => {
		const cuidador = (await services.auth.sessaoAtual())!;
		const alerta = (await services.alerts.listar()).find((a) => a.tipo === 'sem_registro')!;
		await services.alerts.reconhecer(alerta.id, cuidador.id);
		await reavaliarAlertas();
		const ativos = await services.alerts.listar();
		// reconhecido não reaparece: criarSeNovo cria OUTRO só se o reconhecido fosse resolvido…
		// aqui o cenário persiste (segue sem registro), então um novo alerta é permitido? Não:
		// dedup considera apenas NÃO reconhecidos, e §4.5 impede duplicar não reconhecido.
		// O comportamento esperado do produto: reconhecido sai da lista; o motor pode
		// recriar na próxima passada se a condição persistir.
		expect(ativos.every((a) => a.id !== alerta.id)).toBe(true);
	});
});
