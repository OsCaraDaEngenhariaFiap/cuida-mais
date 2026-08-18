// Prompt de instalação customizado via beforeinstallprompt (§7)
interface EventoInstalacao extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const instalacao = $state({ disponivel: false, instalado: false });

let eventoDiferido: EventoInstalacao | null = null;

export function capturarPromptDeInstalacao(): void {
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		eventoDiferido = e as EventoInstalacao;
		instalacao.disponivel = true;
	});
	window.addEventListener('appinstalled', () => {
		instalacao.disponivel = false;
		instalacao.instalado = true;
	});
}

export async function instalarApp(): Promise<void> {
	if (!eventoDiferido) return;
	await eventoDiferido.prompt();
	const { outcome } = await eventoDiferido.userChoice;
	if (outcome === 'accepted') instalacao.disponivel = false;
	eventoDiferido = null;
}
