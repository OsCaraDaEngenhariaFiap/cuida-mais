// Apresentação dos TIPOS DE CUIDADO (conjunto fechado do domínio, §3) — isto não
// é métrica: aferições continuam 100% dirigidas por dados (MeasurementType).
import type { TipoCuidado } from '$lib/domain/types';

export const TIPOS_CUIDADO: Record<TipoCuidado, { rotulo: string; icone: string }> = {
	medicacao: { rotulo: 'Medicação', icone: '💊' },
	refeicao: { rotulo: 'Refeição', icone: '🍽️' },
	medicao: { rotulo: 'Aferição', icone: '🩺' },
	higiene: { rotulo: 'Higiene', icone: '🛁' },
	atividade: { rotulo: 'Atividade', icone: '🚶' },
	outro: { rotulo: 'Outro', icone: '📝' }
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
