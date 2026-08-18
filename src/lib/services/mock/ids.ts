import type { UUID } from '$lib/domain/types';

// crypto.randomUUID só existe em contexto seguro; em HTTP na LAN o app ainda
// deve abrir (§11.3), então cai num UUID v4 via getRandomValues.
export const novoId = (): UUID => {
	if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
	const b = crypto.getRandomValues(new Uint8Array(16));
	b[6] = (b[6] & 0x0f) | 0x40;
	b[8] = (b[8] & 0x3f) | 0x80;
	const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

/** Token de compartilhamento: 24 chars URL-safe (18 bytes → base64url). */
export function novoToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replaceAll('+', '-').replaceAll('/', '_');
}
