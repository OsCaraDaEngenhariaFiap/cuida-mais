import { formatISO } from 'date-fns';
import type { Caregiver } from '$lib/domain/types';
import type { AuthService } from '../types';
import { db } from './db';
import { hashSenha } from './hash';
import { novoId } from './ids';
import { gravarSessao, lerSessao, limparSessao } from './sessao';

export const authMock: AuthService = {
	async cadastrar({ nome, email, senha, fotoUrl }) {
		const normalizado = email.trim().toLowerCase();
		if (await db.caregivers.where('email').equals(normalizado).first()) {
			throw new Error('E-mail já cadastrado');
		}
		const caregiver: Caregiver = {
			id: novoId(),
			nome,
			email: normalizado,
			senhaHash: hashSenha(senha),
			fotoUrl,
			criadoEm: formatISO(new Date())
		};
		await db.caregivers.add(caregiver);
		gravarSessao(caregiver.id);
		return caregiver;
	},

	async login(email, senha) {
		const caregiver = await db.caregivers.where('email').equals(email.trim().toLowerCase()).first();
		if (!caregiver || caregiver.senhaHash !== hashSenha(senha)) return null;
		gravarSessao(caregiver.id);
		return caregiver;
	},

	async sessaoAtual() {
		const id = lerSessao();
		if (!id) return null;
		const caregiver = await db.caregivers.get(id);
		if (!caregiver) limparSessao(); // sessão órfã (ex.: após reset de demo)
		return caregiver ?? null;
	},

	async logout() {
		limparSessao();
	}
};
