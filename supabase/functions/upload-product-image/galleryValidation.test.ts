import { describe, expect, it } from "vitest"

import {
  mergeGalleryUrls,
  parseExpectedRevision,
  parseTrustedGalleryUrls,
  storagePathFromPublicUrl,
} from "./galleryValidation"

const prefix =
  "https://project.supabase.co/storage/v1/object/public/product-images/"

describe("product gallery validation", () => {
  it("accepts only bounded URLs from the managed product image bucket", () => {
    expect(
      parseTrustedGalleryUrls(
        JSON.stringify([`${prefix}catalog/p1/a`, `${prefix}catalog/p1/b?v=2`]),
        prefix,
      ),
    ).toEqual([`${prefix}catalog/p1/a`, `${prefix}catalog/p1/b?v=2`])

    expect(() =>
      parseTrustedGalleryUrls(
        JSON.stringify(["https://tracking.example/image.webp"]),
        prefix,
      ),
    ).toThrow(/không hợp lệ/)
  })

  it("limits a gallery to eight unique images", () => {
    const existing = Array.from({ length: 7 }, (_, index) => `old-${index}`)

    expect(mergeGalleryUrls(existing, ["new", "new"])).toHaveLength(8)
    expect(() => mergeGalleryUrls(existing, ["new-a", "new-b"])).toThrow(
      /8 ảnh/,
    )
  })

  it("extracts a removable storage object path without the version query", () => {
    const objectId = "a7e13c67-81a1-421e-8efa-fbd501339d8b"
    expect(
      storagePathFromPublicUrl(
        `${prefix}catalog/p1/${objectId}?v=123`,
        prefix,
        "p1",
      ),
    ).toBe(`catalog/p1/${objectId}`)
    expect(
      storagePathFromPublicUrl(`${prefix}catalog/p2/a`, prefix, "p1"),
    ).toBeNull()
    expect(
      storagePathFromPublicUrl("https://example.com/a", prefix, "p1"),
    ).toBeNull()
  })

  it("accepts only positive integer optimistic-lock revisions", () => {
    expect(parseExpectedRevision("17")).toBe(17)
    expect(parseExpectedRevision("0")).toBeNull()
    expect(parseExpectedRevision("1.5")).toBeNull()
    expect(parseExpectedRevision("2147483647")).toBeNull()
    expect(parseExpectedRevision(null)).toBeNull()
  })
})
