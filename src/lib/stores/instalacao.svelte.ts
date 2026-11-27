// Prompt de instalação customizado via beforeinstallprompt (§7)
interface EventoInstalacao extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type StatusInstalacao = 'dismissed' | 'installed';

const CHAVE_STATUS = 'cuida-mais:pwa-install-status';

export const instalacao = $state({
	disponivel: false,
	instalado: false,
	conviteDispensado: false,
	instrucoesSafariIOS: false
});

let eventoDiferido: EventoInstalacao | null = null;

function persistirStatus(status: StatusInstalacao): void {
	try {
		localStorage.setItem(CHAVE_STATUS, status);
	} catch {
		// A instalação continua funcionando sem persistência disponível.
	}
}

function marcarInstalado(): void {
	persistirStatus('installed');
	instalacao.disponivel = false;
	instalacao.instrucoesSafariIOS = false;
	instalacao.conviteDispensado = false;
	instalacao.instalado = true;
	eventoDiferido = null;
}

function definirDispensado(limparPrompt = true): void {
	persistirStatus('dismissed');
	instalacao.instrucoesSafariIOS = false;
	instalacao.conviteDispensado = true;
	if (limparPrompt) {
		instalacao.disponivel = false;
		eventoDiferido = null;
	}
}

function eSafariIOS(): boolean {
	const ua = navigator.userAgent;
	const plataformaIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
	const ios = /iPhone|iPad|iPod/.test(ua) || plataformaIPad;
	return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Firefox|Edg/i.test(ua);
}

export function capturarPromptDeInstalacao(): void {
	const statusSalvo = (() => {
		try {
			const status = localStorage.getItem(CHAVE_STATUS);
			return status === 'dismissed' || status === 'installed' ? status : null;
		} catch {
			return null;
		}
	})();
	const modoStandalone = window.matchMedia('(display-mode: standalone)').matches;
	const iosStandalone = 'standalone' in navigator && navigator.standalone === true;

	if (statusSalvo === 'installed' || modoStandalone || iosStandalone) {
		marcarInstalado();
		return;
	}

	const conviteDispensado = statusSalvo === 'dismissed';
	instalacao.instalado = false;
	instalacao.conviteDispensado = conviteDispensado;
	instalacao.disponivel = false;
	instalacao.instrucoesSafariIOS = !conviteDispensado && eSafariIOS();

	window.addEventListener('beforeinstallprompt', (e) => {
		if (instalacao.instalado) return;
		e.preventDefault();
		eventoDiferido = e as EventoInstalacao;
		instalacao.disponivel = true;
	});
	window.addEventListener('appinstalled', marcarInstalado);
}

export function dispensarConvite(): void {
	definirDispensado(false);
}

export async function instalarApp(): Promise<void> {
	if (!eventoDiferido) return;
	const evento = eventoDiferido;
	await evento.prompt();
	const { outcome } = await evento.userChoice;
	if (outcome === 'accepted') marcarInstalado();
	else definirDispensado();
}
