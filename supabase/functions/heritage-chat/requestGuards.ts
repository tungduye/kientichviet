export interface ValidChatMessage {
  sender: "user" | "assistant"
  text: string
}

interface ValidChatMessagesResult {
  ok: true
  messages: ValidChatMessage[]
}

interface InvalidChatMessagesResult {
  ok: false
  error: string
}

type ParsedChatMessages = ValidChatMessagesResult | InvalidChatMessagesResult

const MAX_MESSAGE_LENGTH = 2000
const OFFICIAL_ORIGIN = "https://kientichviet.com"

export function isAllowedOrigin(
  origin: string,
  allowedPreviewOrigins = "",
): boolean {
  if (!origin) return true

  try {
    const url = new URL(origin)
    const hostname = url.hostname.toLowerCase()
    const officialHost =
      hostname === "kientichviet.com" || hostname.endsWith(".kientichviet.com")
    const localHost = hostname === "localhost" || hostname === "127.0.0.1"
    const previewOrigins = new Set(
      allowedPreviewOrigins
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    )

    return (
      (url.protocol === "https:" && officialHost) ||
      previewOrigins.has(origin) ||
      ((url.protocol === "http:" || url.protocol === "https:") && localHost)
    )
  } catch {
    return false
  }
}

export function getCorsHeaders(req: Request, allowedPreviewOrigins = "") {
  const origin = req.headers.get("origin") || ""

  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin, allowedPreviewOrigins)
      ? origin || "*"
      : OFFICIAL_ORIGIN,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

export function parseChatMessages(value: unknown): ParsedChatMessages {
  if (
    !Array.isArray(value) ||
    value.length !== 1
  ) {
    return { ok: false, error: "Yêu cầu không hợp lệ." }
  }

  const messages: ValidChatMessage[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Tin nhắn không hợp lệ." }
    }
    const candidate = item as Partial<ValidChatMessage>
    if (
      candidate.sender !== "user" || typeof candidate.text !== "string"
    ) {
      return { ok: false, error: "Tin nhắn không hợp lệ." }
    }
    const text = candidate.text.trim()
    if (!text || text.length > MAX_MESSAGE_LENGTH) {
      return { ok: false, error: "Nội dung tin nhắn không hợp lệ." }
    }
    messages.push({ sender: candidate.sender, text })
  }

  return { ok: true, messages }
}
