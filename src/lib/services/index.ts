// Implementação ativa da camada de serviço. Trocar o mock por uma API real,
// no futuro, deve ser uma mudança neste arquivo e em nada mais (§8).
import { mockServices } from './mock';
import type { Services } from './types';

export type * from './types';

export const services: Services = mockServices;
