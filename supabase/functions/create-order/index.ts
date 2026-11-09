import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const payload = (await req.json()) as Record<string, unknown>
    const cleanText = (value: unknown, maxLength: number) =>
      typeof value === "string" ? value.trim().slice(0, maxLength) : ""

    const orderId = cleanText(payload.orderId, 32)
    const createdAt = cleanText(payload.createdAt, 80)
    const customerName = cleanText(payload.customerName, 120)
    const customerPhone = cleanText(payload.customerPhone, 30)
    const customerEmail = cleanText(payload.customerEmail, 254) || "Chưa cung cấp"
    const customerAddress = cleanText(payload.customerAddress, 500)
    const customerNote = cleanText(payload.customerNote, 1000) || "Không có"
    const products = cleanText(payload.products, 2000)
    const totalAmount = cleanText(payload.totalAmount, 100)
    const totalNumericValue = Number(payload.totalNumeric)
    const totalNumeric = Number.isFinite(totalNumericValue) && totalNumericValue >= 0
      ? Math.floor(totalNumericValue)
      : 0

    // Server-side validation
    if (
      !/^DH-[0-9]{8}-[0-9]{6}$/.test(orderId) ||
      !createdAt ||
      customerName.length < 2 ||
      customerAddress.length < 5 ||
      !products ||
      !totalAmount
    ) {
      return json(
        { error: "Thông tin đơn hàng chưa đầy đủ hoặc không hợp lệ." },
        400,
        corsHeaders
      )
    }

    const cleanPhone = String(customerPhone).replace(/\D/g, "")
    if (cleanPhone.length < 9 || cleanPhone.length > 12) {
      return json({ error: "Số điện thoại không hợp lệ." }, 400, corsHeaders)
    }

    if (
      customerEmail !== "Chưa cung cấp" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    ) {
      return json({ error: "Email không hợp lệ." }, 400, corsHeaders)
    }

    const rawItems = Array.isArray(payload.items) ? payload.items : []
    if (rawItems.length === 0 || rawItems.length > 20) {
      return json({ error: "Danh sách sản phẩm không hợp lệ." }, 400, corsHeaders)
    }
    const items = rawItems.map((item) => {
      const row = item && typeof item === "object"
        ? item as Record<string, unknown>
        : {}
      return {
        productId: cleanText(row.productId, 120),
        productName: cleanText(row.productName, 200),
        quantity: Math.max(1, Math.min(99, Math.floor(Number(row.quantity) || 1))),
        price: cleanText(row.price, 100),
      }
    })
    if (items.some((item) => !item.productId || !item.productName || !item.price)) {
      return json({ error: "Danh sách sản phẩm không hợp lệ." }, 400, corsHeaders)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase server credentials are not configured.")
      return json({ error: "Hệ thống lưu đơn hàng chưa sẵn sàng." }, 500, corsHeaders)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: insertError } = await adminClient.from("orders").insert({
      order_id: orderId,
      order_date_display: createdAt,
      customer_name: customerName,
      customer_phone: cleanPhone,
      customer_email: customerEmail,
      customer_address: customerAddress,
      customer_note: customerNote,
      products,
      total_amount: totalAmount,
      total_numeric: totalNumeric,
      items,
    })

    if (insertError) {
      console.error("Order database insert failed:", insertError.code)
      return json(
        { error: "Chưa thể lưu đơn hàng. Vui lòng thử lại." },
        insertError.code === "23505" ? 409 : 500,
        corsHeaders,
      )
    }

    const webhookUrl = Deno.env.get("ORDER_WEBHOOK_URL")
    const webhookSecret = Deno.env.get("ORDER_WEBHOOK_SECRET")
    let sheetSynced = false
    let sheetSyncStatus: "pending" | "synced" | "failed" = "pending"
    let sheetSyncError = "Chưa cấu hình Google Apps Script webhook."

    if (webhookUrl && webhookSecret) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            orderId,
            createdAt,
            customerName,
            customerPhone: cleanPhone,
            customerEmail,
            customerAddress,
            customerNote,
            products,
            totalAmount,
            totalNumeric,
            items,
            webhookToken: webhookSecret,
          }),
        })
        const responseBody = await response.json().catch(() => null) as
          | { status?: string, message?: string }
          | null
        sheetSynced = response.ok && responseBody?.status === "success"
        sheetSyncStatus = sheetSynced ? "synced" : "failed"
        sheetSyncError = sheetSynced
          ? ""
          : responseBody?.message || `Google Apps Script trả về HTTP ${response.status}.`
      } catch (error) {
        sheetSyncStatus = "failed"
        sheetSyncError = error instanceof Error ? error.message : "Không thể kết nối Google Apps Script."
      }
    }

    const safeSyncError = sheetSyncError.slice(0, 500)
    const { error: syncUpdateError } = await adminClient
      .from("orders")
      .update({
        sheet_sync_status: sheetSyncStatus,
        sheet_synced_at: sheetSynced ? new Date().toISOString() : null,
        sheet_sync_error: sheetSynced ? null : safeSyncError,
      })
      .eq("order_id", orderId)
    if (syncUpdateError) console.warn("Order sync status update failed")

    return json(
      {
        success: true,
        message: "Đơn hàng đã được tiếp nhận thành công.",
        orderId,
        sheetSynced,
        sheetSyncStatus,
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
