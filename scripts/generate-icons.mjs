// Gera os ícones placeholder do PWA (PNG sólido navy) sem nenhuma dependência —
// só zlib built-in (Node >= 22.2 tem crc32). Rodar dentro do container:
//   docker compose run --rm web node scripts/generate-icons.mjs
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const NAVY = [0x15, 0x2a, 0x47];

function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const body = Buffer.concat([Buffer.from(type), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body) >>> 0);
	return Buffer.concat([len, body, crc]);
}

function solidPng(size, [r, g, b]) {
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 2; // color type RGB
	const row = Buffer.alloc(1 + size * 3); // byte 0 = filtro None
	for (let x = 0; x < size; x++) {
		row[1 + x * 3] = r;
		row[2 + x * 3] = g;
		row[3 + x * 3] = b;
	}
	const raw = Buffer.concat(Array(size).fill(row));
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0))
	]);
}

mkdirSync('static/icons', { recursive: true });
for (const size of [192, 512]) {
	const png = solidPng(size, NAVY);
	// full-bleed sólido serve para os dois propósitos; entries do manifest é que separam any/maskable
	writeFileSync(`static/icons/icon-${size}.png`, png);
	writeFileSync(`static/icons/icon-maskable-${size}.png`, png);
	console.log(`static/icons/icon-${size}.png + icon-maskable-${size}.png (${png.length} bytes)`);
}
