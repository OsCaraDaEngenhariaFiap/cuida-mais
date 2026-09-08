// No browser, a aplicação usa apiServices como fonte de dados persistentes.
// mockServices fica restrito a testes Node e fixtures de desenvolvimento.
import { browser } from '$app/environment';
import { mockServices } from './mock';
import { apiServices } from './api';
import type { Services } from './types';

export type * from './types';

export const services: Services = browser ? apiServices : mockServices;
