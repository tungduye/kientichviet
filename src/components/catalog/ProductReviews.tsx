import { useCallback, useEffect, useState, type FormEvent } from "react"
import { supabase } from "../../integrations/supabase/client"

type ProductReview = {
  id: string
  product_id: string
  customer_name: string
  rating: number
  body: string
  created_at: string
}

const REVIEW_FIELDS = "id, product_id, customer_name, rating, body, created_at"

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden="true" className={index < rating ? "is-filled" : ""}>
          ★
        </span>
      ))}
    </span>
  )
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [submitError, setSubmitError] = useState("")

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    const { data, error } = await supabase
      .from("product_reviews")
      .select(REVIEW_FIELDS)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      setLoadError("Chưa tải được đánh giá. Anh/chị có thể thử tải lại.")
      setLoading(false)
      return
    }

    setReviews((data ?? []) as ProductReview[])
    setLoading(false)
  }, [productId])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitMessage("")
    setSubmitError("")

    const cleanName = customerName.trim()
    const cleanBody = body.trim()
    if (cleanName.length < 2 || cleanName.length > 60) {
      setSubmitError("Tên hiển thị cần có từ 2 đến 60 ký tự.")
      return
    }
    if (cleanBody.length < 10 || cleanBody.length > 1000) {
      setSubmitError("Nội dung cần có từ 10 đến 1.000 ký tự.")
      return
    }

    setSubmitting(true)
    let submitError: string | null = null
    try {
      const { error } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          customer_name: cleanName,
          rating,
          body: cleanBody,
        })
      submitError = error?.message ?? null
    } catch {
      submitError = "network"
    } finally {
      setSubmitting(false)
    }

    if (submitError) {
      setSubmitError("Chưa gửi được đánh giá. Vui lòng thử lại sau.")
      return
    }

    setCustomerName("")
    setRating(5)
    setBody("")
    setSubmitMessage("Đã nhận đánh giá. Nội dung sẽ hiển thị sau khi được duyệt.")
  }

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <section className="reviews section-pad" aria-labelledby="product-reviews-title">
      <div className="product-reviews-inner">
        <div className="section-heading product-reviews-heading">
          <p className="kicker">Đánh giá</p>
          <h2 id="product-reviews-title">Khách hàng nói gì</h2>
          <p>Chia sẻ trải nghiệm của anh/chị để những người yêu di sản cùng tham khảo.</p>
        </div>

        <div className="product-reviews-grid">
          <div className="product-reviews-feed" aria-live="polite">
            {loading ? (
              <div className="reviews-state" role="status">Đang tải đánh giá…</div>
            ) : loadError ? (
              <div className="reviews-state is-error" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={() => void loadReviews()}>
                  Tải lại
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <div className="reviews-state reviews-empty">
                <span className="reviews-empty-mark" aria-hidden="true">✦</span>
                <h3>Chưa có đánh giá</h3>
                <p>Hãy là người đầu tiên chia sẻ trải nghiệm của anh/chị.</p>
              </div>
            ) : (
              <>
                <div className="reviews-summary">
                  <strong>{averageRating.toFixed(1)}</strong>
                  <ReviewStars rating={Math.round(averageRating)} />
                  <span>{reviews.length} đánh giá</span>
                </div>
                <ul className="product-review-list">
                  {reviews.map((review) => (
                    <li className="product-review-card" key={review.id}>
                      <div className="product-review-meta">
                        <strong>{review.customer_name}</strong>
                        <time dateTime={review.created_at}>{formatReviewDate(review.created_at)}</time>
                      </div>
                      <ReviewStars rating={review.rating} />
                      <p>{review.body}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <form className="product-review-form" onSubmit={handleSubmit}>
            <div className="review-form-heading">
              <h3>Viết đánh giá</h3>
              <p>Đánh giá của anh/chị sẽ hiển thị công khai cùng sản phẩm.</p>
            </div>

            <fieldset className="review-rating-field">
              <legend>Mức độ hài lòng</legend>
              <div className="review-rating-input">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={rating === value}
                      aria-label={`${value} sao`}
                      className={value <= rating ? "is-active" : ""}
                      onClick={() => setRating(value)}
                    >
                      ★
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <label className="review-field">
              <span>Tên hiển thị</span>
              <input
                autoComplete="name"
                maxLength={60}
                minLength={2}
                required
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Tên của anh/chị"
              />
            </label>

            <label className="review-field">
              <span>Chia sẻ trải nghiệm</span>
              <textarea
                maxLength={1000}
                minLength={10}
                required
                rows={5}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Anh/chị thích điều gì ở mô hình này?"
              />
              <small>{body.length}/1.000 ký tự</small>
            </label>

            {submitError && <p className="review-form-error" role="alert">{submitError}</p>}
            {submitMessage && <p className="review-form-success" role="status">{submitMessage}</p>}

            <button className="review-submit-button" type="submit" disabled={submitting}>
              {submitting ? "Đang gửi…" : "Gửi đánh giá"}
            </button>
            <p className="review-form-note">Không nhập số điện thoại, email hoặc thông tin riêng tư vào phần bình luận.</p>
          </form>
        </div>
      </div>
    </section>
  )
}
