import { useState, useRef, useEffect } from "react"

import { Icon, LinkButton, stories } from "../components/Shared"

import { useCatalog } from "../context/CatalogContext"

import { Link } from "react-router-dom"
import { useSiteContent } from "../context/SiteContentContext"
import { isUpcomingProduct } from "../data/products"

const heritageImage = "/images/thap-rua.jpg"

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function SoundIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 14v-4M8 17V7M12 20V4M16 17V7M20 14v-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Home() {
  const { products } = useCatalog()
  const { text, visible } = useSiteContent()
  const [playing, setPlaying] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  return (
    <>
      <section className="hero-shell" aria-labelledby="hero-title">
        <div className="paper-grain" />
        <div className="sun-orbit" />

        <div className="hero-content">
          <div className="hero-copy">
            <div className="eyebrow">
              <span />
              {text("home.hero.eyebrow")}
            </div>

            <h1 id="hero-title">
              <span>{text("home.hero.title1")}</span>
              <em>{text("home.hero.title2")}</em>
            </h1>

            {visible("home.hero.body") && <p className="hero-description">{text("home.hero.body")}</p>}

            <div className="hero-actions">
              <Link className="primary-button" to={text("home.hero.ctaUrl") || "/products"}>
                {text("home.hero.cta")} <ArrowIcon />
              </Link>
              <a className="text-button" href="/#story">
                Về Kiến Tích Việt
                <span aria-hidden="true" />
              </a>
            </div>

            <div className="experience-note">
              <div className="sound-chip">
                <SoundIcon />
              </div>
              <p>
                <strong>Chạm để khám phá câu chuyện di sản</strong>
                NFC · Audio · AR Experience
              </p>
            </div>
          </div>

          <div className="hero-visual" aria-label="Kiến trúc di sản Việt Nam">
            <div className="visual-number">01</div>
            <div className="visual-frame">
              <img
                src={heritageImage}
                alt="Tháp Rùa Hồ Gươm cổ kính giữa lòng Hà Nội"
              />
              <div className="visual-tint" />
              <div className="corner corner-left" />
              <div className="corner corner-right" />
              <div className="visual-caption">
                <span>Di sản nổi bật</span>
                <strong>Tháp Rùa Hồ Gươm</strong>
              </div>
            </div>

            <div className="nfc-orbit">
              <div className="nfc-ripple ripple-one" />
              <div className="nfc-ripple ripple-two" />
              <div className="nfc-core">
                <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M11 9c4 3 4 11 0 14M16 6c7 5 7 15 0 20M21 3c10 7 10 19 0 26"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <span>NFC</span>
              </div>
            </div>

            <div className="floating-card">
              <span className="card-index">01</span>
              <div className="card-line" />
              <strong>Chạm.</strong>
              <strong>Nghe.</strong>
              <strong>Khám phá.</strong>
            </div>
          </div>
        </div>

        <div className="hero-footer">
          <span>Thiết kế tại Việt Nam</span>
          <a href="/#story">
            Cuộn để khám phá <i>↓</i>
          </a>
          <span>kientichviet.com</span>
        </div>
      </section>

      <section className="intro section-pad" id="story">
        <div className="section-heading reveal">
          <p className="kicker">01. Triết lý sản phẩm</p>
          <h2>
            Không chỉ lắp ghép một&nbsp;mô&nbsp;hình,
            <br />
            mà còn khám phá một&nbsp;di&nbsp;sản.
          </h2>
        </div>
        <p className="intro-copy reveal">
          Qua từng mảnh ghép gỗ, những công trình và câu chuyện di sản Việt Nam
          được tái hiện theo cách gần gũi hơn với cuộc sống hôm nay.
        </p>
        <div className="steps">
          {[
            [
              "01",

              "Trải nghiệm",

              "Lắp ghép",

              "Khách hàng tự tay lắp ráp và hoàn thiện mô hình.",
            ],

            [
              "02",

              "Giá trị sử dụng",

              "Trưng bày",

              "Thành quả là một mô hình có tính thẩm mỹ, có thể đặt trong không gian sống hoặc sưu tầm.",
            ],

            [
              "03",

              "Giá trị văn hóa",

              "Khám phá",

              "Khách hàng tìm hiểu thêm về công trình và câu chuyện di sản thông qua nội dung số.",
            ],
          ].map(([number, en, title, text]) => (
            <article className="step-card reveal" key={number}>
              <span className="step-number">{number}</span>
              <div className="step-icon">
                <Icon
                  name={
                    number === "01" ? "cube" : number === "02" ? "box" : "nfc"
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

      <section className="products section-pad" id="products">
        <div className="products-head reveal">
          <div className="section-heading reveal">
            <p className="kicker">{text("home.products.kicker")}</p>
            <h2>
              {text("home.products.title")}
            </h2>
            <p>{text("home.products.body")}</p>
          </div>
          <Link className="text-link" to="/products">
            Xem tất cả sản phẩm <Icon name="arrow" />
          </Link>
        </div>
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
                className="product-image"
                to={`/products/${product.slug}`}
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
                      <strong className="product-price">{product.price}</strong>
                    )}
                  </div>
                  <Link
                    to={`/products/${product.slug}`}
                    className="product-inline-cta"
                    aria-label={`Xem chi tiết ${product.name}`}
                  >
                    {isUpcomingProduct(product)
                      ? "Xem chi tiết"
                      : "Khám phá"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="products-footer reveal">
          <Link className="primary-button" to="/products">
            Khám phá tất cả mô hình <ArrowIcon />
          </Link>
        </div>
      </section>

      <section className="tech section-pad" id="discover">
        <div className="tech-visual reveal">
          <div className="phone">
            <div className="phone-screen">
              <audio
                ref={audioRef}
                src="/audio/thap-rua.mp3"
                preload="none"
                onEnded={() => setPlaying(false)}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
              />
              <span className="phone-label">Kiến Tích Việt</span>
              <img src="/images/thap-rua.jpg" alt="Mô hình Tháp Rùa" />
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
                <strong>Tháp Rùa — Biểu tượng giữa lòng Hồ Hoàn Kiếm</strong>
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
          <p className="kicker light">{text("home.digital.kicker")}</p>
          <h2>{text("home.digital.title")}</h2>
          <p>{text("home.digital.body")}</p>
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
                <strong>Audio</strong> Lắng nghe câu chuyện di sản.
              </span>
            </div>
            <div>
              <Icon name="phone" />
              <span>
                <strong>AR</strong> Đưa mô hình 3D vào không gian thực.
              </span>
            </div>
          </div>
          <LinkButton href="/heritage" dark>
            Khám phá trải nghiệm số
          </LinkButton>
        </div>
      </section>

      <section className="journal section-pad" id="journal">
        <div className="journal-intro reveal">
          <p className="kicker">{text("home.journal.kicker")}</p>
          <h2>{text("home.journal.title").split("\n").map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</h2>
          <p>{text("home.journal.body")}</p>
          <Link className="text-link" to="/heritage">
            Khám phá di sản <Icon name="arrow" />
          </Link>
        </div>
        <div className="story-list">
          {stories
            .filter((story) =>
              products.some((product) => product.slug === story.slug),
            )
            .map((story, index) => {
              const productSlug =
                story.slug || products[index]?.slug || "thap-rua"

              return (
                <Link
                  to={`/heritage/${productSlug}`}
                  className="story-item reveal"
                  key={story.title}
                >
                  <span className="story-index">0{index + 1}</span>
                  <img src={story.image} alt="" />
                  <div>
                    <p>{story.place}</p>
                    <h3>{story.title}</h3>
                  </div>
                  <span className="story-arrow">
                    <Icon name="arrow" />
                  </span>
                </Link>
              )
            })}
        </div>
      </section>

      <section className="statement reveal">
        <div className="statement-mark">“</div>
        <p>Mỗi mảnh ghép một dấu ấn,</p>
        <h2>mỗi mô hình một câu chuyện.</h2>
        <LinkButton href="/products">Bắt đầu hành trình</LinkButton>
      </section>
    </>
  )
}
