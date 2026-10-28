import { useEffect, useMemo, useState, type FormEvent } from "react"
import type { User } from "@supabase/supabase-js"

import { useCatalog } from "../context/CatalogContext"
import {
  MAX_PRODUCT_GALLERY_IMAGES,
  moveGalleryImageToFront,
  validateProductImage,
  type CatalogVariant,
} from "../features/catalog/catalog"
import { supabase } from "../integrations/supabase/client"
import AdminContentEditor from "../components/admin/AdminContentEditor"
import AdminArEditor from "../components/admin/AdminArEditor"

interface EditorItem {
  key: string
  title: string
  subtitle: string
  price: string
  imageUrl: string | null
  imageUrls: string[]
  previewImageUrl: string
  isVisible: boolean
  revision: number
  variant?: CatalogVariant
}

function CatalogEditorCard({
  item,
  onSaved,
}: {
  item: EditorItem
  onSaved: () => Promise<void>
}) {
  const [price, setPrice] = useState(item.price)
  const [isVisible, setIsVisible] = useState(item.isVisible)
  const [files, setFiles] = useState<File[]>([])
  const [galleryUrls, setGalleryUrls] = useState(item.imageUrls)
  const [pendingPreviewUrls, setPendingPreviewUrls] = useState<string[]>([])
  const [newFilesFirst, setNewFilesFirst] = useState(false)
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPrice(item.price)
    setIsVisible(item.isVisible)
    setGalleryUrls(item.imageUrls)
    setFiles([])
    setNewFilesFirst(false)
  }, [item])

  useEffect(() => {
    const objectUrls = files.map((file) => URL.createObjectURL(file))
    setPendingPreviewUrls(objectUrls)
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [files])

  const handleFileChange = (selectedFiles: File[]) => {
    if (!selectedFiles.length) return
    const validationError = selectedFiles
      .map(validateProductImage)
      .find(Boolean)
    if (validationError) {
      setStatus(validationError)
      return
    }
    if (
      galleryUrls.length + files.length + selectedFiles.length >
      MAX_PRODUCT_GALLERY_IMAGES
    ) {
      setStatus(
        `Mỗi dòng sản phẩm chỉ lưu tối đa ${MAX_PRODUCT_GALLERY_IMAGES} ảnh.`,
      )
      return
    }

    setStatus("")
    setFiles((current) => [...current, ...selectedFiles])
  }

  const previewUrl = newFilesFirst
    ? pendingPreviewUrls[0] || galleryUrls[0] || item.previewImageUrl
    : galleryUrls[0] || pendingPreviewUrls[0] || item.previewImageUrl

  const handleSave = async () => {
    const normalizedPrice = price.trim()
    if (!normalizedPrice) {
      setStatus("Giá không được để trống.")
      return
    }

    setSaving(true)
    setStatus("")

    try {
      const formData = new FormData()
      formData.append("productKey", item.key)
      formData.append("price", normalizedPrice)
      formData.append("isVisible", String(isVisible))
      formData.append("imageUrls", JSON.stringify(galleryUrls))
      formData.append("newFilesFirst", String(newFilesFirst))
      formData.append("expectedRevision", String(item.revision))
      files.forEach((image) => formData.append("images", image))
      const { data: uploadData, error: uploadError } =
        await supabase.functions.invoke("upload-product-image", {
          body: formData,
        })

      if (uploadError) {
        let detail = uploadError.message
        if ("context" in uploadError) {
          try {
            const payload = await (uploadError as {
              context: Response
            }).context.json()
            if (payload?.error) detail = payload.error
          } catch {
            // Keep the Supabase client error when the response is not JSON.
          }
        }
        throw new Error(detail)
      }
      if (!Array.isArray(uploadData?.imageUrls))
        throw new Error("Upload không trả về thư viện ảnh.")

      await onSaved()
      setFiles([])
      setNewFilesFirst(false)
      setStatus("Đã lưu thay đổi.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi không xác định"
      setStatus(`Không thể lưu: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className={`admin-product-card ${isVisible ? "" : "is-hidden"}`}>
      <div className="admin-product-image">
        {previewUrl ? (
          <img src={previewUrl} alt={`Xem trước ${item.title}`} />
        ) : (
          <span>Chưa có ảnh</span>
        )}
      </div>
      <div className="admin-product-fields">
        <div>
          <small>{item.subtitle}</small>
          <h2>{item.title}</h2>
        </div>

        <label>
          Giá hiển thị
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            maxLength={50}
            placeholder="Ví dụ: 820.000 ₫ hoặc Liên hệ"
          />
        </label>

        <label className="admin-file-field">
          Ảnh sản phẩm
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              handleFileChange(Array.from(event.target.files ?? []))
              event.target.value = ""
            }}
          />
          <span>Chọn nhiều JPG, PNG hoặc WebP — tối đa 5 MB/ảnh, 8 ảnh</span>
        </label>

        {(galleryUrls.length > 0 || pendingPreviewUrls.length > 0) && (
          <div
            className="admin-gallery"
            aria-label={`Thư viện ảnh ${item.title}`}
          >
            {galleryUrls.map((url, index) => (
              <div
                className={index === 0 && !newFilesFirst ? "is-cover" : ""}
                key={url}
              >
                <button
                  type="button"
                  className="admin-gallery-image"
                  onClick={() => {
                    setGalleryUrls((current) =>
                      moveGalleryImageToFront(current, index),
                    )
                    setNewFilesFirst(false)
                  }}
                  aria-label={`Đặt ảnh ${index + 1} làm ảnh đại diện`}
                >
                  <img src={url} alt="" />
                </button>
                <button
                  type="button"
                  className="admin-gallery-remove"
                  onClick={() =>
                    setGalleryUrls((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  aria-label={`Xóa ảnh ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
            {pendingPreviewUrls.map((url, index) => (
              <div
                className={index === 0 && newFilesFirst ? "is-cover" : ""}
                key={url}
              >
                <button
                  type="button"
                  className="admin-gallery-image"
                  onClick={() => {
                    setFiles((current) =>
                      moveGalleryImageToFront(current, index),
                    )
                    setNewFilesFirst(true)
                  }}
                  aria-label={`Đặt ảnh mới ${index + 1} làm ảnh đại diện`}
                >
                  <img src={url} alt="" />
                </button>
                <button
                  type="button"
                  className="admin-gallery-remove"
                  onClick={() =>
                    setFiles((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  aria-label={`Bỏ ảnh mới ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <small className="admin-gallery-hint">
          Bấm ảnh để đặt làm ảnh đại diện. Dấu × chỉ có hiệu lực sau khi lưu.
        </small>

        <label className="admin-visibility-field">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(event) => setIsVisible(event.target.checked)}
          />
          <span>
            {isVisible ? "Đang hiển thị với khách" : "Đang ẩn với khách"}
          </span>
        </label>

        <div className="admin-card-actions">
          <button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
          {status && <p role="status">{status}</p>}
        </div>
      </div>
    </article>
  )
}

function AdminLogin({ onSignedIn }: { onSignedIn: (user: User) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus("")

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error || !data.user) {
      setStatus("Email hoặc mật khẩu không đúng.")
    } else {
      onSignedIn(data.user)
    }

    setSubmitting(false)
  }

  return (
    <main className="admin-shell admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <p className="admin-kicker">Khu vực nội bộ</p>
        <h1>Quản trị sản phẩm</h1>
        <p>Trang này không xuất hiện trên website khách hàng.</p>
        <label>
          Email quản trị
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
        {status && (
          <p className="admin-error" role="alert">
            {status}
          </p>
        )}
      </form>
    </main>
  )
}

export default function AdminCatalog() {
  const { adminProducts, settings, getVariants, refresh, loading, error } =
    useCatalog()
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [accessStatus, setAccessStatus] = useState("")
  const [activeTab, setActiveTab] = useState<"products" | "content" | "ar">(
    "products",
  )

  const verifyAdmin = async (nextUser: User | null) => {
    setUser(nextUser)
    setIsAdmin(false)

    if (!nextUser) {
      setCheckingSession(false)
      return
    }

    const { data, error: membershipError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", nextUser.id)
      .maybeSingle()

    if (membershipError || !data) {
      setAccessStatus(
        "Tài khoản này chưa được cấp quyền quản trị hoặc migration chưa được chạy.",
      )
    } else {
      setIsAdmin(true)
      setAccessStatus("")
      await refresh()
    }

    setCheckingSession(false)
  }

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      void verifyAdmin(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        window.setTimeout(() => {
          void verifyAdmin(session?.user ?? null)
        }, 0)
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const editorItems = useMemo<EditorItem[]>(() => {
    return adminProducts.flatMap((product) => {
      const productSetting = settings.find(
        (setting) => setting.productKey === product.id,
      )
      const productItem: EditorItem = {
        key: product.id,
        title: product.name,
        subtitle: "Sản phẩm chính",
        price: product.price,
        imageUrl: productSetting?.imageUrl ?? null,
        imageUrls: productSetting?.imageUrls ?? [],
        previewImageUrl: product.image,
        isVisible: productSetting?.isVisible ?? false,
        revision: productSetting?.revision ?? 0,
      }
      const variantItems = getVariants(product, true).map((variant) => ({
        key: `${product.id}-${variant.id}`,
        title: `${product.name} · ${variant.name}`,
        subtitle: variant.finish,
        price: variant.price,
        imageUrl: variant.imageUrl || null,
        imageUrls: variant.imageUrls,
        previewImageUrl: variant.imageUrl || product.image,
        isVisible: variant.isVisible,
        revision:
          settings.find(
            (setting) => setting.productKey === `${product.id}-${variant.id}`,
          )?.revision ?? 0,
        variant,
      }))

      return [productItem, ...variantItems]
    })
  }, [adminProducts, settings, getVariants])

  if (checkingSession) {
    return (
      <main className="admin-shell admin-state">
        Đang kiểm tra phiên đăng nhập…
      </main>
    )
  }

  if (!user) {
    return <AdminLogin onSignedIn={(nextUser) => void verifyAdmin(nextUser)} />
  }

  if (!isAdmin) {
    return (
      <main className="admin-shell admin-state">
        <h1>Chưa có quyền quản trị</h1>
        <p>{accessStatus}</p>
        <button type="button" onClick={() => void supabase.auth.signOut()}>
          Đăng xuất
        </button>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Kiến Tích Việt</p>
          <h1>Quản trị website</h1>
          <p>Sản phẩm, nội dung trang khách và trải nghiệm Web AR.</p>
        </div>
        <div className="admin-header-actions">
          <a href="/" target="_blank" rel="noreferrer">
            Xem trang khách
          </a>
          <button type="button" onClick={() => void supabase.auth.signOut()}>
            Đăng xuất
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Chức năng quản trị">
        <button
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          Sản phẩm
        </button>
        <button
          className={activeTab === "content" ? "active" : ""}
          onClick={() => setActiveTab("content")}
        >
          Nội dung website
        </button>
        <button
          className={activeTab === "ar" ? "active" : ""}
          onClick={() => setActiveTab("ar")}
        >
          Web AR
        </button>
      </nav>

      {activeTab === "products" && error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {activeTab === "products" &&
        (loading ? (
          <p>Đang tải danh mục…</p>
        ) : (
          <section
            className="admin-product-grid"
            aria-label="Danh mục sản phẩm"
          >
            {editorItems.map((item) => (
              <CatalogEditorCard
                key={item.key}
                item={item}
                onSaved={() => refresh(false)}
              />
            ))}
          </section>
        ))}
      {activeTab === "content" && <AdminContentEditor user={user} />}
      {activeTab === "ar" && <AdminArEditor />}
    </main>
  )
}
