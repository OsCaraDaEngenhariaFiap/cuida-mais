// Agendador de notificações locais (§7): timers enquanto o app está aberto ou
// em background; disparo via service worker registration quando disponível.
// Push remoto fica para a fase de backend.
import { gerarOcorrenciasDoDia } from '$lib/domain/schedule/ocorrencias';
import { disparosDeNotificacao } from '$lib/domain/schedule/notificacoes';
import { services } from '$lib/services';

let timers: ReturnType<typeof setTimeout>[] = [];
const disparados = new Set<string>();

export function permissaoNotificacao(): NotificationPermission | 'indisponivel' {
	return typeof Notification === 'undefined' ? 'indisponivel' : Notification.permission;
}

export async function pedirPermissaoNotificacao(): Promise<NotificationPermission | 'indisponivel'> {
	if (typeof Notification === 'undefined') return 'indisponivel';
	return Notification.requestPermission();
}

export async function mostrarNotificacao(titulo: string, corpo: string, tag: string): Promise<void> {
	if (permissaoNotificacao() !== 'granted') return;
	const opcoes: NotificationOptions = { body: corpo, tag, icon: '/icons/icon-192.png' };
	const registro = await navigator.serviceWorker?.getRegistration();
	if (registro) await registro.showNotification(titulo, opcoes);
	else new Notification(titulo, opcoes);
}

/**
 * (Re)agenda os disparos do dia. Idempotente: limpa timers anteriores e pula
 * tags já disparadas nesta sessão — pode ser chamada junto do motor (60s).
 */
export async function agendarNotificacoes(): Promise<number> {
	for (const timer of timers) clearTimeout(timer);
	timers = [];
	if (permissaoNotificacao() !== 'granted') return 0;
	const cuidador = await services.auth.sessaoAtual();
	if (!cuidador) return 0;

	const agora = new Date();
	const pacientes = await services.patients.listar(cuidador.id);
	const nomes = new Map(pacientes.map((p) => [p.id, p.nome]));
	const tarefas = (
		await Promise.all(pacientes.map((p) => services.tasks.listarPorPaciente(p.id)))
	).flat();
	const disparos = disparosDeNotificacao(
		gerarOcorrenciasDoDia(tarefas, agora),
		(id) => nomes.get(id) ?? 'Paciente',
		agora
	).filter((d) => !disparados.has(d.tag));

	for (const disparo of disparos) {
		const espera = disparo.quando.getTime() - agora.getTime();
		timers.push(
			setTimeout(() => {
				disparados.add(disparo.tag);
				void mostrarNotificacao(disparo.titulo, disparo.corpo, disparo.tag);
			}, espera)
		);
	}
	return disparos.length;
}
