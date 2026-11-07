import {
  getCorsHeaders,
  isAllowedOrigin,
} from "../heritage-chat/requestGuards.ts"

const MAX_SPEECH_LENGTH = 1800
const rateLimits = new Map<string, { count: number, resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const current = rateLimits.get(ip)

  if (!current || now > current.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }

  if (current.count >= 20) return true
  current.count += 1
  return false
}

function json(
  body: Record<string, string>,
  status: number,
  headers: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  const allowedPreviewOrigins = Deno.env.get("ALLOWED_PREVIEW_ORIGINS") || ""
  const corsHeaders = getCorsHeaders(req, allowedPreviewOrigins)
  const requestOrigin = req.headers.get("origin") || ""

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Phương thức không được hỗ trợ." }, 405, corsHeaders)
  }

  if (requestOrigin && !isAllowedOrigin(requestOrigin, allowedPreviewOrigins)) {
    return json({ error: "Nguồn yêu cầu không được phép." }, 403, corsHeaders)
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "client-default"

  if (isRateLimited(clientIp)) {
    return json(
      { error: "Bạn đang yêu cầu đọc quá nhanh. Vui lòng thử lại sau." },
      429,
      corsHeaders,
    )
  }

  try {
    const body = (await req.json()) as { text?: unknown }
    const text = typeof body.text === "string" ? body.text.trim() : ""

    if (!text || text.length > MAX_SPEECH_LENGTH) {
      return json({ error: "Nội dung đọc không hợp lệ." }, 400, corsHeaders)
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY")
    if (!apiKey) {
      return json(
        { error: "Chưa cấu hình dịch vụ giọng đọc." },
        500,
        corsHeaders,
      )
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_TTS_MODEL") || "gpt-4o-mini-tts-2025-12-15",
        voice: Deno.env.get("OPENAI_TTS_VOICE") || "coral",
        input: text,
        response_format: "mp3",
        speed: 0.96,
        instructions:
          "Đọc bằng giọng nữ Việt Nam ấm áp, tự nhiên, rõ chữ và nhịp vừa phải. Phát âm tiếng Việt chuẩn. Với từ tiếng Anh hoặc thuật ngữ kỹ thuật, chuyển sang cách phát âm tiếng Anh rõ ràng: NFC đọc từng chữ cái, AR đọc từng chữ cái, 3D đọc là three dee, basswood và mosaic đọc theo tiếng Anh. Không đọc ký hiệu markdown.",
      }),
      signal: AbortSignal.timeout(25_000),
    })

    if (!response.ok) {
      console.error(
        "OpenAI speech failed:",
        response.status,
        (await response.text()).slice(0, 300),
      )
      return json(
        { error: "Chưa tạo được giọng đọc. Vui lòng thử lại." },
        response.status === 429 ? 429 : 503,
        corsHeaders,
      )
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        // Supabase Functions JS deserializes application/octet-stream as a Blob.
        // Returning audio/mpeg would be treated as text and corrupt the MP3 bytes.
        "Content-Type": "application/octet-stream",
        "X-Audio-Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline; filename=assistant.mp3",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Heritage speech error:", error)
    return json(
      { error: "Chưa tạo được giọng đọc. Vui lòng thử lại." },
      503,
      corsHeaders,
    )
  }
})
