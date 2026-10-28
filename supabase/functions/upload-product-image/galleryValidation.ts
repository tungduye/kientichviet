export const MAX_GALLERY_IMAGES = 8

export function parseExpectedRevision(
  value: FormDataEntryValue | null,
): number | null {
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value)) return null
  const revision = Number(value)
  return Number.isSafeInteger(revision) && revision < 2_147_483_647
    ? revision
    : null
}

export function parseTrustedGalleryUrls(
  rawValue: FormDataEntryValue | null,
  trustedPublicPrefix: string,
): string[] {
  if (rawValue === null || rawValue === "") return []
  if (typeof rawValue !== "string")
    throw new Error("Danh sách ảnh không hợp lệ.")

  let parsed: unknown
  try {
    parsed = JSON.parse(rawValue)
  } catch {
    throw new Error("Danh sách ảnh không hợp lệ.")
  }

  if (!Array.isArray(parsed) || parsed.length > MAX_GALLERY_IMAGES) {
    throw new Error(
      `Mỗi dòng sản phẩm chỉ lưu tối đa ${MAX_GALLERY_IMAGES} ảnh.`,
    )
  }

  const urls = [...new Set(parsed)]
  if (
    urls.some(
      (url) =>
        typeof url !== "string" ||
        url.length > 2048 ||
        !url.startsWith(trustedPublicPrefix),
    )
  ) {
    throw new Error("Danh sách ảnh không hợp lệ.")
  }

  return urls as string[]
}

export function mergeGalleryUrls(
  existingUrls: string[],
  uploadedUrls: string[],
): string[] {
  const merged = [...new Set([...existingUrls, ...uploadedUrls])]
  if (merged.length > MAX_GALLERY_IMAGES) {
    throw new Error(
      `Mỗi dòng sản phẩm chỉ lưu tối đa ${MAX_GALLERY_IMAGES} ảnh.`,
    )
  }
  return merged
}

export function storagePathFromPublicUrl(
  publicUrl: string,
  trustedPublicPrefix: string,
  productKey: string,
): string | null {
  const withoutQuery = publicUrl.split("?")[0]
  if (!withoutQuery.startsWith(trustedPublicPrefix)) return null
  const objectPath = withoutQuery.slice(trustedPublicPrefix.length)
  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(objectPath)
  } catch {
    return null
  }
  const escapedProductKey = productKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const ownedObjectPattern = new RegExp(
    `^catalog/${escapedProductKey}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`,
  )
  return ownedObjectPattern.test(decodedPath) ? decodedPath : null
}
