import { useState, type FormEvent } from "react"
import { Icon, Logo } from "../Shared"
import { Link } from "react-router-dom"
import { toast } from "../Motion"
import { useSiteContent } from "../../context/SiteContentContext"
import { supabase } from "../../integrations/supabase/client"

export default function Footer() {
  const { text } = useSiteContent()
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subscribeError, setSubscribeError] = useState("")

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = newsletterEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast("Vui lòng nhập địa chỉ email hợp lệ.")
      return
    }
    setIsSubmitting(true)
    setSubscribeError("")
    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert({ email })

      if (error && error.code !== "23505") {
        setSubscribeError("Chưa lưu được email. Anh/chị vui lòng thử lại sau.")
        return
      }

      setIsSubscribed(true)
      toast(error ? "Email này đã đăng ký nhận tin rồi." : "Cảm ơn anh/chị đã đăng ký nhận tin!")
      setNewsletterEmail("")
    } catch {
      setSubscribeError("Chưa kết nối được máy chủ. Anh/chị vui lòng thử lại sau.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer>
      <div className="footer-top reveal">
        <div className="footer-brand">
          <Logo light />
          <p className="footer-tagline">{text("footer.tagline")}</p>
        </div>
        <div className="footer-links">
          <div>
            <strong>Khám phá</strong>
            <Link to="/our-story">Về chúng tôi</Link>
            <Link to="/products">{text("nav.products")}</Link>
            <Link to="/heritage">{text("nav.heritage")}</Link>
          </div>
          <div>
            <strong>Kết nối</strong>
            <a
              href="https://www.facebook.com/kientichviet.official"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              href="https://www.tiktok.com/@kientichviet.official?_r=1&_t=ZS-9AJ4MAhHC69"
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTok
            </a>
          </div>
          <div>
            <strong>Liên hệ</strong>
            <span>Hotline: {text("footer.phone")}</span>
            <span className="footer-email">Email: {text("footer.email")}</span>
            <span>Địa chỉ: {text("footer.address")}</span>
          </div>
        </div>
        <div className="newsletter">
          <strong>Nhận những câu chuyện mới</strong>
          <p>Đăng ký để không bỏ lỡ sản phẩm và hành trình di sản tiếp theo.</p>
          {isSubscribed ? (
            <div
              style={{
                marginTop: "20px",
                color: "var(--gold)",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Icon name="sparkle" size={16} /> Đã ghi nhận đăng ký của bạn.
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubscribe(event)} autoComplete="off">
              <input
                aria-label="Email của bạn"
                placeholder="Email của bạn"
                type="email"
                name="ktv_newsletter_email"
                id="ktv_newsletter_email"
                autoComplete="off"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button aria-label="Đăng ký" type="submit" disabled={isSubmitting}>
                <Icon name="arrow" />
              </button>
            </form>
          )}
          {subscribeError && <p className="newsletter-error" role="alert">{subscribeError}</p>}
        </div>
      </div>
      <div className="footer-bottom reveal">
        <span>© 2026 Kiến Tích Việt</span>
        <span>Kiến tạo · Lưu giữ · Kết nối</span>
        <span>Ảnh: Unsplash</span>
      </div>
    </footer>
  )
}
