// Seed de demonstração (§8): bate com o mockup e prepara dados que exercitam os
// 5 tipos de alerta assim que o motor (Fase 7) existir. Horários são relativos a
// "agora" para os cenários de atraso valerem em qualquer boot.
import { addDays, format, formatISO, set, subDays, subMinutes } from 'date-fns';
import type {
	CareEvent,
	Caregiver,
	CareTask,
	MeasurementType,
	Patient,
	Reading,
	ShareLink
} from '$lib/domain/types';
import type { CuidaMaisDB } from './db';
import { hashSenha } from './hash';
import { novoId, novoToken } from './ids';

const iso = (d: Date) => formatISO(d);
const noDia = (dia: Date, hhmm: string) => {
	const [h, m] = hhmm.split(':').map(Number);
	return iso(set(dia, { hours: h, minutes: m, seconds: 0, milliseconds: 0 }));
};

export async function seedDemo(db: CuidaMaisDB): Promise<void> {
	const agora = new Date();

	// --- Catálogo padrão (10 tipos, sistema: true). Faixas e severidades da §4.2a.
	// Diurese fica de fora de propósito: entra abaixo como aferição CUSTOMIZADA,
	// provando que o motor não depende de métrica conhecida (§8).
	const tipo = (t: Omit<MeasurementType, 'id' | 'ativo'>): MeasurementType => ({
		...t,
		id: novoId(),
		ativo: true
	});
	const fc = tipo({
		slug: 'fc',
		nome: 'Frequência cardíaca',
		icone: '❤️',
		sistema: true,
		campos: [
			{
				chave: 'valor',
				rotulo: 'Frequência',
				formato: 'numero',
				unidade: 'bpm',
				casasDecimais: 0,
				faixaNormal: { min: 50, max: 110, severidade: 'critico' }
			}
		]
	});
	const pa = tipo({
		slug: 'pa',
		nome: 'Pressão arterial',
		icone: '🩺',
		sistema: true,
		campos: [
			{
				chave: 'sistolica',
				rotulo: 'Sistólica',
				formato: 'numero',
				unidade: 'mmHg',
				casasDecimais: 0,
				faixaNormal: { min: 90, max: 160, severidade: 'critico' }
			},
			{
				chave: 'diastolica',
				rotulo: 'Diastólica',
				formato: 'numero',
				unidade: 'mmHg',
				casasDecimais: 0,
				faixaNormal: { min: 50, max: 100, severidade: 'critico' }
			}
		]
	});
	const temp = tipo({
		slug: 'temp',
		nome: 'Temperatura',
		icone: '🌡️',
		sistema: true,
		campos: [
			{
				chave: 'valor',
				rotulo: 'Temperatura',
				formato: 'numero',
				unidade: '°C',
				casasDecimais: 1,
				faixaNormal: { min: 35.5, max: 37.7, severidade: 'atencao' }
			}
		]
	});
	const spo2 = tipo({
		slug: 'spo2',
		nome: 'Saturação de oxigênio',
		icone: '🫁',
		sistema: true,
		campos: [
			{
				chave: 'valor',
				rotulo: 'Saturação',
				formato: 'numero',
				unidade: '%',
				casasDecimais: 0,
				faixaNormal: { min: 92, severidade: 'critico' }
			}
		]
	});
	const glicemia = tipo({
		slug: 'glicemia',
		nome: 'Glicemia',
		icone: '🩸',
		sistema: true,
		campos: [
			{
				chave: 'valor',
				rotulo: 'Glicemia',
				formato: 'numero',
				unidade: 'mg/dL',
				casasDecimais: 0,
				faixaNormal: { min: 70, max: 200, severidade: 'atencao' }
			}
		]
	});
	const peso = tipo({
		slug: 'peso',
		nome: 'Peso',
		icone: '⚖️',
		sistema: true,
		campos: [
			{ chave: 'valor', rotulo: 'Peso', formato: 'numero', unidade: 'kg', casasDecimais: 1 }
		]
	});
	const dor = tipo({
		slug: 'dor',
		nome: 'Nível de dor',
		icone: '😖',
		sistema: true,
		campos: [
			{
				chave: 'valor',
				rotulo: 'Dor (0–10)',
				formato: 'escala',
				escala: { min: 0, max: 10 },
				faixaNormal: { max: 3, severidade: 'atencao' }
			}
		]
	});
	const evacuacao = tipo({
		slug: 'evacuacao',
		nome: 'Evacuação',
		icone: '🚽',
		sistema: true,
		alertaSemRegistroHoras: 72,
		campos: [
			{ chave: 'ocorreu', rotulo: 'Ocorreu', formato: 'booleano', valorEsperado: true },
			{
				chave: 'consistencia',
				rotulo: 'Consistência (Bristol)',
				formato: 'opcoes',
				opcoes: ['Tipo 1', 'Tipo 2', 'Tipo 3', 'Tipo 4', 'Tipo 5', 'Tipo 6', 'Tipo 7']
			}
		]
	});
	const hidratacao = tipo({
		slug: 'hidratacao',
		nome: 'Ingestão hídrica',
		icone: '💧',
		sistema: true,
		campos: [
			{ chave: 'volume', rotulo: 'Volume', formato: 'numero', unidade: 'mL', casasDecimais: 0 }
		]
	});
	const humor = tipo({
		slug: 'humor',
		nome: 'Humor / disposição',
		icone: '🙂',
		sistema: true,
		campos: [
			{
				chave: 'valor',
				rotulo: 'Humor',
				formato: 'opcoes',
				opcoes: ['Ótimo', 'Bom', 'Neutro', 'Agitado', 'Abatido']
			}
		]
	});

	// Aferição criada "pelo cuidador" — fora do catálogo padrão (§8)
	const diurese = tipo({
		slug: 'diurese',
		nome: 'Diurese',
		icone: '🫗',
		sistema: false,
		campos: [
			{ chave: 'volume', rotulo: 'Volume', formato: 'numero', unidade: 'mL', casasDecimais: 0 }
		]
	});

	// --- Cuidador demo
	const joao: Caregiver = {
		id: novoId(),
		nome: 'João',
		email: 'joao@demo.com',
		senhaHash: hashSenha('123456'),
		criadoEm: iso(subDays(agora, 90))
	};

	// --- Pacientes
	const maria: Patient = {
		id: novoId(),
		caregiverId: joao.id,
		nome: 'Maria Silva',
		dataNascimento: '1948-05-10', // 78 anos — idade sempre derivada
		localizacao: 'Quarto 102',
		responsavel: { nome: 'Ana Silva', parentesco: 'filha', telefone: '(11) 98765-4321' },
		alergias: ['Penicilina'],
		condicoes: ['Alzheimer leve', 'Hipertensão'],
		ativo: true,
		criadoEm: iso(subDays(agora, 90))
	};
	const antonio: Patient = {
		id: novoId(),
		caregiverId: joao.id,
		nome: 'Antônio Ferreira',
		dataNascimento: '1944-02-20',
		localizacao: 'Apto 31 — Bela Vista',
		responsavel: { nome: 'Marcos Ferreira', parentesco: 'filho' },
		alergias: ['Dipirona'],
		condicoes: ['Diabetes tipo 2'],
		ativo: true,
		criadoEm: iso(subDays(agora, 60))
	};
	const zilda: Patient = {
		id: novoId(),
		caregiverId: joao.id,
		nome: 'Zilda Nascimento',
		dataNascimento: '1951-01-15',
		localizacao: 'Quarto 205',
		responsavel: { nome: 'Paula Nascimento', parentesco: 'filha' },
		condicoes: ['Hipertensão'],
		ativo: true,
		criadoEm: iso(subDays(agora, 45))
	};

	// --- Rotinas
	const losartana: CareTask = {
		id: novoId(),
		patientId: maria.id,
		tipo: 'medicacao',
		titulo: 'Losartana 50mg',
		horarios: ['08:00', '20:00'],
		diasSemana: [0, 1, 2, 3, 4, 5, 6],
		toleranciaMin: 30,
		lembreteAntesMin: 15,
		medicacao: {
			dose: '50 mg',
			via: 'oral',
			inicioTratamento: iso(subDays(agora, 60)),
			// estoque baixo de propósito: 4 restantes com alerta abaixo de 6 (§8)
			estoque: { quantidadeAtual: 4, unidade: 'comprimidos', consumoPorDose: 1, alertarAbaixoDe: 6 }
		},
		ativo: true
	};
	const cafeManha: CareTask = {
		id: novoId(),
		patientId: maria.id,
		tipo: 'refeicao',
		titulo: 'Café da manhã',
		horarios: ['08:00'],
		diasSemana: [0, 1, 2, 3, 4, 5, 6],
		toleranciaMin: 30,
		lembreteAntesMin: 15,
		ativo: true
	};
	const almoco: CareTask = {
		id: novoId(),
		patientId: maria.id,
		tipo: 'refeicao',
		titulo: 'Almoço',
		horarios: ['12:00'],
		diasSemana: [0, 1, 2, 3, 4, 5, 6],
		toleranciaMin: 30,
		lembreteAntesMin: 15,
		ativo: true
	};
	const sinaisVitais: CareTask = {
		id: novoId(),
		patientId: maria.id,
		tipo: 'medicao',
		titulo: 'Sinais vitais da manhã',
		horarios: ['09:00'],
		diasSemana: [0, 1, 2, 3, 4, 5, 6],
		toleranciaMin: 30,
		lembreteAntesMin: 15,
		measurementTypeIds: [pa.id, fc.id],
		ativo: true
	};
	// Antônio: medicação atrasada há 70 min → alerta crítico (§4.1)
	const metformina: CareTask = {
		id: novoId(),
		patientId: antonio.id,
		tipo: 'medicacao',
		titulo: 'Metformina 850mg',
    // Mantém a ocorrência no mesmo dia do teste, inclusive quando a suíte roda perto da meia-noite.
    horarios: ['00:00'],
		diasSemana: [0, 1, 2, 3, 4, 5, 6],
		toleranciaMin: 30,
		lembreteAntesMin: 15,
		medicacao: { dose: '850 mg', via: 'oral', inicioTratamento: iso(subDays(agora, 120)) },
		ativo: true
	};
	// Antônio: tarefa não-medicação 45 min atrasada → "tarefa pendente" (atenção)
	const lancheTarde: CareTask = {
		id: novoId(),
		patientId: antonio.id,
		tipo: 'refeicao',
		titulo: 'Lanche da tarde',
		horarios: [format(subMinutes(agora, 45), 'HH:mm')],
		diasSemana: [0, 1, 2, 3, 4, 5, 6],
		toleranciaMin: 30,
		lembreteAntesMin: 15,
		ativo: true
	};

	// --- Eventos + leituras
	const eventos: CareEvent[] = [];
	const leituras: Reading[] = [];
	const evento = (
		e: Omit<CareEvent, 'id' | 'registradoEm' | 'registradoPor' | 'status' | 'sincronizado'> &
			Partial<Pick<CareEvent, 'status'>>
	): CareEvent => {
		const completo: CareEvent = {
			status: 'realizado',
			...e,
			id: novoId(),
			registradoEm: e.ocorridoEm,
			registradoPor: joao.id,
			sincronizado: false
		};
		eventos.push(completo);
		return completo;
	};
	const leitura = (r: Omit<Reading, 'id' | 'sincronizado' | 'foraDoPadrao'> & Partial<Pick<Reading, 'foraDoPadrao'>>) => {
		leituras.push({ foraDoPadrao: false, ...r, id: novoId(), sincronizado: false });
	};

	// Dia da Maria (mockup): café 08:00 · medicação 08:15 · aferição 09:20 (PA 120x80,
	// FC 72) · tontura 10:30 · médico informado 11:00 · almoço 12:10
	evento({
		patientId: maria.id,
		taskId: cafeManha.id,
		tipo: 'refeicao',
		titulo: 'Café da manhã',
		observacao: 'Comeu bem, aceitou a fruta',
		ocorridoEm: noDia(agora, '08:00')
	});
	evento({
		patientId: maria.id,
		taskId: losartana.id,
		tipo: 'medicacao',
		titulo: 'Losartana 50mg',
		ocorridoEm: noDia(agora, '08:15'),
		justificativaSemFoto: 'Registro de demonstração (sem câmera)'
	});
	const afericaoMaria = evento({
		patientId: maria.id,
		taskId: sinaisVitais.id,
		tipo: 'medicao',
		titulo: 'Sinais vitais',
		ocorridoEm: noDia(agora, '09:20')
	});
	leitura({
		patientId: maria.id,
		eventId: afericaoMaria.id,
		measurementTypeId: pa.id,
		campo: 'sistolica',
		valorNum: 120,
		aferidoEm: afericaoMaria.ocorridoEm
	});
	leitura({
		patientId: maria.id,
		eventId: afericaoMaria.id,
		measurementTypeId: pa.id,
		campo: 'diastolica',
		valorNum: 80,
		aferidoEm: afericaoMaria.ocorridoEm
	});
	leitura({
		patientId: maria.id,
		eventId: afericaoMaria.id,
		measurementTypeId: fc.id,
		campo: 'valor',
		valorNum: 72,
		aferidoEm: afericaoMaria.ocorridoEm
	});
	evento({
		patientId: maria.id,
		tipo: 'outro',
		titulo: 'Episódio de tontura',
		observacao: 'Tontura leve ao levantar; sentou e melhorou em alguns minutos',
		ocorridoEm: noDia(agora, '10:30')
	});
	evento({
		patientId: maria.id,
		tipo: 'outro',
		titulo: 'Médico informado',
		observacao: 'Dr. Carlos orientou observar e reforçar hidratação',
		ocorridoEm: noDia(agora, '11:00')
	});
	evento({
		patientId: maria.id,
		taskId: almoco.id,
		tipo: 'refeicao',
		titulo: 'Almoço',
		ocorridoEm: noDia(agora, '12:10')
	});

	// Zilda: FC 88/90/91/89 nos dias anteriores e 140 hoje → desvio de baseline (§4.2b)
	const fcSerie = [
		{ dia: 4, valor: 88 },
		{ dia: 3, valor: 90 },
		{ dia: 2, valor: 91 },
		{ dia: 1, valor: 89 }
	];
	for (const { dia, valor } of fcSerie) {
		const ev = evento({
			patientId: zilda.id,
			tipo: 'medicao',
			titulo: 'Aferição de frequência cardíaca',
			ocorridoEm: noDia(subDays(agora, dia), '09:30')
		});
		leitura({
			patientId: zilda.id,
			eventId: ev.id,
			measurementTypeId: fc.id,
			campo: 'valor',
			valorNum: valor,
			aferidoEm: ev.ocorridoEm
		});
	}
	const fcHoje = evento({
		patientId: zilda.id,
		tipo: 'medicao',
		titulo: 'Aferição de frequência cardíaca',
		ocorridoEm: noDia(agora, '09:15')
	});
	leitura({
		patientId: zilda.id,
		eventId: fcHoje.id,
		measurementTypeId: fc.id,
		campo: 'valor',
		valorNum: 140,
		aferidoEm: fcHoje.ocorridoEm,
		foraDoPadrao: true
	});
	leituras[leituras.length - 1].motivoDesvio = 'baseline';

	// Zilda: diurese (customizada) com 5 leituras normais e uma discrepante hoje
	const diureseSerie = [
		{ dia: 5, volume: 350 },
		{ dia: 4, volume: 400 },
		{ dia: 3, volume: 380 },
		{ dia: 2, volume: 420 },
		{ dia: 1, volume: 390 }
	];
	for (const { dia, volume } of diureseSerie) {
		const ev = evento({
			patientId: zilda.id,
			tipo: 'medicao',
			titulo: 'Registro de diurese',
			ocorridoEm: noDia(subDays(agora, dia), '07:00')
		});
		leitura({
			patientId: zilda.id,
			eventId: ev.id,
			measurementTypeId: diurese.id,
			campo: 'volume',
			valorNum: volume,
			aferidoEm: ev.ocorridoEm
		});
	}
	const diureseHoje = evento({
		patientId: zilda.id,
		tipo: 'medicao',
		titulo: 'Registro de diurese',
		ocorridoEm: noDia(agora, '07:00')
	});
	leitura({
		patientId: zilda.id,
		eventId: diureseHoje.id,
		measurementTypeId: diurese.id,
		campo: 'volume',
		valorNum: 120,
		aferidoEm: diureseHoje.ocorridoEm,
		foraDoPadrao: true
	});
	leituras[leituras.length - 1].motivoDesvio = 'baseline';

	// Zilda: última evacuação há 4 dias → "sem registro há tempo demais" (§4.3, 72h)
	const evac = evento({
		patientId: zilda.id,
		tipo: 'medicao',
		titulo: 'Evacuação',
		ocorridoEm: noDia(subDays(agora, 4), '08:00')
	});
	leitura({
		patientId: zilda.id,
		eventId: evac.id,
		measurementTypeId: evacuacao.id,
		campo: 'ocorreu',
		valorNum: 1,
		aferidoEm: evac.ocorridoEm
	});
	leitura({
		patientId: zilda.id,
		eventId: evac.id,
		measurementTypeId: evacuacao.id,
		campo: 'consistencia',
		valorTexto: 'Tipo 4',
		aferidoEm: evac.ocorridoEm
	});

	// --- Link ativo do responsável (Maria) para testar /r/:token (§6)
	const linkMaria: ShareLink = {
		token: novoToken(),
		patientId: maria.id,
		criadoPor: joao.id,
		criadoEm: iso(agora),
		expiraEm: iso(addDays(agora, 7)),
		escopo: 'dia_atual',
		revogado: false
	};

	await db.caregivers.add(joao);
	await db.patients.bulkAdd([maria, antonio, zilda]);
	await db.measurementTypes.bulkAdd([
		fc,
		pa,
		temp,
		spo2,
		glicemia,
		peso,
		dor,
		evacuacao,
		hidratacao,
		humor,
		diurese
	]);
	await db.tasks.bulkAdd([losartana, cafeManha, almoco, sinaisVitais, metformina, lancheTarde]);
	await db.events.bulkAdd(eventos);
	await db.readings.bulkAdd(leituras);
	await db.shareLinks.add(linkMaria);
	// Alertas NÃO são seedados: são derivados dos dados pelo motor (Fase 7).
}
