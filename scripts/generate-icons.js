const fs = require('fs')
const zlib = require('zlib')

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([len, typeAndData, crc])
}

function createPNG(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR - RGBA (color type 6)
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // RGBA
  const ihdr = createChunk('IHDR', ihdrData)

  // Build pixel data
  const rowSize = 1 + size * 4 // filter byte + RGBA per pixel
  const raw = Buffer.alloc(rowSize * size)

  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.45
  const innerR = size * 0.35

  for (let y = 0; y < size; y++) {
    const offset = y * rowSize
    raw[offset] = 0 // no filter
    for (let x = 0; x < size; x++) {
      const px = offset + 1 + x * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= outerR) {
        // Background circle - amber (#f59e0b)
        raw[px] = 245
        raw[px + 1] = 158
        raw[px + 2] = 11
        raw[px + 3] = 255

        if (dist <= innerR) {
          // Inner area - draw "T" letter for Thai
          const relX = (x - cx) / innerR
          const relY = (y - cy) / innerR

          // T shape: horizontal bar at top, vertical bar in center
          const isTopBar = relY >= -0.7 && relY <= -0.35 && relX >= -0.5 && relX <= 0.5
          const isVertBar = relY >= -0.35 && relY <= 0.7 && relX >= -0.15 && relX <= 0.15

          if (isTopBar || isVertBar) {
            // Dark text color (#1c1917 stone-900)
            raw[px] = 28
            raw[px + 1] = 25
            raw[px + 2] = 23
            raw[px + 3] = 255
          }
        }
      } else {
        // Transparent
        raw[px] = 0
        raw[px + 1] = 0
        raw[px + 2] = 0
        raw[px + 3] = 0
      }
    }
  }

  const compressed = zlib.deflateSync(raw)
  const idat = createChunk('IDAT', compressed)
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

fs.writeFileSync('public/icon-192.png', createPNG(192))
fs.writeFileSync('public/icon-512.png', createPNG(512))
console.log('Icons generated: icon-192.png, icon-512.png')
