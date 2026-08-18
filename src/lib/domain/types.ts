// Modelo de dados da spec (§3). TypeScript puro — nada de svelte nem $app aqui.

export type UUID = string;
export type ISODate = string; // ISO 8601

export interface Caregiver {
	id: UUID;
	nome: string;
	email: string;
	senhaHash: string; // mock: hash simples, não é segurança real
	fotoUrl?: string;
	criadoEm: ISODate;
}

export interface Patient {
	id: UUID;
	caregiverId: UUID; // 1 paciente = 1 cuidador
	nome: string;
	dataNascimento: ISODate; // idade é derivada, nunca armazenada
	fotoUrl?: string;
	localizacao?: string; // ex: "Quarto 102"
	responsavel?: { nome: string; parentesco?: string; telefone?: string };
	alergias?: string[];
	condicoes?: string[]; // ex: "Alzheimer", "Diabetes tipo 2"
	observacoes?: string;
	ativo: boolean;
	criadoEm: ISODate;
}

export type TipoCuidado = 'medicacao' | 'refeicao' | 'medicao' | 'higiene' | 'atividade' | 'outro';

// Rotina = o que DEVE acontecer (agendamento recorrente)
export interface CareTask {
	id: UUID;
	patientId: UUID;
	tipo: TipoCuidado;
	titulo: string; // "Losartana 50mg"
	descricao?: string;
	horarios: string[]; // ["08:00", "20:00"]
	diasSemana: number[]; // 0=dom … 6=sáb
	toleranciaMin: number; // default 30
	lembreteAntesMin: number; // default 15 (§7)
	measurementTypeIds?: UUID[]; // obrigatório quando tipo = 'medicao'
	medicacao?: MedicationDetails; // obrigatório quando tipo = 'medicacao'
	ativo: boolean;
}

export interface MedicationDetails {
	dose: string; // "50 mg", "10 gotas", "1 comprimido"
	via:
		| 'oral'
		| 'sublingual'
		| 'topica'
		| 'inalatoria'
		| 'ocular'
		| 'nasal'
		| 'retal'
		| 'subcutanea'
		| 'intramuscular'
		| 'sonda'
		| 'outra';
	inicioTratamento: ISODate;
	fimTratamento?: ISODate; // ausente = uso contínuo
	estoque?: {
		quantidadeAtual: number; // unidades restantes na caixa
		unidade: string; // "comprimidos", "mL", "gotas"
		consumoPorDose: number; // debitado a cada registro realizado
		alertarAbaixoDe: number; // default: 3 dias de consumo
	};
}

// Evento = o que ACONTECEU (linha do tempo)
export interface CareEvent {
	id: UUID;
	patientId: UUID;
	taskId?: UUID; // ausente = registro avulso
	tipo: TipoCuidado;
	titulo: string;
	observacao?: string;
	ocorridoEm: ISODate; // quando o cuidado aconteceu de fato
	registradoEm: ISODate; // quando foi digitado no app
	registradoPor: UUID; // caregiverId
	status: 'realizado' | 'atrasado' | 'pulado';
	motivoPulo?: string;
	fotoUrl?: string; // base64; obrigatória em tipo='medicacao'
	justificativaSemFoto?: string; // exigida se medicação registrada sem foto
	justificativaRetroativa?: string; // exigida se ocorridoEm < registradoEm − 30min
	editadoEm?: ISODate; // trilha de correção
	motivoEdicao?: string;
	sincronizado: boolean; // §7 — preparação para a fase de backend
}

// ---------------------------------------------------------------------------
// Catálogo aberto de aferições (§3.1)

export type SeveridadeAlerta = 'critico' | 'atencao';

export type FormatoCampo = 'numero' | 'escala' | 'booleano' | 'opcoes' | 'texto';

export interface MeasurementType {
	id: UUID;
	slug: string; // 'fc', 'pa', 'dor'
	nome: string; // "Frequência cardíaca"
	icone: string;
	campos: MeasurementField[]; // 1 campo = simples; 2+ = composto (ex: pressão arterial)
	alertaSemRegistroHoras?: number; // ex: 72 em "evacuação" (§4.3)
	sistema: boolean; // pré-cadastrado, não deletável (só desativável)
	ativo: boolean;
}

export interface MeasurementField {
	chave: string; // 'valor' | 'sistolica' | 'diastolica'
	rotulo: string;
	formato: FormatoCampo;
	unidade?: string; // bpm, mmHg, °C, %, mL, kg
	casasDecimais?: number;
	escala?: { min: number; max: number }; // 'escala' — ex: dor 0–10
	opcoes?: string[]; // 'opcoes' — ex: Bristol 1–7
	// §4.2a: a severidade de "fora da faixa" varia por métrica (fc → crítico,
	// temp → atenção). Sem ela no dado, o motor teria que conhecer métricas por
	// nome — o que a regra do projeto proíbe. Ausente = 'atencao'.
	faixaNormal?: { min?: number; max?: number; severidade?: SeveridadeAlerta };
	pisoDesvio?: number; // §4.2b
	valorEsperado?: string | boolean; // 'booleano'/'opcoes' (§4.2c)
}

// Uma aferição gera 1 CareEvent + N Reading (uma por campo).
// Cada campo é uma SÉRIE HISTÓRICA INDEPENDENTE — sistólica e diastólica
// têm baselines separadas.
export interface Reading {
	id: UUID;
	patientId: UUID;
	eventId: UUID;
	measurementTypeId: UUID;
	campo: string; // chave do MeasurementField
	valorNum?: number; // numero | escala | booleano (0/1)
	valorTexto?: string; // opcoes | texto
	aferidoEm: ISODate;
	foraDoPadrao: boolean; // calculado na gravação
	motivoDesvio?: 'faixa' | 'baseline' | 'esperado';
	sincronizado: boolean; // §7 — preparação para a fase de backend
}

// ---------------------------------------------------------------------------
// Alertas e compartilhamento (§3.2)

export type TipoAlerta =
	| 'medicacao_atrasada'
	| 'tarefa_pendente'
	| 'sinal_fora_padrao'
	| 'sem_registro'
	| 'estoque_baixo';

export interface Alert {
	id: UUID;
	patientId: UUID;
	tipo: TipoAlerta;
	severidade: SeveridadeAlerta;
	titulo: string;
	detalhe: string; // "FC 140 bpm — média habitual 88 bpm"
	referenciaId?: UUID; // taskId ou readingId
	criadoEm: ISODate;
	reconhecidoEm?: ISODate;
	reconhecidoPor?: UUID;
}

export interface ShareLink {
	token: string; // 24 chars, URL-safe
	patientId: UUID;
	criadoPor: UUID;
	criadoEm: ISODate;
	expiraEm: ISODate; // default: +7 dias
	escopo: 'dia_atual'; // única opção nesta fase
	revogado: boolean;
	ultimoAcessoEm?: ISODate;
}
