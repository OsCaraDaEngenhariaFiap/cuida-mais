import { differenceInYears, parseISO } from 'date-fns';
import type { ISODate } from './types';

// Idade é sempre derivada da data de nascimento — nunca armazenada (§3)
export function calcularIdade(dataNascimento: ISODate, referencia: Date = new Date()): number {
	return differenceInYears(referencia, parseISO(dataNascimento));
}
