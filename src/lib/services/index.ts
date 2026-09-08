// Implementação ativa da camada de serviço. Em browser, a fatia integrada usa
// a API Oracle; testes Node e recursos ainda não suportados continuam no mock.
import { browser } from '$app/environment';
import { mockServices } from './mock';
import { apiServices } from './api';
import type { Services } from './types';

export type * from './types';

export const services: Services = browser ? apiServices : mockServices;
