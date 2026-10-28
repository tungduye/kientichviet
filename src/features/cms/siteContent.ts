export type ContentFieldType =
  | "text"
  | "textarea"
  | "url"
  | "image"
  | "audio"
  | "model"

export interface ContentFieldDefinition {
  key: string
  page: string
  group: string
  label: string
  type: ContentFieldType
  defaultValue: string
}

export interface ContentEntry {
  contentKey: string
  draftValue: string
  publishedValue: string
  revision: number
  isVisible: boolean
}

export interface ContentSnapshotItem {
  value: string
  isVisible: boolean
  revision: number
  definition: ContentFieldDefinition
}

export type ContentSnapshot = Record<string, ContentSnapshotItem>

export type SanitizedContentValue =
  | { ok: true; value: string }
  | { ok: false; error: string }

const MAX_TEXT_LENGTH = 5000
const MAX_URL_LENGTH = 2048

function isSafeUrl(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//")

  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function sanitizeContentValue(
  type: ContentFieldType,
  value: string,
): SanitizedContentValue {
  const normalized = value.trim()
  const isUrlField = ["url", "image", "audio", "model"].includes(type)

  if (normalized.length > (isUrlField ? MAX_URL_LENGTH : MAX_TEXT_LENGTH)) {
    return { ok: false, error: "Nội dung vượt quá độ dài cho phép." }
  }

  if (isUrlField && normalized && !isSafeUrl(normalized)) {
    return {
      ok: false,
      error: "Liên kết phải là đường dẫn nội bộ hoặc URL http/https hợp lệ.",
    }
  }

  return { ok: true, value: normalized }
}

export function buildContentSnapshot(
  definitions: ContentFieldDefinition[],
  entries: ContentEntry[],
  mode: "draft" | "published",
): ContentSnapshot {
  const entriesByKey = new Map(
    entries.map((entry) => [entry.contentKey, entry]),
  )

  return Object.fromEntries(
    definitions.map((definition) => {
      const entry = entriesByKey.get(definition.key)
      const value = entry
        ? mode === "draft"
          ? entry.draftValue
          : entry.publishedValue
        : definition.defaultValue

      return [
        definition.key,
        {
          value,
          isVisible: entry?.isVisible ?? true,
          revision: entry?.revision ?? 0,
          definition,
        },
      ]
    }),
  )
}
