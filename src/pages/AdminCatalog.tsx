import { useEffect, useMemo, useState, type FormEvent } from "react"
import type { User } from "@supabase/supabase-js"

import { useCatalog } from "../context/CatalogContext"
import {
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
  previewImageUrl: string
  isVisible: boolean
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
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(item.previewImageUrl)
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPrice(item.price)
    setIsVisible(item.isVisible)
    setPreviewUrl(item.previewImageUrl)
    setFile(null)
  }, [item])

  useEffect(() => {
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const handleFileChange = (selectedFile?: File) => {
    if (!selectedFile) {
      setFile(null)
      setPreviewUrl(item.previewImageUrl)
      setStatus("")
      return
    }

    const validationError = validateProductImage(selectedFile)
    if (validationError) {
      setFile(null)
      setPreviewUrl(item.previewImageUrl)
      setStatus(validationError)
      return
    }

    setStatus("")
    setFile(selectedFile)
  }

  const handleSave = async () => {
    const normalizedPrice = price.trim()
    if (!normalizedPrice) {
      setStatus("Giá không được để trống.")
      return
    }

    setSaving(true)
    setStatus("")

    try {
      let imageUrl = item.imageUrl || null

      if (file) {
        const formData = new FormData()
        formData.append("productKey", item.key)
        formData.append("image", file)
        formData.append("price", normalizedPrice)
        formData.append("isVisible", String(isVisible))
        const { data: uploadData, error: uploadError } =
          await supabase.functions.invoke("upload-product-image", {
            body: formData,
          })

        if (uploadError) throw uploadError
        if (!uploadData?.publicUrl)
          throw new Error("Upload không trả về URL ảnh.")
        imageUrl = uploadData.publicUrl
      } else {
        const { error: updateError } = await supabase
          .from("product_catalog_settings")
          .update({
            price: normalizedPrice,
            image_url: imageUrl,
            is_visible: isVisible,
          })
          .eq("product_key", item.key)
          .select("product_key")
          .single()

        if (updateError) throw updateError
      }

      await onSaved()
      setFile(null)
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
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
          <span>JPG, PNG hoặc WebP — tối đa 5 MB</span>
        </label>

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
  const [activeTab, setActiveTab] = useState<"products" | "content" | "ar">("products")

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
        previewImageUrl: product.image,
        isVisible: productSetting?.isVisible ?? false,
      }
      const variantItems = getVariants(product, true).map((variant) => ({
        key: `${product.id}-${variant.id}`,
        title: `${product.name} · ${variant.name}`,
        subtitle: variant.finish,
        price: variant.price,
        imageUrl: variant.imageUrl || null,
        previewImageUrl: variant.imageUrl || product.image,
        isVisible: variant.isVisible,
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
        <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>Sản phẩm</button>
        <button className={activeTab === "content" ? "active" : ""} onClick={() => setActiveTab("content")}>Nội dung website</button>
        <button className={activeTab === "ar" ? "active" : ""} onClick={() => setActiveTab("ar")}>Web AR</button>
      </nav>

      {activeTab === "products" && error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {activeTab === "products" && (loading ? (
        <p>Đang tải danh mục…</p>
      ) : (
        <section className="admin-product-grid" aria-label="Danh mục sản phẩm">
          {editorItems.map((item) => (
            <CatalogEditorCard key={item.key} item={item} onSaved={refresh} />
          ))}
        </section>
      ))}
      {activeTab === "content" && <AdminContentEditor user={user} />}
      {activeTab === "ar" && <AdminArEditor />}
    </main>
  )
}
