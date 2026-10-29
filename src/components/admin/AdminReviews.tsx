import { useCallback, useEffect, useState } from "react"

import { supabase } from "../../integrations/supabase/client"

type ReviewRow = {
  id: string
  product_id: string
  customer_name: string
  rating: number
  body: string
  is_visible: boolean
  created_at: string
}

const PRODUCT_NAMES: Record<string, string> = {
  p1: "Tháp Rùa",
  p2: "Chùa Một Cột",
  p3: "Phố Hàng Trống",
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError("")
    const { data, error: loadError } = await supabase
      .from("product_reviews")
      .select("id, product_id, customer_name, rating, body, is_visible, created_at")
      .order("created_at", { ascending: false })
      .limit(100)

    if (loadError) {
      setError("Chưa tải được đánh giá. Kiểm tra migration rồi thử lại.")
    } else {
      setReviews((data ?? []) as ReviewRow[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  const setVisibility = async (review: ReviewRow) => {
    setPendingId(review.id)
    setStatus("")
    setError("")
    const { error: updateError } = await supabase
      .from("product_reviews")
      .update({ is_visible: !review.is_visible })
      .eq("id", review.id)

    if (updateError) {
      setError("Không thể cập nhật trạng thái đánh giá.")
    } else {
      setReviews((current) => current.map((item) =>
        item.id === review.id ? { ...item, is_visible: !item.is_visible } : item,
      ))
      setStatus(review.is_visible ? "Đã ẩn đánh giá." : "Đã duyệt và hiển thị đánh giá.")
    }
    setPendingId(null)
  }

  return (
    <section className="admin-reviews" aria-labelledby="admin-reviews-title">
      <header className="admin-reviews-heading">
        <div>
          <p className="admin-kicker">Nội dung khách gửi</p>
          <h2 id="admin-reviews-title">Quản lý đánh giá</h2>
          <p>Đánh giá mới chờ duyệt trước khi xuất hiện công khai.</p>
        </div>
        <button type="button" onClick={() => void loadReviews()} disabled={loading}>
          {loading ? "Đang tải…" : "Tải lại"}
        </button>
      </header>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {status && <p className="admin-review-status" role="status">{status}</p>}
      {loading ? <p>Đang tải đánh giá…</p> : reviews.length === 0 ? (
        <p className="admin-review-empty">Chưa có đánh giá nào.</p>
      ) : (
        <div className="admin-review-list">
          {reviews.map((review) => (
            <article className="admin-review-card" key={review.id}>
              <div className="admin-review-meta">
                <strong>{review.customer_name}</strong>
                <span>{PRODUCT_NAMES[review.product_id] ?? review.product_id}</span>
                <span>{review.rating}/5 ★</span>
                <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString("vi-VN")}</time>
              </div>
              <p>{review.body}</p>
              <div className="admin-review-actions">
                <span className={review.is_visible ? "is-published" : "is-pending"}>
                  {review.is_visible ? "Đang hiển thị" : "Chờ duyệt"}
                </span>
                <button type="button" disabled={pendingId === review.id} onClick={() => void setVisibility(review)}>
                  {pendingId === review.id ? "Đang lưu…" : review.is_visible ? "Ẩn đánh giá" : "Duyệt và hiển thị"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
