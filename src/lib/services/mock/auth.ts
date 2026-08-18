import { formatISO } from 'date-fns';
import type { Caregiver } from '$lib/domain/types';
import type { AuthService } from '../types';
import { db } from './db';
import { hashSenha } from './hash';
import { novoId } from './ids';

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
		return caregiver;
	},

	async login(email, senha) {
		const caregiver = await db.caregivers.where('email').equals(email.trim().toLowerCase()).first();
		return caregiver && caregiver.senhaHash === hashSenha(senha) ? caregiver : null;
	},

	// Persistência de sessão entra na Fase 2 (auth mock completo)
	async sessaoAtual() {
		return null;
	},

	async logout() {}
};
