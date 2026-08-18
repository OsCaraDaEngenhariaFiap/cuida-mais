// Fase 2: sessão persistida no mock (login entra, logout sai, cadastro loga).
import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { services } from '$lib/services';

beforeAll(async () => {
	await services.inicializar();
});

describe('sessão do auth mock', () => {
	it('sem login não há sessão', async () => {
		await services.auth.logout();
		expect(await services.auth.sessaoAtual()).toBeNull();
	});

	it('login cria sessão recuperável', async () => {
		await services.auth.login('joao@demo.com', '123456');
		const sessao = await services.auth.sessaoAtual();
		expect(sessao?.email).toBe('joao@demo.com');
	});

	it('logout encerra a sessão', async () => {
		await services.auth.login('joao@demo.com', '123456');
		await services.auth.logout();
		expect(await services.auth.sessaoAtual()).toBeNull();
	});

	it('cadastro entra direto e recusa e-mail duplicado', async () => {
		const nova = await services.auth.cadastrar({
			nome: 'Cuidadora Nova',
			email: 'nova@demo.com',
			senha: 'segredo'
		});
		expect((await services.auth.sessaoAtual())?.id).toBe(nova.id);
		await expect(
			services.auth.cadastrar({ nome: 'Outra', email: 'nova@demo.com', senha: 'x' })
		).rejects.toThrow('E-mail já cadastrado');
		await services.auth.logout();
	});
});
