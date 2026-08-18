// §7: fotos em base64 SEMPRE comprimidas antes de salvar (máx 1024px, JPEG
// q0.7) — sem isso o IndexedDB estoura em semanas de uso.
export async function comprimirImagem(
	arquivo: File | Blob,
	maxDimensao = 1024,
	qualidade = 0.7
): Promise<string> {
	const bitmap = await createImageBitmap(arquivo);
	const escala = Math.min(1, maxDimensao / Math.max(bitmap.width, bitmap.height));
	const largura = Math.round(bitmap.width * escala);
	const altura = Math.round(bitmap.height * escala);
	const canvas = document.createElement('canvas');
	canvas.width = largura;
	canvas.height = altura;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D indisponível');
	ctx.drawImage(bitmap, 0, 0, largura, altura);
	bitmap.close();
	return canvas.toDataURL('image/jpeg', qualidade);
}
