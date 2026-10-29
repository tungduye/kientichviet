import { useParams, Link } from "react-router-dom"

import { useCatalog } from "../context/CatalogContext"

import { Icon, LinkButton } from "../components/Shared"

import { useCart } from "../context/CartContext"

import { useState, useRef, useEffect } from "react"

import { buildVariantProduct } from "../features/products/productVariants"
import { isUpcomingProduct } from "../data/products"
import ProductReviews from "../components/catalog/ProductReviews"

export default function ProductDetail() {
  const { products, findProduct, getVariants, loading: catalogLoading } =
    useCatalog()
  const { slug } = useParams<{ slug: string }>()

  const { addToCart } = useCart()

  const [playing, setPlaying] = useState(false)

  const [selectedVariantId, setSelectedVariantId] = useState("basic")
  const [galleryIndex, setGalleryIndex] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const product = findProduct(slug)

  const variants = product ? getVariants(product) : []

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? variants[0]

  const selectedProduct =
    product && selectedVariant
      ? buildVariantProduct(product, selectedVariant)
      : product
  const isProductUpcoming = product ? isUpcomingProduct(product) : false
  const galleryImages = selectedVariant
    ? selectedVariant.imageUrls.length
      ? selectedVariant.imageUrls
      : selectedVariant.imageMode === "placeholder"
        ? []
        : product?.imageUrls.length
          ? product.imageUrls
          : [selectedProduct?.image || product?.image].filter(
              Boolean,
            ) as string[]
    : product
      ? product.imageUrls.length
        ? product.imageUrls
        : [product.image]
      : []
  const activeGalleryImage = galleryImages[galleryIndex] ?? galleryImages[0]

  useEffect(() => {
    setPlaying(false)

    setSelectedVariantId("basic")

    if (audioRef.current) {
      audioRef.current.pause()

      audioRef.current.currentTime = 0
    }
  }, [slug])

  useEffect(() => {
    setGalleryIndex(0)
  }, [slug, selectedVariantId])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const handleTogglePlay = async () => {
    const audio = audioRef.current

    if (!audio) return

    if (playing) {
      audio.pause()

      setPlaying(false)
    } else {
      try {
        await audio.play()

        setPlaying(true)
      } catch (err) {
        console.error("Không thể phát âm thanh:", err)
      }
    }
  }

  if (!product && catalogLoading) {
    return (
      <main className="product-detail-loading" aria-busy="true" role="status">
        Đang tải thông tin sản phẩm…
      </main>
    )
  }

  if (!product) {
    return (
      <div
        style={{ paddingTop: "200px", textAlign: "center", minHeight: "60vh" }}
      >
        <h2>Sản phẩm không tồn tại</h2>
        <LinkButton href="/products">Quay lại bộ sưu tập</LinkButton>
      </div>
    )
  }

  return (
    <>
      <div className="product-detail-shell">
        <div
          className="product-modal product-detail-layout"
        >
          <div className="modal-image product-detail-gallery reveal">
            {selectedVariant?.imageMode === "placeholder" &&
            !activeGalleryImage ? (
              isProductUpcoming ? (
                <div className="upcoming-product-visual" role="img" aria-label="Chùa Một Cột — COMING SOON">
                  <img src={product.image} alt="" />
                  <span>COMING SOON</span>
                </div>
              ) : (
                <div
                  className="variant-image-placeholder"
                  role="img"
                  aria-label="Hình ảnh phiên bản Premium đang cập nhật"
                >
                  <Icon name="sparkle" size={34} />
                  <strong>Premium Mosaic</strong>
                  <span>Hình ảnh đang được hoàn thiện</span>
                </div>
              )
            ) : (
              <>
                <img
                  className={`reveal-image ${
                    selectedVariant?.imageMode === "monochrome" &&
                    !selectedVariant.imageUrl
                      ? "variant-image-monochrome"
                      : ""
                  } ${isProductUpcoming ? "variant-image-upcoming" : ""}`}
                  src={
                    activeGalleryImage || selectedProduct?.image || product.image
                  }
                  alt={`${product.name}${
                    selectedVariant ? ` phiên bản ${selectedVariant.name}` : ""
                  }`}
                />
                {isProductUpcoming && (
                  <span className="product-detail-coming-soon">COMING SOON</span>
                )}
              </>
            )}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-gallery-arrow is-previous"
                  onClick={() =>
                    setGalleryIndex(
                      (current) =>
                        (current - 1 + galleryImages.length) %
                        galleryImages.length,
                    )
                  }
                  aria-label="Xem ảnh trước"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="product-gallery-arrow is-next"
                  onClick={() =>
                    setGalleryIndex(
                      (current) => (current + 1) % galleryImages.length,
                    )
                  }
                  aria-label="Xem ảnh tiếp theo"
                >
                  ›
                </button>
                <div
                  className="product-gallery-dots"
                  aria-label="Chọn ảnh sản phẩm"
                >
                  {galleryImages.map((_, index) => (
                    <button
                      type="button"
                      className={index === galleryIndex ? "is-active" : ""}
                      onClick={() => setGalleryIndex(index)}
                      aria-label={`Xem ảnh ${index + 1}`}
                      aria-current={index === galleryIndex ? "true" : undefined}
                      key={index}
                    />
                  ))}
                </div>
              </>
            )}
            <span>Mô hình gỗ · Tỉ lệ 1:120</span>
          </div>
          <div className="modal-copy reveal stagger-1">
            <p className="kicker">{product.eyebrow}</p>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            {variants.length > 0 && (
              <div className="product-variant-picker">
                <div className="variant-picker-heading">
                  <strong>Chọn dòng sản phẩm</strong>
                  <span>{selectedVariant?.finish}</span>
                </div>
                <div
                  className="variant-options"
                  role="radiogroup"
                  aria-label={`Dòng sản phẩm ${product.name}`}
                >
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      role="radio"
                      aria-checked={selectedVariant?.id === variant.id}
                      className={
                        selectedVariant?.id === variant.id ? "is-selected" : ""
                      }
                      onClick={() => setSelectedVariantId(variant.id)}
                    >
                      <span>
                        <strong>{variant.name}</strong>
                        <small>{variant.finish}</small>
                      </span>
                      <b>{variant.price}</b>
                    </button>
                  ))}
                </div>
                <p className="variant-description">
                  {selectedVariant?.description}
                </p>
              </div>
            )}
            <div className="specs">
              <span>
                <small>Số mảnh</small>
                <strong>
                  {product.specifications.pieces
                    ? `${product.specifications.pieces} mảnh`
                    : "Đang cập nhật"}
                </strong>
              </span>
              <span>
                <small>Thời gian</small>
                <strong>
                  {product.specifications.time || "Đang cập nhật"}
                </strong>
              </span>
              <span>
                <small>Độ khó</small>
                <strong>{product.specifications.difficulty}</strong>
              </span>
            </div>
            <div style={{ marginTop: "20px" }}>
              <p>
                <small>Chất liệu:</small>{" "}
                <strong>{product.specifications.material}</strong>
              </p>
              <p>
                <small>Kích thước:</small>{" "}
                <strong>{product.specifications.size}</strong>
              </p>
              <p>
                <small>Trọng lượng:</small>{" "}
                <strong>{product.specifications.weight}</strong>
              </p>
              <p>
                <small>Đối tượng:</small>{" "}
                <strong>{product.specifications.audience}</strong>
              </p>
            </div>
            <div className="modal-buy" style={{ marginTop: "35px" }}>
              <strong>
                {isProductUpcoming
                  ? "Sắp ra mắt"
                  : selectedProduct?.price}
              </strong>
              <button
                type="button"
                disabled={isProductUpcoming}
                onClick={() => selectedProduct && addToCart(selectedProduct)}
              >
                <span>
                  {isProductUpcoming
                    ? "Chưa mở bán"
                    : selectedProduct?.price === "Liên hệ"
                      ? "Yêu cầu tư vấn"
                      : "Thêm vào giỏ"}
                </span>
                <Icon name="bag" />
              </button>
            </div>
            {product.modelUrl && (
              <Link className="product-ar-link" to={`/ar/${product.id}`}>
                <Icon name="phone" /> Mở camera trải nghiệm Web AR
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className="intro section-pad">
        <div className="section-heading reveal">
          <p className="kicker">Hành trình trải nghiệm</p>
          <h2>
            Khám phá
            <br />
            từng mảnh ghép.
          </h2>
        </div>
        <div className="steps">
          {[
            [
              "01",

              "Open",

              "Mở hộp",

              "Bắt đầu hành trình với những mảnh ghép gỗ được sắp xếp tinh tế.",
            ],

            [
              "02",

              "Build",

              "Lắp ghép",

              "Lắp từng mảnh gỗ, cảm nhận cấu trúc nguyên bản của di sản.",
            ],

            [
              "03",

              "Complete",

              "Hoàn thiện",

              "Hoàn thiện mô hình và biến nó thành một dấu tích đáng tự hào.",
            ],

            [
              "04",

              "Discover",

              "Khám phá",

              "Chạm NFC và khám phá câu chuyện phía sau di sản.",
            ],
          ].map(([number, en, title, text]) => (
            <article className="step-card reveal" key={number}>
              <span className="step-number">{number}</span>
              <div className="step-icon">
                <Icon
                  name={
                    number === "01"
                      ? "box"
                      : number === "02"
                        ? "cube"
                        : number === "03"
                          ? "sparkle"
                          : "nfc"
                  }
                  size={30}
                />
              </div>
              <p className="step-en">{en}</p>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="step-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="tech section-pad">
        <div className="tech-visual reveal">
          <div className="phone">
            <div className="phone-screen">
              <audio
                ref={audioRef}
                src={product.audioUrl || "/audio/thap-rua.mp3"}
                preload="none"
                onEnded={() => setPlaying(false)}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
              />
              <span className="phone-label">Kiến Tích Việt</span>
              <img src={product.image} alt={product.name} />
              <button
                type="button"
                className={`play-button ${playing ? "is-playing" : ""}`}
                onClick={handleTogglePlay}
                aria-label={playing ? "Tạm dừng audio" : "Phát audio"}
              >
                <Icon name={playing ? "close" : "play"} size={25} />
              </button>
              <div className="audio-copy">
                <small>{playing ? "Đang nghe" : "Thuyết minh Audio"}</small>
                <strong>
                  {product.audioTitle || `Sự tích ${product.name}`}
                </strong>
                <span className={`audio-wave ${playing ? "is-playing" : ""}`}>
                  {Array.from({ length: 17 }).map((_, index) => (
                    <i key={index} />
                  ))}
                </span>
              </div>
            </div>
          </div>
          <div className="nfc-pulse pulse-one" />
          <div className="nfc-pulse pulse-two" />
          <div className="nfc-tag">
            <Icon name="nfc" size={38} />
            <span>Chạm NFC</span>
          </div>
        </div>
        <div className="tech-copy reveal">
          <p className="kicker light">Công nghệ</p>
          <h2>
            Chạm để
            <br />
            mở hành trình.
          </h2>
          <div className="tech-features">
            <div>
              <Icon name="nfc" />
              <span>
                <strong>NFC</strong> Chạm để mở hành trình
              </span>
            </div>
            <div>
              <Icon name="headphones" />
              <span>
                <strong>Audio</strong> Nghe câu chuyện
              </span>
            </div>
            <div>
              <Icon name="phone" />
              <span>
                <strong>AR</strong> Khám phá di sản trong không gian tương tác
              </span>
            </div>
          </div>
          <p className="nfc-fallback-copy">
            Không dùng được NFC? <Link to={`/heritage/${product.slug}`}>Mở câu chuyện di sản tại đây</Link>.
          </p>
          <LinkButton href={`/heritage/${product.slug}`} dark>
            Khám phá trải nghiệm số
          </LinkButton>
        </div>
      </section>

      <ProductReviews productId={product.id} />

      {/* RELATED PRODUCTS SECTION */}
      <section className="related-products section-pad">
        <div className="section-heading reveal">
          <p className="kicker">Khám phá thêm</p>
          <h2>CÓ THỂ BẠN CŨNG QUAN TÂM</h2>
        </div>
        <div className="product-grid" style={{ marginTop: "40px" }}>
          {products

            .filter((p) => p.id !== product.id)

            .slice(0, 3)

            .map((relatedProduct) => (
              <article
                className={`product-card reveal ${
                  isUpcomingProduct(relatedProduct) ? "is-upcoming" : ""
                }`}
                key={relatedProduct.id}
              >
                <Link
                  to={`/products/${relatedProduct.slug}`}
                  className="product-image"
                  aria-label={`Xem ${relatedProduct.name}`}
                >
                  <img
                    className="reveal-image"
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                  />
                  <span className="product-number">
                    {relatedProduct.number}
                  </span>
                  <span className="product-accent">
                    {relatedProduct.accent}
                  </span>
                  <span className="product-view">
                    <Icon name="plus" /> Xem chi tiết
                  </span>
                </Link>
                <div className="product-info">
                  <div>
                    <p>{relatedProduct.eyebrow}</p>
                    <h3>
                      <Link to={`/products/${relatedProduct.slug}`}>
                        {relatedProduct.name}
                      </Link>
                    </h3>
                  </div>
                  <strong>{relatedProduct.price}</strong>
                </div>
              </article>
            ))}
        </div>
      </section>
    </>
  )
}
