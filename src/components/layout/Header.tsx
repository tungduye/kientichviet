import { useEffect, useRef, useState } from "react"

import { Icon, Logo } from "../Shared"

import { useCart } from "../../context/CartContext"

import { Link, useLocation } from "react-router-dom"
import { useSiteContent } from "../../context/SiteContentContext"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const { cartCount, setCartOpen } = useCart()
  const { text } = useSiteContent()
  const location = useLocation()
  const isHome = location.pathname === "/"
  const isHeritage = location.pathname.startsWith("/heritage")

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Tự động đóng menu khi chuyển đường dẫn (ví dụ bấm nút Back/Forward)
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Tự động đóng menu khi chạm ra ngoài vùng Header, cuộn trang hoặc nhấn phím Esc
  useEffect(() => {
    if (!menuOpen) return

    const initialScrollY = window.scrollY

    const handlePointerDownOutside = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    const handleScrollClose = () => {
      if (Math.abs(window.scrollY - initialScrollY) > 25) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDownOutside)
    window.addEventListener("scroll", handleScrollClose, { passive: true })
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside)
      window.removeEventListener("scroll", handleScrollClose)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [menuOpen])

  const isHeroTheme = (isHome || isHeritage) && !scrolled
  const isDarkHeritageScrolled = isHeritage && scrolled

  return (
    <header
      ref={headerRef}
      className={`site-header ${isHeroTheme ? "is-hero-theme" : ""} ${
        isDarkHeritageScrolled ? "is-dark-theme" : ""
      }`}
    >
      <Logo
        horizontal
        light={isHeroTheme || isDarkHeritageScrolled}
        onClick={() => setMenuOpen(false)}
      />
      <nav
        className={`main-nav ${menuOpen ? "is-open" : ""}`}
        aria-label="Điều hướng chính"
      >
        <Link
          to="/"
          className={location.pathname === "/" ? "active" : ""}
          onClick={(e) => {
            setMenuOpen(false)
            if (location.pathname === "/") {
              e.preventDefault()
              if (window.location.hash) {
                window.history.pushState(null, "", "/")
              }
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          }}
        >
          {text("nav.home")}
        </Link>
        <Link
          to="/our-story"
          className={location.pathname.startsWith("/our-story") ? "active" : ""}
          onClick={() => setMenuOpen(false)}
        >
          {text("nav.story")}
        </Link>
        <Link
          to="/products"
          className={location.pathname.startsWith("/products") ? "active" : ""}
          onClick={() => setMenuOpen(false)}
        >
          {text("nav.products")}
        </Link>
        <Link
          to="/heritage"
          className={location.pathname.startsWith("/heritage") ? "active" : ""}
          onClick={(e) => {
            setMenuOpen(false)
            if (location.pathname.startsWith("/heritage")) {
              if (window.location.hash) {
                window.history.pushState(null, "", "/heritage")
              }
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
          }}
        >
          {text("nav.heritage")}
        </Link>
      </nav>
      <div className="header-actions">
        <button
          className="cart-button"
          onClick={() => {
            setMenuOpen(false)
            setCartOpen(true)
          }}
          aria-label="Mở giỏ hàng"
        >
          <Icon name="bag" size={22} />
          <span className="cart-label">Giỏ hàng</span>
          <span className="cart-count">{cartCount}</span>
        </button>
        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={24} />
        </button>
      </div>
    </header>
  )
}
