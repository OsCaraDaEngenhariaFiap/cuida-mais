// Apresentação dos TIPOS DE CUIDADO (conjunto fechado do domínio, §3) — isto não
// é métrica: aferições continuam 100% dirigidas por dados (MeasurementType).
import type { TipoCuidado } from '$lib/domain/types';

export const TIPOS_CUIDADO: Record<TipoCuidado, { rotulo: string; icone: string; cor: string }> = {
	medicacao: { rotulo: 'Medicação', icone: '💊', cor: 'bg-cuidado' },
	refeicao: { rotulo: 'Refeição', icone: '🍽️', cor: 'bg-realizado' },
	medicao: { rotulo: 'Aferição', icone: '🩺', cor: 'bg-cuidado' },
	higiene: { rotulo: 'Higiene', icone: '🛁', cor: 'bg-comunicacao' },
	atividade: { rotulo: 'Atividade', icone: '🚶', cor: 'bg-atencao' },
	outro: { rotulo: 'Outro', icone: '📝', cor: 'bg-navy-600' }
};

export const VIAS_MEDICACAO = [
	'oral',
	'sublingual',
	'topica',
	'inalatoria',
	'ocular',
	'nasal',
	'retal',
	'subcutanea',
	'intramuscular',
	'sonda',
	'outra'
] as const;

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
