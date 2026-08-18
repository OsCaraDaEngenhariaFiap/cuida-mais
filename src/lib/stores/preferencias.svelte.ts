// Preferências do dispositivo (não são dados de domínio — não sincronizam):
// flag da foto obrigatória (§5.1), tolerância e lembrete padrão (§5 Configurações).
const CHAVE = 'cuida-mais:preferencias';

export const preferencias = $state({
	fotoObrigatoriaMedicacao: true,
	toleranciaPadraoMin: 30,
	lembretePadraoMin: 15
});

export function carregarPreferencias(): void {
	if (typeof localStorage === 'undefined') return;
	const bruto = localStorage.getItem(CHAVE);
	if (!bruto) return;
	try {
		Object.assign(preferencias, JSON.parse(bruto));
	} catch {
		localStorage.removeItem(CHAVE);
	}
}

export function salvarPreferencias(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(CHAVE, JSON.stringify($state.snapshot(preferencias)));
}
