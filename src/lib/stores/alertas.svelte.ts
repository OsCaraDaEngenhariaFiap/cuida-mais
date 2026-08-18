// Contagem global de alertas não reconhecidos — badge da tab bar e dos cards.
import { services } from '$lib/services';

export const contagemAlertas = $state({ total: 0, criticos: 0 });

export async function atualizarContagemAlertas(): Promise<void> {
	const lista = await services.alerts.listar();
	contagemAlertas.total = lista.length;
	contagemAlertas.criticos = lista.filter((a) => a.severidade === 'critico').length;
}
