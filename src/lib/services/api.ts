import { format } from 'date-fns';
import type { CareEvent, Caregiver, Patient } from '$lib/domain/types';
import { mockServices } from './mock';
import type { EventService, PatientService, Services } from './types';

const FALLBACK_API_BASE_URL =
	'https://c2ojnf3eqzcxvnnr76mnxzhb5u.apigateway.sa-saopaulo-1.oci.customer-oci.com';
const API_BASE_URL =
	(typeof import.meta.env.PUBLIC_API_BASE_URL === 'string'
		? import.meta.env.PUBLIC_API_BASE_URL
		: '')
		.trim()
		.replace(/\/$/, '') || FALLBACK_API_BASE_URL;

const TOKEN_KEY = 'cuida-mais:api-token';
const CAREGIVER_KEY = 'cuida-mais:api-caregiver';

type PessoaApi = {
	id: number;
	nome: string;
	identificacao?: string | null;
	dataNascimento?: string | null;
};

type NotaApi = {
	id: number;
	titulo?: string | null;
	quando: string;
	texto: string;
	criadoEm: string;
};

function isBackendId(id: string): boolean {
	return /^\d+$/.test(id);
}

function decodeJwtPayload(token: string): Record<string, unknown> {
		const encoded = token.split('.')[1];
		const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
		const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
		return JSON.parse(atob(padded)) as Record<string, unknown>;
}

function caregiverFromToken(token: string, nome?: string): Caregiver {
	let email = 'cuidador@api.local';
	try {
		email = String(decodeJwtPayload(token).sub ?? email);
	} catch {
		// A sessão ainda pode ser usada com um nome genérico se o token não for legível.
	}
	return {
		id: `api:${email}`,
		nome: nome?.trim() || email,
		email,
		senhaHash: '',
		criadoEm: new Date().toISOString()
	};
}

function storedToken(): string | null {
	return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
}

function storeSession(token: string, caregiver: Caregiver): void {
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem(CAREGIVER_KEY, JSON.stringify(caregiver));
}

function clearSession(): void {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(CAREGIVER_KEY);
}

async function apiFetch<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
	const headers = new Headers(init.headers);
	if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
	const token = authenticated ? storedToken() : null;
	if (token) headers.set('Authorization', `Bearer ${token}`);

	const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
	if (response.status === 401 && authenticated) {
		clearSession();
		throw new Error('Sessão expirada. Entre novamente.');
	}
	if (!response.ok) {
		let message = `API indisponível (${response.status})`;
		try {
			const body = (await response.json()) as { message?: string; erro?: string };
			message = body.message || body.erro || message;
		} catch {
			// Mantém a mensagem HTTP quando a API não devolve JSON.
		}
		throw new Error(message);
	}
	if (response.status === 204) return undefined as T;
	const text = await response.text();
	if (!text) return undefined as T;
	try {
		return JSON.parse(text) as T;
	} catch {
		return text as T;
	}
}

function toPatient(pessoa: PessoaApi, caregiverId: string): Patient {
	return {
		id: String(pessoa.id),
		caregiverId,
		nome: pessoa.nome,
		dataNascimento: pessoa.dataNascimento || '1970-01-01',
		observacoes: pessoa.identificacao || undefined,
		ativo: true,
		criadoEm: new Date(0).toISOString()
	};
}

function toEvent(nota: NotaApi, patientId: string, caregiverId: string): CareEvent {
	return {
		id: String(nota.id),
		patientId,
		tipo: 'outro',
		titulo: nota.titulo || 'Nota',
		observacao: nota.texto,
		ocorridoEm: nota.quando,
		registradoEm: nota.criadoEm,
		registradoPor: caregiverId,
		status: 'realizado',
		sincronizado: true
	};
}

