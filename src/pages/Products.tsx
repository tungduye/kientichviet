import { Icon, LinkButton } from "../components/Shared"

import { useCatalog } from "../context/CatalogContext"

import { Link } from "react-router-dom"
import { useSiteContent } from "../context/SiteContentContext"
import { isUpcomingProduct } from "../data/products"

export default function Products() {
  const { products } = useCatalog()
  const { text } = useSiteContent()

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
        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <article
                className={`product-card reveal ${
                  isUpcomingProduct(product) ? "is-upcoming" : ""
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
                      {isUpcomingProduct(product) ? (
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
                      {isUpcomingProduct(product) ? "Xem chi tiết" : "Khám phá"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state reveal">
            <p className="empty-state-text">
              Hiện chưa có sản phẩm đang hiển thị.
            </p>
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
