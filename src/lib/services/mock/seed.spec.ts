// Critério de aceite da Fase 1: seed carrega no primeiro boot; reset funciona.
import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Caregiver } from '$lib/domain/types';
import { services } from '$lib/services';
import { db } from './db';

let joao: Caregiver;

beforeAll(async () => {
	await services.inicializar(); // primeiro boot → populate roda o seed
	const logado = await services.auth.login('joao@demo.com', '123456');
	if (!logado) throw new Error('seed não criou o cuidador demo');
	joao = logado;
});

describe('seed no primeiro boot', () => {
	it('login demo funciona e senha errada é recusada', async () => {
		expect(joao.nome).toBe('João');
		expect(await services.auth.login('joao@demo.com', 'errada')).toBeNull();
		expect(await services.auth.login('nao@existe.com', '123456')).toBeNull();
	});

	it('cria os 3 pacientes do cuidador demo', async () => {
		const pacientes = await services.patients.listar(joao.id);
		expect(pacientes.map((p) => p.nome)).toEqual([
			'Antônio Ferreira',
			'Maria Silva',
			'Zilda Nascimento'
		]);
	});

	it('catálogo tem 10 tipos de sistema e diurese como customizada', async () => {
		const tipos = await services.measurements.listarTipos();
		expect(tipos).toHaveLength(11);
		expect(tipos.filter((t) => t.sistema)).toHaveLength(10);
		const diurese = tipos.find((t) => t.slug === 'diurese');
		expect(diurese?.sistema).toBe(false);
		// severidade de faixa é DADO, não código: fc crítico, temp atenção (§4.2a)
		const fc = tipos.find((t) => t.slug === 'fc');
		expect(fc?.campos[0].faixaNormal?.severidade).toBe('critico');
		const temp = tipos.find((t) => t.slug === 'temp');
		expect(temp?.campos[0].faixaNormal?.severidade).toBe('atencao');
	});

	it('timeline da Maria tem os 6 eventos do dia, em ordem', async () => {
		const [maria] = (await services.patients.listar(joao.id)).filter(
			(p) => p.nome === 'Maria Silva'
		);
		const eventos = await services.events.listarPorDia(maria.id, new Date());
		expect(eventos.map((e) => e.titulo)).toEqual([
			'Café da manhã',
			'Losartana 50mg',
			'Sinais vitais',
			'Episódio de tontura',
			'Médico informado',
			'Almoço'
		]);
	});

	it('série de FC da Zilda: 4 na baseline e a de hoje (140) fora do padrão', async () => {
		const [zilda] = (await services.patients.listar(joao.id)).filter(
			(p) => p.nome === 'Zilda Nascimento'
		);
		const fc = (await services.measurements.listarTipos()).find((t) => t.slug === 'fc')!;
		const leituras = await services.measurements.leituras(zilda.id, fc.id, 'valor');
		expect(leituras).toHaveLength(5);
		expect(leituras[0].valorNum).toBe(140); // mais recente primeiro
		expect(leituras[0].foraDoPadrao).toBe(true);
		expect(leituras.slice(1).every((l) => !l.foraDoPadrao)).toBe(true);
	});

	it('diurese customizada: 5 leituras normais + 1 discrepante', async () => {
		const [zilda] = (await services.patients.listar(joao.id)).filter(
			(p) => p.nome === 'Zilda Nascimento'
		);
		const diurese = (await services.measurements.listarTipos()).find(
			(t) => t.slug === 'diurese'
		)!;
		const leituras = await services.measurements.leituras(zilda.id, diurese.id, 'volume');
		expect(leituras).toHaveLength(6);
		expect(leituras[0].valorNum).toBe(120);
		expect(leituras[0].foraDoPadrao).toBe(true);
	});

	it('link do responsável da Maria resolve; revogado vira null', async () => {
		const [maria] = (await services.patients.listar(joao.id)).filter(
			(p) => p.nome === 'Maria Silva'
		);
		const link = await services.share.ativo(maria.id);
		expect(link).toBeDefined();
		expect(link!.token).toHaveLength(24);
		const resolvido = await services.share.resolverToken(link!.token);
		expect(resolvido?.patientId).toBe(maria.id);
		await services.share.revogar(link!.token);
		expect(await services.share.resolverToken(link!.token)).toBeNull();
	});

	it('alertas nascem vazios — são derivados pelo motor na Fase 7', async () => {
		expect(await db.alerts.count()).toBe(0);
	});
});

describe('reset de demonstração', () => {
	it('apaga mudanças do usuário e re-seeda do zero', async () => {
		await services.patients.criar({
			caregiverId: joao.id,
			nome: 'Paciente Extra',
			dataNascimento: '1950-01-01'
		});
		expect(await services.patients.listar(joao.id)).toHaveLength(4);

		await services.demo.resetar();

		const depois = await services.auth.login('joao@demo.com', '123456');
		expect(depois).not.toBeNull();
		const pacientes = await services.patients.listar(depois!.id);
		expect(pacientes).toHaveLength(3);
		expect(pacientes.some((p) => p.nome === 'Paciente Extra')).toBe(false);
		expect(await db.measurementTypes.count()).toBe(11);
	});
});
