/** Hash FNV-1a de mock — NÃO é segurança real (§3: fase sem backend). */
export function hashSenha(senha: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < senha.length; i++) {
		h ^= senha.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(16).padStart(8, '0');
}
