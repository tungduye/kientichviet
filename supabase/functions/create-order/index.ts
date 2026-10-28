import {
  getCorsHeaders,
  isAllowedOrigin,
} from "../heritage-chat/requestGuards.ts"

// In-memory sliding window rate limiter: 6 orders / 5 minutes per IP
interface RateLimitRecord {
  count: number
  resetAt: number
}
const orderRateLimitMap = new Map<string, RateLimitRecord>()

function isRateLimited(ip: string, maxRequests = 6, windowMs = 300_000): boolean {
  const now = Date.now()
  if (orderRateLimitMap.size > 1000) {
    for (const [key, val] of orderRateLimitMap.entries()) {
      if (now > val.resetAt) orderRateLimitMap.delete(key)
    }
  }

  const record = orderRateLimitMap.get(ip)
  if (!record || now > record.resetAt) {
    orderRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }

  if (record.count >= maxRequests) {
    return true
  }

  record.count += 1
  return false
}

Deno.serve(async (req) => {
  const allowedPreviewOrigins =
    Deno.env.get("ALLOWED_PREVIEW_ORIGINS") || ""
  const requestOrigin = req.headers.get("origin") || ""
  const corsHeaders = getCorsHeaders(req, allowedPreviewOrigins)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (requestOrigin && !isAllowedOrigin(requestOrigin, allowedPreviewOrigins)) {
    return json({ error: "Nguồn yêu cầu không được phép." }, 403, corsHeaders)
  }

  if (req.method !== "POST") {
    return json({ error: "Phương thức không được hỗ trợ." }, 405, corsHeaders)
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "client-default"

  if (isRateLimited(clientIp, 6, 300_000)) {
    return json(
      { error: "Hệ thống phát hiện quá nhiều đơn hàng từ thiết bị của bạn. Vui lòng thử lại sau ít phút." },
      429,
      corsHeaders
    )
  }

  try {
    const payload = await req.json()
    const { customerName, customerPhone, customerAddress } = payload || {}

    // Server-side validation
    if (!customerName || !customerPhone || !customerAddress) {
      return json(
        { error: "Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ." },
        400,
        corsHeaders
      )
    }

    const cleanPhone = String(customerPhone).replace(/\D/g, "")
    if (cleanPhone.length < 9 || cleanPhone.length > 12) {
      return json({ error: "Số điện thoại không hợp lệ." }, 400, corsHeaders)
    }

    const webhookUrl = Deno.env.get("ORDER_WEBHOOK_URL")
    if (!webhookUrl) {
      console.error("ORDER_WEBHOOK_URL is not set in Supabase secrets.")
      return json(
        { error: "Hệ thống đặt hàng tạm thời bảo trì. Vui lòng liên hệ hotline." },
        500,
        corsHeaders
      )
    }

    // Forward order payload to Google Apps Script Web App
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.warn("Google Apps Script response status:", response.status)
      return json(
        { error: "Chưa thể chuyển đơn hàng tới hệ thống xử lý. Vui lòng thử lại." },
        502,
        corsHeaders
      )
    }

    return json(
      {
        success: true,
        message: "Đơn hàng đã được tiếp nhận thành công.",
        orderId: payload.orderId,
      },
      200,
      corsHeaders
    )
  } catch (err) {
    console.error("Create order error:", err)
    return json({ error: "Có lỗi khi xử lý đơn hàng. Vui lòng thử lại." }, 500, corsHeaders)
  }
})

function json(body: unknown, status = 200, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
