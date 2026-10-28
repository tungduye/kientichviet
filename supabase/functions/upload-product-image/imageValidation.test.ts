import { describe, expect, it } from "vitest"

import { validateRasterImage } from "./imageValidation"

function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24)
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0)
  bytes.set([73, 72, 68, 82], 12)
  new DataView(bytes.buffer).setUint32(16, width)
  new DataView(bytes.buffer).setUint32(20, height)
  return bytes
}

function jpeg(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(21)
  bytes.set([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08], 0)
  bytes[7] = height >> 8
  bytes[8] = height & 0xff
  bytes[9] = width >> 8
  bytes[10] = width & 0xff
  return bytes
}

function webpExtended(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set(new TextEncoder().encode("RIFF"), 0)
  bytes.set(new TextEncoder().encode("WEBP"), 8)
  bytes.set(new TextEncoder().encode("VP8X"), 12)
  const widthMinusOne = width - 1
  const heightMinusOne = height - 1
  bytes.set(
    [widthMinusOne & 0xff, (widthMinusOne >> 8) & 0xff, widthMinusOne >> 16],
    24,
  )
  bytes.set(
    [heightMinusOne & 0xff, (heightMinusOne >> 8) & 0xff, heightMinusOne >> 16],
    27,
  )
  return bytes
}

describe("server-side raster validation", () => {
  it("detects a valid PNG from its bytes rather than declared metadata", () => {
    expect(validateRasterImage(png(1200, 800))).toEqual({
      ok: true,
      mimeType: "image/png",
      width: 1200,
      height: 800,
    })
  })

  it("detects JPEG dimensions from a start-of-frame segment", () => {
    expect(validateRasterImage(jpeg(1920, 1080))).toMatchObject({
      ok: true,
      mimeType: "image/jpeg",
      width: 1920,
      height: 1080,
    })
  })

  it("detects extended WebP dimensions", () => {
    expect(validateRasterImage(webpExtended(1600, 900))).toEqual({
      ok: true,
      mimeType: "image/webp",
      width: 1600,
      height: 900,
    })
  })

  it("rejects SVG or arbitrary bytes", () => {
    const svg = new TextEncoder().encode('<svg onload="alert(1)"></svg>')

    expect(validateRasterImage(svg)).toMatchObject({ ok: false })
  })

  it("rejects malformed PNG, JPEG and WebP containers", () => {
    const badPng = png(100, 100)
    badPng[12] = 0
    const badJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2, 0, 0, 0, 0])
    const badWebp = webpExtended(100, 100)
    badWebp.set(new TextEncoder().encode("NOPE"), 12)

    expect(validateRasterImage(badPng)).toMatchObject({ ok: false })
    expect(validateRasterImage(badJpeg)).toMatchObject({ ok: false })
    expect(validateRasterImage(badWebp)).toMatchObject({ ok: false })
  })

  it("rejects oversized decoded dimensions", () => {
    expect(validateRasterImage(png(10_000, 10_000))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/kích thước/),
    })
  })

  it("rejects payloads larger than five megabytes", () => {
    expect(
      validateRasterImage(new Uint8Array(5 * 1024 * 1024 + 1)),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/5 MB/),
    })
  })
})
