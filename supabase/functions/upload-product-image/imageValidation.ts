const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_DIMENSION = 6000
const MAX_PIXELS = 24_000_000

interface ValidImage {
  ok: true
  mimeType: "image/jpeg" | "image/png" | "image/webp"
  width: number
  height: number
}

interface InvalidImage {
  ok: false
  error: string
}

export type ImageValidationResult = ValidImage | InvalidImage

function readPng(bytes: Uint8Array): ValidImage | null {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  if (
    bytes.length < 24 ||
    !signature.every((value, index) => bytes[index] === value) ||
    String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR"
  ) {
    return null
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return {
    ok: true,
    mimeType: "image/png",
    width: view.getUint32(16),
    height: view.getUint32(20),
  }
}

function readJpeg(bytes: Uint8Array): ValidImage | null {
  if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null

  const sofMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ])
  let offset = 2

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1]
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0x00 || marker === 0xff) {
      offset += 1
      continue
    }

    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (segmentLength < 2 || offset + segmentLength + 2 > bytes.length) break

    if (sofMarkers.has(marker)) {
      return {
        ok: true,
        mimeType: "image/jpeg",
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      }
    }

    offset += segmentLength + 2
  }

  return null
}

function readWebp(bytes: Uint8Array): ValidImage | null {
  if (
    bytes.length < 30 ||
    String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
    String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP"
  ) {
    return null
  }

  const chunk = String.fromCharCode(...bytes.slice(12, 16))
  let width = 0
  let height = 0

  if (chunk === "VP8X") {
    width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16)
    height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
  } else if (chunk === "VP8L" && bytes[20] === 0x2f) {
    width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8)
    height =
      1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10)
  } else if (
    chunk === "VP8 " &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    width = (bytes[26] | (bytes[27] << 8)) & 0x3fff
    height = (bytes[28] | (bytes[29] << 8)) & 0x3fff
  }

  return width && height
    ? { ok: true, mimeType: "image/webp", width, height }
    : null
}

export function validateRasterImage(bytes: Uint8Array): ImageValidationResult {
  if (!bytes.length || bytes.length > MAX_FILE_SIZE) {
    return { ok: false, error: "Ảnh phải có dung lượng từ 1 byte đến 5 MB." }
  }

  const image = readPng(bytes) || readJpeg(bytes) || readWebp(bytes)
  if (!image) {
    return { ok: false, error: "Tệp không phải ảnh JPG, PNG hoặc WebP hợp lệ." }
  }

  if (
    image.width < 1 ||
    image.height < 1 ||
    image.width > MAX_DIMENSION ||
    image.height > MAX_DIMENSION ||
    image.width * image.height > MAX_PIXELS
  ) {
    return { ok: false, error: "Ảnh có kích thước giải mã quá lớn." }
  }

  return image
}
