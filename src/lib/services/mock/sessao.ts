// Sessão persistida do mock (Fase 2). localStorage no browser; fallback em
// memória para os testes em Node (fake-indexeddb não traz localStorage).
const CHAVE = 'cuida-mais:sessao';
const memoria = new Map<string, string>();

function storage(): Storage | null {
	return typeof localStorage === 'undefined' ? null : localStorage;
}

export function gravarSessao(caregiverId: string): void {
	const s = storage();
	if (s) s.setItem(CHAVE, caregiverId);
	else memoria.set(CHAVE, caregiverId);
}

export function lerSessao(): string | null {
	const s = storage();
	return s ? s.getItem(CHAVE) : (memoria.get(CHAVE) ?? null);
}

export function limparSessao(): void {
	const s = storage();
	if (s) s.removeItem(CHAVE);
	else memoria.delete(CHAVE);
}