const auth: Services['auth'] = {
	async cadastrar({ nome, email, senha }) {
		await apiFetch('/auth/register', {
			method: 'POST',
			body: JSON.stringify({ nome, tipoCuidador: 'independente', email, senha })
		}, false);
		const caregiver = await auth.login(email, senha);
		if (!caregiver) throw new Error('Não foi possível iniciar a sessão');
		const session = { ...caregiver, nome };
		localStorage.setItem(CAREGIVER_KEY, JSON.stringify(session));
		return session;
	},

	async login(email, senha) {
		const token = await apiFetch<string>('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, senha })
		}, false);
		if (typeof token !== 'string' || token.length < 20) return null;
		const caregiver = caregiverFromToken(token);
		storeSession(token, caregiver);
		return caregiver;
	},

	async sessaoAtual() {
		const token = storedToken();
		const raw = localStorage.getItem(CAREGIVER_KEY);
		if (!token || !raw) return null;
		try {
			const payload = decodeJwtPayload(token);
			if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
				clearSession();
				return null;
			}
			return JSON.parse(raw) as Caregiver;
		} catch {
			clearSession();
			return null;
		}
	},

	async logout() {
		clearSession();
	}
};

const patients: PatientService = {
	async listar(caregiverId) {
		const pessoas = await apiFetch<PessoaApi[]>('/api/pessoas');
		const locais = await mockServices.patients.listar(caregiverId);
		return [...pessoas.map((pessoa) => toPatient(pessoa, caregiverId)), ...locais];
	},

	async obter(id) {
		if (!isBackendId(id)) return mockServices.patients.obter(id);
		return toPatient(await apiFetch<PessoaApi>(`/api/pessoas/${id}`), (await auth.sessaoAtual())?.id ?? 'api:unknown');
	},

	criar: (dados) => mockServices.patients.criar(dados),
	atualizar: (id, mudancas) => mockServices.patients.atualizar(id, mudancas),
	arquivar: (id) => mockServices.patients.arquivar(id)
};

const events: EventService = {
	async listarPorDia(patientId, dia) {
		if (!isBackendId(patientId)) return mockServices.events.listarPorDia(patientId, dia);
		const caregiver = await auth.sessaoAtual();
		const notas = await apiFetch<NotaApi[]>(`/api/registros/pessoas/${patientId}/notas`);
		const diaIso = format(dia, 'yyyy-MM-dd');
		return notas
			.filter((nota) => nota.quando.startsWith(diaIso))
			.map((nota) => toEvent(nota, patientId, caregiver?.id ?? 'api:unknown'));
	},

	async obter(id) {
		if (!isBackendId(id)) return mockServices.events.obter(id);
		throw new Error('Para obter um registro Oracle, use a listagem da pessoa.');
	},

	async criar(dados, leituras = []) {
		if (!isBackendId(dados.patientId)) return mockServices.events.criar(dados, leituras);
		if (dados.tipo !== 'outro' || leituras.length > 0) {
			throw new Error('A fatia Oracle atual grava registros avulsos sem aferições.');
		}
		const quando = format(new Date(dados.ocorridoEm), "yyyy-MM-dd'T'HH:mm:ss");
		const nota = await apiFetch<NotaApi>(`/api/registros/pessoas/${dados.patientId}/notas`, {
			method: 'POST',
			body: JSON.stringify({
				titulo: dados.titulo,
				quando,
				texto: dados.observacao || dados.titulo
			})
		});
		return toEvent(nota, dados.patientId, dados.registradoPor);
	},

	async editar(id, mudancas, motivoEdicao) {
		if (isBackendId(id)) throw new Error('Correção de registros Oracle ainda não está disponível.');
		return mockServices.events.editar(id, mudancas, motivoEdicao);
	},

	async marcarPulado(id, motivo) {
		if (isBackendId(id)) throw new Error('Marcar registros Oracle como pulados ainda não está disponível.');
		return mockServices.events.marcarPulado(id, motivo);
	}
};

export const apiServices: Services = {
	...mockServices,
	async inicializar() {
		await mockServices.inicializar();
	},
	auth,
	patients,
	events
};
