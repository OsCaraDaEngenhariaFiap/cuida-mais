// Contrato da camada de serviço (§8). A UI só fala com estas interfaces;
// trocar o mock por API real deve mudar apenas src/lib/services/index.ts.
import type {
	Alert,
	CareEvent,
	CareTask,
	Caregiver,
	MeasurementType,
	Patient,
	Reading,
	ShareLink,
	TipoAlerta,
	UUID
} from '$lib/domain/types';

// Tipos de entrada: a entidade menos os campos que o serviço preenche.
export type NovoPatient = Omit<Patient, 'id' | 'criadoEm' | 'ativo'>;
export type NovaCareTask = Omit<CareTask, 'id' | 'ativo'>;
export type NovoCareEvent = Omit<CareEvent, 'id' | 'registradoEm' | 'sincronizado'>;
export type NovaReading = Omit<
	Reading,
	'id' | 'eventId' | 'patientId' | 'sincronizado' | 'foraDoPadrao' | 'motivoDesvio'
>;
export type NovoMeasurementType = Omit<MeasurementType, 'id' | 'sistema' | 'ativo'>;
export type NovoAlert = Omit<Alert, 'id' | 'criadoEm' | 'reconhecidoEm' | 'reconhecidoPor'>;

export interface AuthService {
	cadastrar(dados: {
		nome: string;
		email: string;
		senha: string;
		fotoUrl?: string;
	}): Promise<Caregiver>;
	/** null quando e-mail/senha não conferem. */
	login(email: string, senha: string): Promise<Caregiver | null>;
	/** Sessão persistida entra na Fase 2; até lá devolve null. */
	sessaoAtual(): Promise<Caregiver | null>;
	logout(): Promise<void>;
}

export interface PatientService {
	/** Pacientes ativos do cuidador, ordenados por nome. */
	listar(caregiverId: UUID): Promise<Patient[]>;
	obter(id: UUID): Promise<Patient | undefined>;
	criar(dados: NovoPatient): Promise<Patient>;
	atualizar(id: UUID, mudancas: Partial<NovoPatient>): Promise<Patient>;
	/** Nunca apaga: marca ativo = false. */
	arquivar(id: UUID): Promise<void>;
}

export interface TaskService {
	listarPorPaciente(patientId: UUID, incluirInativas?: boolean): Promise<CareTask[]>;
	obter(id: UUID): Promise<CareTask | undefined>;
	criar(dados: NovaCareTask): Promise<CareTask>;
	atualizar(id: UUID, mudancas: Partial<NovaCareTask>): Promise<CareTask>;
	alternarAtivo(id: UUID, ativo: boolean): Promise<void>;
	/** "Repor caixa" (§4.4): define a quantidade atual do estoque. */
	reporEstoque(id: UUID, quantidade: number): Promise<CareTask>;
}

export interface EventService {
	/** Eventos do dia (00:00–24:00 locais), ordenados por ocorridoEm. */
	listarPorDia(patientId: UUID, dia: Date): Promise<CareEvent[]>;
	obter(id: UUID): Promise<CareEvent | undefined>;
	/** Grava evento + leituras na mesma transação (uma aferição = 1 evento + N leituras). */
	criar(dados: NovoCareEvent, leituras?: NovaReading[]): Promise<CareEvent>;
	/** Corrigir exige motivo e grava editadoEm (§5.2). */
	editar(id: UUID, mudancas: Partial<NovoCareEvent>, motivoEdicao: string): Promise<CareEvent>;
	/** "Excluir" nunca apaga: marca status 'pulado' com motivo (§5.2). */
	marcarPulado(id: UUID, motivo: string): Promise<CareEvent>;
}

export interface MeasurementService {
	listarTipos(incluirInativos?: boolean): Promise<MeasurementType[]>;
	obterTipo(id: UUID): Promise<MeasurementType | undefined>;
	/** Tipo criado pelo cuidador — sempre sistema: false. */
	criarTipo(dados: NovoMeasurementType): Promise<MeasurementType>;
	atualizarTipo(id: UUID, mudancas: Partial<NovoMeasurementType>): Promise<MeasurementType>;
	alternarAtivo(id: UUID, ativo: boolean): Promise<void>;
	/** Série histórica de UM campo (mais recente primeiro) — baseline (§4.2b) e gráficos. */
	leituras(
		patientId: UUID,
		measurementTypeId: UUID,
		campo: string,
		limite?: number
	): Promise<Reading[]>;
	/** Leitura mais recente de qualquer campo do tipo — §4.3 (sem registro há X horas). */
	ultimaLeituraDoTipo(patientId: UUID, measurementTypeId: UUID): Promise<Reading | undefined>;
	/** Leituras marcadas fora do padrão — o motor gera os alertas a partir delas. */
	leiturasForaDoPadrao(patientId: UUID): Promise<Reading[]>;
	/** Pares tipo+campo já registrados do paciente — a aba Aferições nasce disso (§5). */
	camposRegistrados(patientId: UUID): Promise<{ measurementTypeId: UUID; campo: string }[]>;
}

export interface AlertService {
	listar(filtro?: { patientId?: UUID; somenteNaoReconhecidos?: boolean }): Promise<Alert[]>;
	/** Deduplicação (§4.5): mesmo tipo + referenciaId (+ paciente) não reconhecido → não cria, devolve null. */
	criarSeNovo(dados: NovoAlert): Promise<Alert | null>;
	reconhecer(id: UUID, caregiverId: UUID): Promise<void>;
	/** Remove alertas não reconhecidos da referência (ex.: tarefa registrada resolve o alerta, §4.1). */
	resolverPorReferencia(tipo: TipoAlerta, referenciaId: UUID, patientId?: UUID): Promise<void>;
}

export interface ShareService {
	/** Gera link novo (+7 dias) e revoga o anterior do paciente — um link ativo por vez. */
	gerar(patientId: UUID, criadoPor: UUID): Promise<ShareLink>;
	ativo(patientId: UUID): Promise<ShareLink | undefined>;
	revogar(token: string): Promise<void>;
	/** Valida token (existe, não revogado, não expirado) e registra o acesso; null → página neutra (§6). */
	resolverToken(token: string): Promise<ShareLink | null>;
}

export interface DemoService {
	/** Apaga o banco inteiro e roda o seed de novo (botão de Configurações). */
	resetar(): Promise<void>;
}

export interface Services {
	/** Abre o storage; no primeiro boot dispara o seed. Chamado no layout raiz. */
	inicializar(): Promise<void>;
	auth: AuthService;
	patients: PatientService;
	tasks: TaskService;
	events: EventService;
	measurements: MeasurementService;
	alerts: AlertService;
	share: ShareService;
	demo: DemoService;
}
