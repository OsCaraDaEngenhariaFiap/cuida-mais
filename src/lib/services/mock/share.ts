import { addDays, formatISO } from 'date-fns';
import type { ShareLink } from '$lib/domain/types';
import type { ShareService } from '../types';
import { db } from './db';
import { novoToken } from './ids';

export const shareMock: ShareService = {
	async gerar(patientId, criadoPor) {
		const agora = new Date();
		const link: ShareLink = {
			token: novoToken(),
			patientId,
			criadoPor,
			criadoEm: formatISO(agora),
			expiraEm: formatISO(addDays(agora, 7)),
			escopo: 'dia_atual',
			revogado: false
		};
		// um link ativo por paciente: gerar revoga os anteriores
		await db.transaction('rw', db.shareLinks, async () => {
			await db.shareLinks.where('patientId').equals(patientId).modify({ revogado: true });
			await db.shareLinks.add(link);
		});
		return link;
	},

	async ativo(patientId) {
		const links = await db.shareLinks.where('patientId').equals(patientId).toArray();
		const agora = formatISO(new Date());
		return links.find((l) => !l.revogado && l.expiraEm > agora);
	},

	async revogar(token) {
		await db.shareLinks.update(token, { revogado: true });
	},

	async resolverToken(token) {
		const link = await db.shareLinks.get(token);
		if (!link || link.revogado || link.expiraEm <= formatISO(new Date())) return null;
		const ultimoAcessoEm = formatISO(new Date());
		await db.shareLinks.update(token, { ultimoAcessoEm });
		return { ...link, ultimoAcessoEm };
	}
};
