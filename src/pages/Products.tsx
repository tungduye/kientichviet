import { useState, useMemo } from "react"

import { Icon, LinkButton } from "../components/Shared"

import { useCatalog } from "../context/CatalogContext"

import { Link } from "react-router-dom"
import { useSiteContent } from "../context/SiteContentContext"

const THEME_CATEGORIES = [
  { value: "Tất cả", shortLabel: "Tất cả", dropdownLabel: "Chủ đề: Tất cả" },

  {
    value: "Hà Nội · Hồ Gươm",

    shortLabel: "Hồ Gươm",

    dropdownLabel: "Chủ đề: Hồ Gươm",
  },

  {
    value: "Hà Nội · Di sản Thăng Long",

    shortLabel: "Thăng Long",

    dropdownLabel: "Chủ đề: Thăng Long",
  },

  {
    value: "Hà Nội · Phố cổ Hà Nội",

    shortLabel: "Phố cổ",

    dropdownLabel: "Chủ đề: Phố cổ",
  },
]

export default function Products() {
  const { products } = useCatalog()
  const { text } = useSiteContent()
  const [searchTerm, setSearchTerm] = useState("")

  const [filterCategory, setFilterCategory] = useState("Tất cả")

  const [sortBy, setSortBy] = useState("Mặc định")

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Filter by category (eyebrow)

    if (filterCategory !== "Tất cả") {
      result = result.filter((p) => p.eyebrow === filterCategory)
    }

    // Filter by search

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase()

      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          (p.description &&
            p.description.toLowerCase().includes(lowerSearch)) ||
          (p.eyebrow && p.eyebrow.toLowerCase().includes(lowerSearch)),
      )
    }

    // Sort

    if (sortBy !== "Mặc định") {
      result.sort((a, b) => {
        if (sortBy === "Tên A-Z") return a.name.localeCompare(b.name)

        if (sortBy === "Tên Z-A") return b.name.localeCompare(a.name)

        const priceA = parseInt(a.price.replace(/\D/g, "")) || 0

        const priceB = parseInt(b.price.replace(/\D/g, "")) || 0

        if (sortBy === "Giá thấp đến cao") return priceA - priceB

        if (sortBy === "Giá cao đến thấp") return priceB - priceA

        return 0
      })
    }

    return result
  }, [products, searchTerm, filterCategory, sortBy])

  return (
    <>
      <section className="shop-hero">
        <div className="reveal">
          <p className="kicker">{text("products.kicker")}</p>
          <h1>{text("products.title")}</h1>
          <p className="hero-description">{text("products.body")}</p>
        </div>
        <div className="shop-hero-stats reveal">
          <div className="hero-stat-card">
            <span className="stat-index">01</span>
            <div className="stat-info">
              <strong>Tự tay lắp ghép</strong>
              <span>Gỗ tự nhiên · Cắt mộng chuẩn xác</span>
            </div>
          </div>
          <div className="hero-stat-card">
            <span className="stat-index">02</span>
            <div className="stat-info">
              <strong>Trưng bày nghệ thuật</strong>
              <span>Dáng hình di sản · Điểm nhấn không gian</span>
            </div>
          </div>
          <div className="hero-stat-card">
            <span className="stat-index">03</span>
            <div className="stat-info">
              <strong>Chạm để khám phá</strong>
              <span>Kết nối NFC để nghe và tìm hiểu câu chuyện di sản.</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="products section-pad"
        id="products"
        style={{ paddingTop: 40 }}
      >
        <div className="shop-controls-bar">
          <div className="shop-controls-inner">
            <div className="shop-search">
              <input
                type="text"
                placeholder="Tìm kiếm tác phẩm di sản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  aria-label="Xóa tìm kiếm"
                >
                  <Icon name="close" size={16} />
                </button>
              ) : null}
            </div>

            <div className="shop-selects-row">
              <div className="shop-select-box">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  aria-label="Lọc theo chủ đề"
                >
                  {THEME_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.dropdownLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="shop-select-box">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sắp xếp"
                >
                  <option value="Mặc định">Sắp xếp: Mặc định</option>
                  <option value="Tên A-Z">Tên A-Z</option>
                  <option value="Tên Z-A">Tên Z-A</option>
                  <option value="Giá thấp đến cao">Giá: Thấp đến cao</option>
                  <option value="Giá cao đến thấp">Giá: Cao đến thấp</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {filteredAndSortedProducts.length > 0 ? (
          <div className="product-grid">
            {filteredAndSortedProducts.map((product) => (
              <article
                className={`product-card reveal ${
                  product.accent === "Sắp ra mắt" ? "is-upcoming" : ""
                }`}
                key={product.id}
                data-slug={product.slug}
              >
                <Link
                  to={`/products/${product.slug}`}
                  className="product-image"
                  aria-label={`Xem ${product.name}`}
                >
                  <img src={product.image} alt={product.name} />
                  <span className="product-number">{product.number}</span>
                  <span
                    className={`product-accent badge-${
                      product.accent === "Mới"
                        ? "new"
                        : product.accent === "Bán chạy"
                          ? "bestseller"
                          : "upcoming"
                    }`}
                  >
                    {product.accent}
                  </span>
                  <span className="product-view">
                    <Icon name="plus" /> Xem chi tiết
                  </span>
                </Link>
                <div className="product-info">
                  <div className="product-info-top">
                    <p className="product-eyebrow">{product.eyebrow}</p>
                    <h3 className="product-title">
                      <Link to={`/products/${product.slug}`}>
                        {product.name}
                        <span className="title-arrow" aria-hidden="true">
                          {" "}
                          →
                        </span>
                      </Link>
                    </h3>
                    {product.description && (
                      <p className="shop-desc">{product.description}</p>
                    )}
                    <div className="product-card-meta">
                      {product.specifications?.pieces ? (
                        <span>{product.specifications.pieces} mảnh</span>
                      ) : (
                        <span>Đang cập nhật</span>
                      )}
                      {product.specifications?.time && (
                        <>
                          <i>·</i>
                          <span>{product.specifications.time}</span>
                        </>
                      )}
                      <i>·</i>
                      <span>Chạm NFC</span>
                    </div>
                  </div>
                  <div className="product-price-row">
                    <div className="price-block">
                      {product.accent === "Sắp ra mắt" ? (
                        <>
                          <span className="price-label">Dự kiến</span>
                          <strong className="product-price">
                            {product.price}
                          </strong>
                        </>
                      ) : (
                        <strong className="product-price">
                          {product.price}
                        </strong>
                      )}
                    </div>
                    <Link
                      to={`/products/${product.slug}`}
                      className="product-inline-cta"
                      aria-label={`Xem chi tiết ${product.name}`}
                    >
                      {product.accent === "Sắp ra mắt"
                        ? "Xem chi tiết"
                        : "Khám phá"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state reveal">
            <p className="empty-state-text">
              Không tìm thấy tác phẩm di sản phù hợp với bộ lọc hiện tại.
            </p>
            <button
              onClick={() => {
                setSearchTerm("")

                setFilterCategory("Tất cả")

                setSortBy("Mặc định")
              }}
              className="button button-dark"
              style={{
                border: "none",

                cursor: "pointer",
              }}
            >
              <span>Xóa bộ lọc</span>
              <Icon name="close" />
            </button>
          </div>
        )}
      </section>

      <section className="statement reveal">
        <div className="statement-mark">“</div>
        <p>Mỗi mảnh ghép một dấu ấn,</p>
        <h2>mỗi mô hình một câu chuyện.</h2>
        <LinkButton href="/our-story">Câu chuyện thương hiệu</LinkButton>
      </section>
    </>
  )
}
