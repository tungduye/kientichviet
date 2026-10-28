import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import {
  getCorsHeaders,
  isAllowedOrigin,
} from "../heritage-chat/requestGuards.ts"
import { validateRasterImage } from "./imageValidation.ts"
import {
  MAX_GALLERY_IMAGES,
  mergeGalleryUrls,
  parseExpectedRevision,
  parseTrustedGalleryUrls,
  storagePathFromPublicUrl,
} from "./galleryValidation.ts"

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  const allowedPreviewOrigins = Deno.env.get("ALLOWED_PREVIEW_ORIGINS") || ""
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
    return json(
      { error: "Tài khoản không có quyền quản trị." },
      403,
      corsHeaders,
    )
  }

  try {
    const formData = await req.formData()
    const productKey = formData.get("productKey")
    const price = formData.get("price")
    const visibilityValue = formData.get("isVisible")
    const newFilesFirstValue = formData.get("newFilesFirst")
    const expectedRevision = parseExpectedRevision(
      formData.get("expectedRevision"),
    )
    const images = [
      ...formData.getAll("images"),
      ...formData.getAll("image"),
    ].filter((entry): entry is File => entry instanceof File && entry.size > 0)

    if (
      typeof productKey !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productKey) ||
      typeof price !== "string" ||
      !price.trim() ||
      price.trim().length > 50 ||
      expectedRevision === null ||
      (visibilityValue !== "true" && visibilityValue !== "false") ||
      (newFilesFirstValue !== null &&
        newFilesFirstValue !== "true" &&
        newFilesFirstValue !== "false") ||
      images.length > MAX_GALLERY_IMAGES
    ) {
      return json({ error: "Dữ liệu upload không hợp lệ." }, 400, corsHeaders)
    }

    const publicPrefix = `${supabaseUrl}/storage/v1/object/public/product-images/`
    let retainedImageUrls: string[]
    try {
      retainedImageUrls = parseTrustedGalleryUrls(
        formData.get("imageUrls"),
        publicPrefix,
      )
    } catch (error) {
      return json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Danh sách ảnh không hợp lệ.",
        },
        400,
        corsHeaders,
      )
    }

    const { data: catalogRow } = await adminClient
      .from("product_catalog_settings")
      .select("product_key, image_url, image_urls, revision")
      .eq("product_key", productKey)
      .maybeSingle()

    if (!catalogRow) {
      return json({ error: "Sản phẩm không tồn tại." }, 404, corsHeaders)
    }

    const storedImageUrls = catalogRow.image_urls?.length
      ? catalogRow.image_urls
      : catalogRow.image_url
        ? [catalogRow.image_url]
        : []
    if (retainedImageUrls.some((url) => !storedImageUrls.includes(url))) {
      return json({ error: "Danh sách ảnh không hợp lệ." }, 400, corsHeaders)
    }

    if (retainedImageUrls.length + images.length > MAX_GALLERY_IMAGES) {
      return json(
        {
          error: `Mỗi dòng sản phẩm chỉ lưu tối đa ${MAX_GALLERY_IMAGES} ảnh.`,
        },
        400,
        corsHeaders,
      )
    }

    const uploadedObjectPaths: string[] = []
    const uploadedImageUrls: string[] = []
    for (const image of images) {
      const bytes = new Uint8Array(await image.arrayBuffer())
      const validation = validateRasterImage(bytes)
      if (validation.ok === false) {
        if (uploadedObjectPaths.length)
          await adminClient.storage
            .from("product-images")
            .remove(uploadedObjectPaths)
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
      if (uploadError) {
        if (uploadedObjectPaths.length)
          await adminClient.storage
            .from("product-images")
            .remove(uploadedObjectPaths)
        throw uploadError
      }

      uploadedObjectPaths.push(objectPath)
      const publicUrl = adminClient.storage
        .from("product-images")
        .getPublicUrl(objectPath).data.publicUrl
      uploadedImageUrls.push(`${publicUrl}?v=${Date.now()}`)
    }

    const finalImageUrls =
      newFilesFirstValue === "true"
        ? mergeGalleryUrls(uploadedImageUrls, retainedImageUrls)
        : mergeGalleryUrls(retainedImageUrls, uploadedImageUrls)

    const { data: updatedRow, error: updateError } = await adminClient
      .from("product_catalog_settings")
      .update({
        price: price.trim(),
        image_url: finalImageUrls[0] ?? null,
        image_urls: finalImageUrls,
        revision: expectedRevision + 1,
        is_visible: visibilityValue === "true",
      })
      .eq("product_key", productKey)
      .eq("revision", expectedRevision)
      .select("product_key, revision")
      .maybeSingle()

    if (updateError) {
      if (uploadedObjectPaths.length)
        await adminClient.storage
          .from("product-images")
          .remove(uploadedObjectPaths)
      throw updateError
    }
    if (!updatedRow) {
      if (uploadedObjectPaths.length)
        await adminClient.storage
          .from("product-images")
          .remove(uploadedObjectPaths)
      return json(
        {
          error: "Dữ liệu đã thay đổi ở tab khác. Vui lòng tải lại và thử lại.",
        },
        409,
        corsHeaders,
      )
    }

    const removedObjectPaths = storedImageUrls
      .filter((url) => !finalImageUrls.includes(url))
      .map((url) => storagePathFromPublicUrl(url, publicPrefix, productKey))
      .filter((path): path is string => Boolean(path))
    if (removedObjectPaths.length) {
      const { error: cleanupError } = await adminClient.storage
        .from("product-images")
        .remove(removedObjectPaths)
      if (cleanupError) console.warn("Old product image cleanup failed")
    }

    return json(
      {
        publicUrl: finalImageUrls[0] ?? null,
        imageUrls: finalImageUrls,
        revision: updatedRow.revision,
      },
      200,
      corsHeaders,
    )
  } catch (error) {
    console.error("Product image upload failed", error)
    return json({ error: "Không thể xử lý ảnh sản phẩm." }, 500, corsHeaders)
  }
})
