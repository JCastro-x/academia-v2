// Genera public/badge-96.png: checkmark blanco monocromático sobre fondo
// transparente, para usar como `badge` en showNotification (Android tinta/
// "siluetea" esta imagen en la barra de estado). Correr: node scripts/generate-badge.mjs
import { writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'

const SIZE = 96
const px = new Uint8Array(SIZE * SIZE * 4)

function distToSegment(px1, py1, px2, py2, x, y) {
  const dx = px2 - px1
  const dy = py2 - py1
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((x - px1) * dx + (y - py1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = px1 + t * dx
  const cy = py1 + t * dy
  return Math.hypot(x - cx, y - cy)
}

const THICKNESS = 9
const segments = [
  [24, 50, 42, 70],
  [42, 70, 74, 28],
]

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // muestras por píxel para bordes suaves
    let hit = 0
    for (const sy of [y - 0.25, y + 0.25]) {
      for (const sx of [x - 0.25, x + 0.25]) {
        if (segments.some(([ax, ay, bx, by]) => distToSegment(ax, ay, bx, by, sx, sy) <= THICKNESS / 2)) hit++
      }
    }
    const alpha = Math.round((hit / 4) * 255)
    const i = (y * SIZE + x) * 4
    px[i] = 255
    px[i + 1] = 255
    px[i + 2] = 255
    px[i + 3] = alpha
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([len, body, crc])
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = -1
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return ~c
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // RGBA

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0 // filter none
  Buffer.from(px.buffer, y * SIZE * 4, SIZE * 4).copy(raw, y * (SIZE * 4 + 1) + 1)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
])

await writeFile(new URL('../public/badge-96.png', import.meta.url), png)
console.log('badge-96.png generado')