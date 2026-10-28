import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import {
  getCorsHeaders,
  isAllowedOrigin,
} from "../heritage-chat/requestGuards.ts"
import { validateRasterImage } from "./imageValidation.ts"

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  })
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const authorization = req.headers.get("authorization") || ""
  const accessToken = authorization.replace(/^Bearer\s+/i, "")

  if (!supabaseUrl || !serviceRoleKey || !accessToken) {
    return json({ error: "Chưa xác thực quản trị." }, 401, corsHeaders)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: authData, error: authError } =
    await adminClient.auth.getUser(accessToken)

  if (authError || !authData.user) {
    return json({ error: "Phiên quản trị không hợp lệ." }, 401, corsHeaders)
  }

  const { data: membership } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", authData.user.id)
    .maybeSingle()

  if (!membership) {
    return json({ error: "Tài khoản không có quyền quản trị." }, 403, corsHeaders)
  }

  try {
    const formData = await req.formData()
    const productKey = formData.get("productKey")
    const image = formData.get("image")
    const price = formData.get("price")
    const visibilityValue = formData.get("isVisible")

    if (
      typeof productKey !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productKey) ||
      !(image instanceof File) ||
      typeof price !== "string" ||
      !price.trim() ||
      price.trim().length > 50 ||
      (visibilityValue !== "true" && visibilityValue !== "false")
    ) {
      return json({ error: "Dữ liệu upload không hợp lệ." }, 400, corsHeaders)
    }

    const { data: catalogRow } = await adminClient
      .from("product_catalog_settings")
      .select("product_key")
      .eq("product_key", productKey)
      .maybeSingle()

    if (!catalogRow) {
      return json({ error: "Sản phẩm không tồn tại." }, 404, corsHeaders)
    }

    const bytes = new Uint8Array(await image.arrayBuffer())
    const validation = validateRasterImage(bytes)
    if (validation.ok === false) {
      return json({ error: validation.error }, 400, corsHeaders)
    }

    const objectPath = `catalog/${productKey}/${crypto.randomUUID()}`
    const { error: uploadError } = await adminClient.storage
      .from("product-images")
      .upload(objectPath, bytes, {
        cacheControl: "3600",
        contentType: validation.mimeType,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const publicUrl = adminClient.storage
      .from("product-images")
      .getPublicUrl(objectPath).data.publicUrl
    const versionedPublicUrl = `${publicUrl}?v=${Date.now()}`

    const { data: updatedRow, error: updateError } = await adminClient
      .from("product_catalog_settings")
      .update({
        price: price.trim(),
        image_url: versionedPublicUrl,
        is_visible: visibilityValue === "true",
      })
      .eq("product_key", productKey)
      .select("product_key")
      .single()

    if (updateError || !updatedRow) {
      await adminClient.storage.from("product-images").remove([objectPath])
      throw updateError || new Error("Catalog row was not updated")
    }

    const folderPath = `catalog/${productKey}`
    const graceCutoff = Date.now() - 24 * 60 * 60 * 1000
    const { data: existingObjects } = await adminClient.storage
      .from("product-images")
      .list(folderPath, { limit: 100 })
    const staleObjectPaths = (existingObjects ?? [])
      .filter((object) => {
        const createdAt = object.created_at
          ? new Date(object.created_at).getTime()
          : Number.NaN
        return (
          `${folderPath}/${object.name}` !== objectPath &&
          Number.isFinite(createdAt) &&
          createdAt < graceCutoff
        )
      })
      .map((object) => `${folderPath}/${object.name}`)

    if (staleObjectPaths.length) {
      const { error: cleanupError } = await adminClient.storage
        .from("product-images")
        .remove(staleObjectPaths)
      if (cleanupError) console.warn("Old product image cleanup failed")
    }

    return json(
      { publicUrl: versionedPublicUrl },
      200,
      corsHeaders,
    )
  } catch (error) {
    console.error("Product image upload failed", error)
    return json({ error: "Không thể xử lý ảnh sản phẩm." }, 500, corsHeaders)
  }
})
