import { Link } from "react-router-dom"

import { useCatalog } from "../context/CatalogContext"
import { useSiteContent } from "../context/SiteContentContext"
import { isUpcomingProduct } from "../data/products"

import {
  Sparkles,
  Box,
  ArrowRight,
  Headphones,
  BookOpen,
  Compass,
  Layers,
  MapPin,
  ChevronRight,
} from "lucide-react"

export default function HeritageHub() {
  const { products } = useCatalog()
  const { text } = useSiteContent()

  const heritageCardsData = [
    {
      slug: "thap-rua",

      tags: ["3D AR Tương tác", "Audio Thuyết minh", "Kiến trúc biểu tượng"],

      highlights: [
        "Biểu tượng giữa lòng Hồ Gươm cổ kính",

        "Kiến trúc giao thoa độc đáo Đông - Tây",

        "Mô hình 3D xoay 360° & thực tế tăng cường AR",
      ],

      tagline:
        "Biểu tượng giữa lòng Hồ Hoàn Kiếm · Dấu ấn lịch sử và kiến trúc Thủ đô",

      detailedDesc:
        "Tọa lạc trên Gò Rùa thơ mộng giữa lòng Hồ Gươm, ngọn tháp rêu phong là nơi giao thoa giữa nét kiến trúc Á Đông và phong cách phương Tây, gắn liền với huyền tích trả gươm báu và ý chí kiên cường của người Hà Nội.",

      has3D: true,

      hasAudio: true,

      category: "bieu-tuong",
    },

    {
      slug: "chua-mot-cot",

      tags: ["Khởi lập 1049", "Audio Thuyết minh", "Di sản Thăng Long"],

      highlights: [
        "Khởi lập từ giấc mộng vua Lý Thái Tông năm 1049",

        "Triết lý kiến trúc Trời tròn - Đất vuông độc nhất vô nhị",

        "Đóa sen gỗ nghìn năm vươn mình giữa hồ Linh Chiểu",
      ],

      tagline:
        "Diên Hựu Tự nghìn năm văn hiến · Đóa sen gỗ vươn mình giữa lòng hồ Linh Chiểu",

      detailedDesc:
        "Kiệt tác kiến trúc Phật giáo thời Lý khởi dựng năm 1049 từ giấc mơ của vua Lý Thái Tông. Toàn bộ ngôi chùa gỗ được nâng đỡ bởi một cột đá duy nhất giữa hồ nước hình vuông, biểu trưng cho sự thanh khiết và trường tồn của non sông.",

      has3D: false,

      hasAudio: true,

      category: "thang-long",
    },

    {
      slug: "pho-hang-trong",

      tags: ["3D AR Tương tác", "Tranh Dân Gian", "Audio Thuyết minh"],

      highlights: [
        "Ký ức phố nghề thủ công tinh hoa đất kinh kỳ",

        "Mô hình 3D góc phố kiến trúc nghề & tranh dân gian",

        "Nếp sống tao nhã và ký ức văn hóa Tràng An xưa",
      ],

      tagline:
        "Nơi sắc màu dân gian lưu dấu giữa lòng Hà Nội · Ký ức tinh hoa phố nghề xưa",

      detailedDesc:
        "Góc phố kinh kỳ xưa nơi hội tụ của những phường nghề thủ công truyền thống và cái nôi của dòng tranh dân gian Hàng Trống. Kỹ thuật vờn màu độc bản bằng bút lông tạo nên hồn cốt thẩm mỹ thanh lịch của người Tràng An.",

      has3D: true,

      hasAudio: true,

      category: "pho-co",
    },
  ]

  return (
    <div
      className="heritage-hub-page site-shell"
      style={{
        background: "#150a0b",

        color: "#fff7ec",

        minHeight: "100vh",

        overflowX: "hidden",
      }}
    >
      <main
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Hero Section */}
        <div
          style={{
            position: "relative",

            minHeight: "440px",

            paddingTop: "140px",

            paddingBottom: "60px",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            overflow: "hidden",

            background: "linear-gradient(180deg, #1f0d11 0%, #150a0b 100%)",
          }}
        >
          {/* Subtle decorative background texture / glow */}
          <div
            style={{
              position: "absolute",

              top: "-20%",

              left: "50%",

              transform: "translateX(-50%)",

              width: "800px",

              height: "400px",

              background:
                "radial-gradient(circle, rgba(143, 0, 25, 0.4) 0%, rgba(21, 10, 11, 0) 70%)",

              filter: "blur(60px)",

              pointerEvents: "none",

              zIndex: 0,
            }}
          />

          <div
            style={{
              position: "relative",

              width: "100%",

              maxWidth: "1280px",

              margin: "0 auto",

              padding: "0 clamp(24px, 5vw, 80px)",

              textAlign: "center",

              zIndex: 2,
            }}
          >
            {/* Kicker badge */}
            <div style={{ marginBottom: "20px" }}>
              <span
                style={{
                  display: "inline-flex",

                  alignItems: "center",

                  gap: "8px",

                  padding: "8px 18px",

                  borderRadius: "99px",

                  background: "rgba(143, 0, 25, 0.65)",

                  border: "1px solid rgba(255, 209, 141, 0.35)",

                  color: "var(--gold)",

                  fontSize: "12.5px",

                  letterSpacing: "0.15em",

                  textTransform: "uppercase",

                  fontWeight: 600,

                  backdropFilter: "blur(6px)",
                }}
              >
                <Sparkles size={14} />
                {text("heritage.hub.kicker")}
              </span>
            </div>

            {/* Page Main Heading */}
            <h1
              style={{
                fontSize: "clamp(34px, 5.5vw, 60px)",

                margin: "0 0 16px",

                lineHeight: 1.15,

                fontFamily: '"Vollkorn", serif',

                color: "#fff7ec",

                textShadow: "0 4px 25px rgba(0, 0, 0, 0.7)",
              }}
            >
              {text("heritage.hub.title")}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "clamp(16px, 2vw, 19px)",

                color: "rgba(255, 235, 209, 0.85)",

                margin: "0 auto 32px",

                maxWidth: "780px",

                lineHeight: 1.6,

                fontFamily: '"Vollkorn", serif',

                fontStyle: "italic",
              }}
            >
              {text("heritage.hub.body")}
            </p>

            {/* Feature Highlights Pills Bar */}
            <div
              style={{
                display: "inline-flex",

                flexWrap: "wrap",

                alignItems: "center",

                justifyContent: "center",

                gap: "12px 24px",

                padding: "12px 24px",

                borderRadius: "99px",

                background: "rgba(0, 0, 0, 0.35)",

                border: "1px solid rgba(255, 209, 141, 0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  gap: "8px",

                  fontSize: "13.5px",

                  color: "var(--gold)",
                }}
              >
                <Compass size={16} />
                <span>03 Điểm đến di sản tiêu biểu</span>
              </div>
              <div
                style={{
                  width: "4px",

                  height: "4px",

                  borderRadius: "50%",

                  background: "rgba(255, 209, 141, 0.4)",
                }}
              />
              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  gap: "8px",

                  fontSize: "13.5px",

                  color: "var(--gold)",
                }}
              >
                <Headphones size={16} />
                <span>Thuyết minh Audio bản quyền</span>
              </div>
              <div
                style={{
                  width: "4px",

                  height: "4px",

                  borderRadius: "50%",

                  background: "rgba(255, 209, 141, 0.4)",
                }}
              />
              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  gap: "8px",

                  fontSize: "13.5px",

                  color: "var(--gold)",
                }}
              >
                <Box size={16} />
                <span>Mô hình 3D & AR tương tác</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Section */}
        <div
          style={{
            background: "#150a0b",

            padding: "40px clamp(24px, 5vw, 80px) 100px",

            flex: 1,
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            {/* Heritage Cards Grid - Clear, easy to view and select */}
            <div
              style={{
                display: "grid",

                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",

                gap: "36px",

                marginBottom: "80px",
              }}
            >
              {products.map((p) => {
                const cardMeta = heritageCardsData.find(
                  (d) => d.slug === p.slug,
                )
                const isUpcoming = isUpcomingProduct(p)

                return (
                  <article
                    key={p.id}
                    id={`heritage-${p.slug}`}
                    className={`heritage-card group${isUpcoming ? " is-upcoming" : ""}`}
                    style={{
                      background:
                        "linear-gradient(150deg, #231114 0%, #160a0c 100%)",

                      borderRadius: "18px",

                      border: "1px solid rgba(255, 209, 141, 0.2)",

                      overflow: "hidden",

                      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",

                      display: "flex",

                      flexDirection: "column",

                      justifyContent: "space-between",

                      transition:
                        "transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)"

                      e.currentTarget.style.borderColor =
                        "rgba(255, 209, 141, 0.55)"

                      e.currentTarget.style.boxShadow =
                        "0 22px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(143, 0, 25, 0.25)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)"

                      e.currentTarget.style.borderColor =
                        "rgba(255, 209, 141, 0.2)"

                      e.currentTarget.style.boxShadow =
                        "0 16px 40px rgba(0, 0, 0, 0.5)"
                    }}
                  >
                    <div>
                      {/* Image Preview with interactive overlay */}
                      <Link
                        className="heritage-card-image"
                        to={`/heritage/${p.slug}`}
                        style={{
                          display: "block",

                          height: "250px",

                          overflow: "hidden",

                          position: "relative",
                        }}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{
                            width: "100%",

                            height: "100%",

                            objectFit: "cover",

                            transition: "transform 0.6s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.06)"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)"
                          }}
                        />

                        {isUpcoming && (
                          <span className="heritage-coming-soon-overlay" aria-hidden="true">
                            COMING SOON
                          </span>
                        )}

                        {/* Top Gradient Overlay */}
                        <div
                          style={{
                            position: "absolute",

                            inset: 0,

                            background:
                              "linear-gradient(to top, rgba(22, 10, 12, 0.95) 0%, rgba(22, 10, 12, 0.2) 60%, rgba(0, 0, 0, 0.4) 100%)",

                            pointerEvents: "none",
                          }}
                        />

                        {/* Heritage Number Badge */}
                        <span
                          style={{
                            position: "absolute",

                            top: "16px",

                            left: "16px",

                            padding: "6px 14px",

                            borderRadius: "99px",

                            background: "rgba(143, 0, 25, 0.85)",

                            border: "1px solid rgba(255, 209, 141, 0.4)",

                            color: "var(--gold)",

                            fontSize: "11.5px",

                            fontWeight: 700,

                            letterSpacing: "0.1em",

                            textTransform: "uppercase",

                            backdropFilter: "blur(4px)",
                          }}
                        >
                          DI SẢN {p.number}
                        </span>

                        {/* Media capability badges */}
                        <div
                          style={{
                            position: "absolute",

                            top: "16px",

                            right: "16px",

                            display: "flex",

                            gap: "6px",
                          }}
                        >
                          {cardMeta?.hasAudio && (
                            <span
                              title="Có thuyết minh âm thanh"
                              style={{
                                display: "inline-flex",

                                alignItems: "center",

                                gap: "5px",

                                padding: "5px 10px",

                                borderRadius: "99px",

                                background: "rgba(0, 0, 0, 0.7)",

                                border: "1px solid rgba(255, 209, 141, 0.3)",

                                color: "var(--gold)",

                                fontSize: "11px",

                                fontWeight: 600,

                                backdropFilter: "blur(4px)",
                              }}
                            >
                              <Headphones size={13} /> Audio
                            </span>
                          )}

                          {cardMeta?.has3D && (
                            <span
                              title="Có mô hình 3D AR"
                              style={{
                                display: "inline-flex",

                                alignItems: "center",

                                gap: "5px",

                                padding: "5px 10px",

                                borderRadius: "99px",

                                background: "rgba(143, 0, 25, 0.8)",

                                border: "1px solid rgba(255, 209, 141, 0.4)",

                                color: "var(--gold)",

                                fontSize: "11px",

                                fontWeight: 600,

                                backdropFilter: "blur(4px)",
                              }}
                            >
                              <Box size={13} /> 3D AR
                            </span>
                          )}
                        </div>

                        {/* Location Eyebrow on Image Bottom */}
                        <div
                          style={{
                            position: "absolute",

                            bottom: "16px",

                            left: "20px",

                            right: "20px",

                            display: "flex",

                            alignItems: "center",

                            gap: "6px",

                            color: "var(--gold)",

                            fontSize: "12px",

                            letterSpacing: "0.12em",

                            textTransform: "uppercase",

                            fontWeight: 600,
                          }}
                        >
                          <MapPin size={14} />
                          <span>{p.eyebrow}</span>
                        </div>
                      </Link>

                      {/* Card Content */}
                      <div style={{ padding: "28px 26px 18px" }}>
                        <h2
                          style={{
                            fontSize: "28px",

                            color: "#fff7ec",

                            margin: "0 0 10px",

                            fontFamily: '"Vollkorn", serif',

                            fontWeight: 600,

                            lineHeight: 1.2,
                          }}
                        >
                          <Link
                            to={`/heritage/${p.slug}`}
                            style={{
                              color: "inherit",

                              textDecoration: "none",

                              transition: "color 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "var(--gold)"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#fff7ec"
                            }}
                          >
                            {p.name}
                          </Link>
                        </h2>

                        <p
                          style={{
                            fontSize: "14px",

                            lineHeight: 1.5,

                            color: "var(--gold)",

                            margin: "0 0 16px",

                            fontFamily: '"Vollkorn", serif',

                            fontStyle: "italic",

                            opacity: 0.9,
                          }}
                        >
                          {cardMeta?.tagline}
                        </p>

                        <p
                          style={{
                            color: "rgba(255, 235, 209, 0.8)",

                            fontSize: "14.5px",

                            lineHeight: 1.65,

                            marginBottom: "20px",
                          }}
                        >
                          {cardMeta?.detailedDesc || p.description}
                        </p>

                        {/* Bullet Highlights */}
                        <div
                          style={{
                            display: "flex",

                            flexDirection: "column",

                            gap: "8px",

                            marginBottom: "10px",

                            padding: "14px 16px",

                            borderRadius: "10px",

                            background: "rgba(0, 0, 0, 0.25)",

                            border: "1px solid rgba(255, 209, 141, 0.12)",
                          }}
                        >
                          {cardMeta?.highlights.map((hl, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",

                                alignItems: "flex-start",

                                gap: "8px",

                                fontSize: "13px",

                                color: "rgba(255, 235, 209, 0.85)",

                                lineHeight: 1.45,
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--gold)",

                                  lineHeight: 1,

                                  marginTop: "3px",
                                }}
                              >
                                ✦
                              </span>
                              <span>{hl}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div
                      style={{
                        padding: "16px 26px 26px",

                        borderTop: "1px solid rgba(255, 209, 141, 0.12)",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "space-between",

                        gap: "14px",
                      }}
                    >
                      <Link
                        to={`/heritage/${p.slug}`}
                        style={{
                          display: "inline-flex",

                          alignItems: "center",

                          justifyContent: "center",

                          gap: "8px",

                          padding: "12px 24px",

                          borderRadius: "10px",

                          background:
                            "linear-gradient(135deg, var(--gold) 0%, #e8ba75 100%)",

                          color: "#351b18",

                          fontSize: "13.5px",

                          fontWeight: 700,

                          textTransform: "uppercase",

                          letterSpacing: "0.08em",

                          textDecoration: "none",

                          width: "100%",

                          boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",

                          transition: "transform 0.2s ease, filter 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)"

                          e.currentTarget.style.filter = "brightness(1.05)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)"

                          e.currentTarget.style.filter = "brightness(1)"
                        }}
                      >
                        <span>Khám phá {p.name}</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Explanatory Multi-Sensory Experience Showcase */}
            <section
              style={{
                marginTop: "40px",

                padding: "48px 36px",

                borderRadius: "20px",

                background: "linear-gradient(145deg, #1f0d11 0%, #17090b 100%)",

                border: "1px solid rgba(255, 209, 141, 0.25)",

                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.45)",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <p
                  style={{
                    color: "var(--gold)",

                    fontSize: "12px",

                    textTransform: "uppercase",

                    letterSpacing: "0.15em",

                    marginBottom: "8px",

                    fontWeight: 600,
                  }}
                >
                  TRẢI NGHIỆM ĐA GIÁC QUAN
                </p>
                <h3
                  style={{
                    fontSize: "clamp(24px, 3.5vw, 34px)",

                    color: "#fff7ec",

                    fontFamily: '"Vollkorn", serif',

                    margin: 0,
                  }}
                >
                  Hòa mình vào không gian di sản số
                </h3>
              </div>

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",

                  gap: "28px",
                }}
              >
                {/* Feature 1 */}
                <div
                  style={{
                    padding: "24px",

                    borderRadius: "14px",

                    background: "rgba(0, 0, 0, 0.25)",

                    border: "1px solid rgba(255, 209, 141, 0.12)",
                  }}
                >
                  <div
                    style={{
                      width: "44px",

                      height: "44px",

                      borderRadius: "10px",

                      background: "rgba(143, 0, 25, 0.6)",

                      border: "1px solid rgba(255, 209, 141, 0.3)",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      color: "var(--gold)",

                      marginBottom: "16px",
                    }}
                  >
                    <Headphones size={22} />
                  </div>
                  <h4
                    style={{
                      fontSize: "19px",

                      color: "#fff7ec",

                      marginBottom: "10px",

                      fontFamily: '"Vollkorn", serif',
                    }}
                  >
                    Thuyết minh Âm thanh
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",

                      lineHeight: 1.6,

                      color: "rgba(255, 235, 209, 0.75)",

                      margin: 0,
                    }}
                  >
                    Bản ghi âm thuyết minh chất lượng cao với âm thanh nền lịch
                    sử, đưa bạn đắm chìm vào những huyền tích và dòng chảy văn
                    hóa Thăng Long.
                  </p>
                </div>

                {/* Feature 2 */}
                <div
                  style={{
                    padding: "24px",

                    borderRadius: "14px",

                    background: "rgba(0, 0, 0, 0.25)",

                    border: "1px solid rgba(255, 209, 141, 0.12)",
                  }}
                >
                  <div
                    style={{
                      width: "44px",

                      height: "44px",

                      borderRadius: "10px",

                      background: "rgba(143, 0, 25, 0.6)",

                      border: "1px solid rgba(255, 209, 141, 0.3)",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      color: "var(--gold)",

                      marginBottom: "16px",
                    }}
                  >
                    <Box size={22} />
                  </div>
                  <h4
                    style={{
                      fontSize: "19px",

                      color: "#fff7ec",

                      marginBottom: "10px",

                      fontFamily: '"Vollkorn", serif',
                    }}
                  >
                    Mô hình 3D & Thực tế AR
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",

                      lineHeight: 1.6,

                      color: "rgba(255, 235, 209, 0.75)",

                      margin: 0,
                    }}
                  >
                    Khám phá cấu trúc mộng gỗ xoay 360 độ từ mọi góc nhìn, hoặc
                    đặt trực tiếp mô hình vào không gian sống của bạn thông qua
                    camera điện thoại.
                  </p>
                </div>

                {/* Feature 3 */}
                <div
                  style={{
                    padding: "24px",

                    borderRadius: "14px",

                    background: "rgba(0, 0, 0, 0.25)",

                    border: "1px solid rgba(255, 209, 141, 0.12)",
                  }}
                >
                  <div
                    style={{
                      width: "44px",

                      height: "44px",

                      borderRadius: "10px",

                      background: "rgba(143, 0, 25, 0.6)",

                      border: "1px solid rgba(255, 209, 141, 0.3)",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      color: "var(--gold)",

                      marginBottom: "16px",
                    }}
                  >
                    <BookOpen size={22} />
                  </div>
                  <h4
                    style={{
                      fontSize: "19px",

                      color: "#fff7ec",

                      marginBottom: "10px",

                      fontFamily: '"Vollkorn", serif',
                    }}
                  >
                    Khảo cứu Thư tịch cổ
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",

                      lineHeight: 1.6,

                      color: "rgba(255, 235, 209, 0.75)",

                      margin: 0,
                    }}
                  >
                    Tư liệu nghiên cứu lịch sử dựa trên các bộ sử liệu xác thực
                    như Đại Việt Sử Ký Toàn Thư và ký ức phố nghề truyền thống
                    Hà Nội xưa.
                  </p>
                </div>
              </div>
            </section>

            {/* Bottom Invitation Banner: Bridge to products */}
            <div
              style={{
                marginTop: "40px",

                padding: "36px",

                borderRadius: "18px",

                background:
                  "linear-gradient(135deg, rgba(143, 0, 25, 0.4) 0%, rgba(35, 15, 18, 0.8) 100%)",

                border: "1px solid rgba(255, 209, 141, 0.3)",

                display: "flex",

                alignItems: "center",

                justifyContent: "space-between",

                flexWrap: "wrap",

                gap: "24px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "12px",

                    color: "var(--gold)",

                    letterSpacing: "0.15em",

                    textTransform: "uppercase",

                    fontWeight: 600,

                    display: "block",

                    marginBottom: "6px",
                  }}
                >
                  MÔ HÌNH LẮP GHÉP GỖ NGUYÊN BẢN
                </span>
                <h3
                  style={{
                    fontSize: "clamp(20px, 3vw, 26px)",

                    color: "#fff7ec",

                    margin: 0,

                    fontFamily: '"Vollkorn", serif',
                  }}
                >
                  Bạn muốn tự tay chạm vào di sản?
                </h3>
                <p
                  style={{
                    color: "rgba(255, 235, 209, 0.75)",

                    fontSize: "14.5px",

                    margin: "6px 0 0",
                  }}
                >
                  Khám phá bộ sưu tập mô hình lắp ghép mộng gỗ Kiến Tích Việt
                  với độ tinh xảo cao.
                </p>
              </div>

              <Link
                to="/products"
                style={{
                  display: "inline-flex",

                  alignItems: "center",

                  gap: "8px",

                  padding: "12px 24px",

                  borderRadius: "99px",

                  background:
                    "linear-gradient(135deg, var(--gold) 0%, #e8ba75 100%)",

                  color: "#351b18",

                  fontSize: "13.5px",

                  fontWeight: 700,

                  textTransform: "uppercase",

                  letterSpacing: "0.08em",

                  textDecoration: "none",

                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",

                  whiteSpace: "nowrap",
                }}
              >
                <span>Xem bộ sưu tập</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
