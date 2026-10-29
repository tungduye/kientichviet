import { useState, useEffect, useRef } from "react"

import { useParams, Link } from "react-router-dom"

import { Icon, LinkButton } from "../components/Shared"

import AudioGuidePlayer from "../components/AudioGuidePlayer"

import { useCatalog } from "../context/CatalogContext"

import {
  Sparkles,
  Box,
  ArrowRight,
  BookOpen,
  Compass,
  Layers,
  Camera,
  X,
} from "lucide-react"

import ModelViewer3D from "../components/ModelViewer3D"

import HeritageHub from "../components/HeritageHub"
import { isUpcomingProduct } from "../data/products"

export default function Heritage() {
  const { products, findProduct } = useCatalog()

  const { id } = useParams<{ id: string }>()
  const product = findProduct(id)

  const [is3DModalOpen, setIs3DModalOpen] = useState(false)

  const open3DButtonRef = useRef<HTMLButtonElement>(null)

  const scrollPositionRef = useRef<number>(0)

  useEffect(() => {
    if (is3DModalOpen) {
      scrollPositionRef.current = window.scrollY

      document.body.style.overflow = "hidden"

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIs3DModalOpen(false)
        }
      }

      window.addEventListener("keydown", handleKeyDown)

      return () => {
        window.removeEventListener("keydown", handleKeyDown)

        document.body.style.overflow = ""
      }
    } else {
      document.body.style.overflow = ""

      // Reliably restore previous scroll position on closing 3D viewer

      if (scrollPositionRef.current > 0) {
        window.scrollTo({
          top: scrollPositionRef.current,

          behavior: "instant",
        })
      }

      if (open3DButtonRef.current) {
        open3DButtonRef.current.focus({ preventScroll: true })
      }
    }
  }, [is3DModalOpen])

  // Prefetch 3D model files in background to eliminate load wait time

  useEffect(() => {
    if (!product?.modelUrl) return

    const timer = setTimeout(() => {
      const glbLink = document.createElement("link")

      glbLink.rel = "prefetch"

      glbLink.href = product.modelUrl!

      glbLink.as = "fetch"

      glbLink.crossOrigin = "anonymous"

      document.head.appendChild(glbLink)

      if (product.usdzUrl) {
        const usdzLink = document.createElement("link")

        usdzLink.rel = "prefetch"

        usdzLink.href = product.usdzUrl

        usdzLink.as = "fetch"

        document.head.appendChild(usdzLink)
      }
    }, 1200)

    return () => clearTimeout(timer)
  }, [product?.modelUrl, product?.usdzUrl])

  // If no ID is specified in URL (e.g. visiting /heritage), show the selection hub
  if (!id) {
    return <HeritageHub />
  }

  if (!product) {
    return (
      <div
        className="site-shell"
        style={{
          background: "#150a0b",
          color: "#fff7ec",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            color: "var(--red)",
            marginBottom: "15px",
            fontFamily: '"Vollkorn", serif',
          }}
        >
          Không tìm thấy nội dung di sản
        </h1>
        <p style={{ color: "rgba(255, 235, 209, 0.7)", marginBottom: "30px" }}>
          Nội dung bạn đang tìm kiếm không tồn tại hoặc đã được di dời.
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <LinkButton href="/heritage">Xem danh sách di sản</LinkButton>
          <LinkButton href="/">Trở về trang chủ</LinkButton>
        </div>
      </div>
    )
  }

  const otherHeritages = products.filter((p) => p.slug !== product.slug)
  const isThapRua = product.slug === "thap-rua"
  const isChuaMotCot = product.slug === "chua-mot-cot"
  const isHangTrong = product.slug === "pho-hang-trong"

  return (
    <div
      className="heritage-page site-shell"
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

            height: "clamp(480px, 62vh, 620px)",

            display: "flex",

            alignItems: "flex-end",

            justifyContent: "flex-start",

            overflow: "hidden",
          }}
        >
          {/* Background Heritage Image with centered crop */}
          <img
            src={product.image}
            alt={product.name}
            style={{
              position: "absolute",

              top: 0,

              left: 0,

              width: "100%",

              height: "100%",

              objectFit: "cover",

              objectPosition: "center 32%",

              opacity: 0.62,

              zIndex: 0,
            }}
          />

          {/* Multi-layered warm lacquer gradient overlay */}
          <div
            style={{
              position: "absolute",

              inset: 0,

              background:
                "linear-gradient(to top, #150a0b 0%, rgba(21, 10, 11, 0.82) 32%, rgba(21, 10, 11, 0.3) 68%, rgba(0, 0, 0, 0.45) 100%)",

              zIndex: 1,
            }}
          />

          {/* Hero Typography & Kicker */}
          <div
            style={{
              position: "relative",

              width: "100%",

              maxWidth: "1280px",

              margin: "0 auto",

              padding: "0 clamp(24px, 5vw, 80px) 48px",

              zIndex: 5,
            }}
          >
            {/* Top Navigation Back Link */}
            <div style={{ marginBottom: "16px" }}>
              <Link
                to="/heritage"
                style={{
                  display: "inline-flex",

                  alignItems: "center",

                  gap: "6px",

                  color: "rgba(255, 235, 209, 0.75)",

                  fontSize: "12px",

                  letterSpacing: "0.1em",

                  textTransform: "uppercase",

                  textDecoration: "none",

                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--gold)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 235, 209, 0.75)"
                }}
              >
                <span>← Khám phá di sản</span>
              </Link>
            </div>

            {/* Elegant Kicker Badge */}
            <div style={{ marginBottom: "16px" }}>
              <span
                style={{
                  display: "inline-flex",

                  alignItems: "center",

                  gap: "8px",

                  padding: "6px 14px",

                  borderRadius: "99px",

                  background: "rgba(143, 0, 25, 0.55)",

                  border: "1px solid rgba(255, 209, 141, 0.32)",

                  color: "var(--gold)",

                  fontSize: "12px",

                  letterSpacing: "0.15em",

                  textTransform: "uppercase",

                  fontWeight: 600,

                  backdropFilter: "blur(6px)",
                }}
              >
                <Sparkles size={13} />
                {isThapRua
                  ? "HÀ NỘI · KIẾN TRÚC DI SẢN"
                  : isChuaMotCot
                    ? "HÀ NỘI · DI SẢN SỐ 02"
                    : `${product.eyebrow.split("·")[0]?.trim() || "DI SẢN"} · SỐ ${product.number}`}
              </span>
            </div>

            {/* Heritage Name */}
            <h1
              style={{
                fontSize: "clamp(40px, 6vw, 68px)",

                margin: "0 0 12px",

                lineHeight: 1.1,

                fontFamily: '"Vollkorn", serif',

                color: "#fff7ec",

                textShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
              }}
            >
              {product.name}
            </h1>

            {/* Heritage Subtitle */}
            <p
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",

                color: "rgba(255, 235, 209, 0.85)",

                margin: 0,

                maxWidth: "700px",

                lineHeight: 1.5,

                fontFamily: '"Vollkorn", serif',

                fontStyle: "italic",
              }}
            >
              {isThapRua
                ? "Biểu tượng giữa lòng Hồ Hoàn Kiếm · Dấu ấn lịch sử và kiến trúc Thủ đô"
                : isChuaMotCot
                  ? "Diên Hựu Tự nghìn năm văn hiến · Đóa sen gỗ vươn mình giữa lòng hồ Linh Chiểu"
                  : "Nơi sắc màu dân gian lưu dấu giữa lòng Hà Nội · Ký ức tinh hoa phố nghề xưa"}
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            background: "#150a0b",

            padding: "40px clamp(24px, 5vw, 80px) 100px",
          }}
        >
          {/* Audio Guide Section */}
          {product.audioUrl && (
            <section
              className="reveal"
              style={{
                maxWidth: "920px",

                margin: "0 auto 80px",
              }}
            >
              <div
                style={{
                  textAlign: "center",

                  marginBottom: "28px",
                }}
              >
                <h2
                  style={{
                    fontSize: "clamp(22px, 3vw, 30px)",

                    color: "var(--gold)",

                    fontFamily: '"Vollkorn", serif',

                    marginBottom: "10px",
                  }}
                >
                  {isThapRua
                    ? "LẮNG NGHE CÂU CHUYỆN"
                    : isHangTrong
                      ? "LẮNG NGHE CÂU CHUYỆN"
                      : "Không gian Thuyết minh Âm thanh"}
                </h2>
                <p
                  style={{
                    fontSize: "17px",

                    lineHeight: 1.6,

                    color: "rgba(255, 235, 209, 0.82)",

                    maxWidth: "760px",

                    margin: "0 auto",
                  }}
                >
                  {isThapRua
                    ? "Đeo tai nghe và hòa mình vào thanh âm trầm lắng của Hà Nội xưa. Bản thuyết minh âm thanh sẽ cùng bạn lần giở huyền tích gươm báu, dấu ấn Gò Rùa và những thăng trầm lịch sử qua bao thế kỷ của ngọn tháp rêu phong giữa lòng hồ xanh."
                    : isHangTrong
                      ? "Lắng nghe âm sắc phố nghề và dòng tranh dân gian cổ truyền. Cùng Kiến Tích Việt ngược dòng thời gian về với nhịp sống phố thị nhộn nhịp, kỹ thuật vờn màu độc bản và ký ức văn hóa tao nhã của người Tràng An."
                      : "Lắng nghe câu chuyện về Diên Hựu Tự nghìn năm văn hiến. Mời bạn cùng bước vào hành trình tâm linh từ giấc mộng đài sen của vua Lý Thái Tông đến kiệt tác kiến trúc mộng mộc độc nhất vô nhị giữa lòng Thăng Long."}
                </p>
              </div>

              <AudioGuidePlayer
                key={product.slug}
                audioUrl={product.audioUrl}
                title={
                  isThapRua
                    ? "Tháp Rùa"
                    : isHangTrong
                      ? "Phố Hàng Trống"
                      : product.audioTitle || product.name
                }
                subtitle={
                  isThapRua
                    ? "Biểu tượng giữa lòng Hồ Hoàn Kiếm"
                    : isHangTrong
                      ? "Nơi sắc màu dân gian lưu dấu giữa lòng Hà Nội"
                      : product.audioAuthor ||
                        "Thuyết minh Di sản · Kiến Tích Việt"
                }
                heritageName={product.name}
                coverImage={product.image}
                caption={
                  isThapRua
                    ? "Âm vang Hồ Gươm"
                    : isHangTrong
                      ? "Âm sắc phố nghề"
                      : "Âm vang sen ngọc"
                }
              />
            </section>
          )}

          {/* Heritage Story & Cultural Architecture: Balanced 55/45 Two-Column Layout */}
          <div
            id="story"
            className="reveal"
            style={{
              display: "grid",

              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",

              gap: "60px",

              maxWidth: "1200px",

              margin: "0 auto 90px",

              scrollMarginTop: "120px",
            }}
          >
            {/* Column Left (55%): Deep Narrative, Ancient Chronicles & Architecture */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "32px" }}
            >
              {/* Ancient Chronicle Quote Block */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #241315 0%, #190c0e 100%)",

                  borderLeft: "3px solid var(--gold)",

                  borderTop: "1px solid rgba(255, 209, 141, 0.15)",

                  borderRight: "1px solid rgba(255, 209, 141, 0.15)",

                  borderBottom: "1px solid rgba(255, 209, 141, 0.15)",

                  padding: "26px 28px",

                  borderRadius: "0 12px 12px 0",
                }}
              >
                <div
                  style={{
                    display: "flex",

                    alignItems: "center",

                    gap: "8px",

                    marginBottom: "12px",
                  }}
                >
                  <BookOpen size={16} color="var(--gold)" />
                  <span
                    style={{
                      fontSize: "12px",

                      textTransform: "uppercase",

                      letterSpacing: "0.15em",

                      color: "var(--gold)",

                      fontWeight: 600,
                    }}
                  >
                    {isThapRua
                      ? "Ký ức Thăng Long · Dấu ấn Gò Rùa"
                      : isHangTrong
                        ? "Di sản Phố Nghề · Sắc Màu Dân Gian"
                        : "Thư tịch cổ · Đại Việt Sử Ký Toàn Thư"}
                  </span>
                </div>
                <blockquote
                  style={{
                    margin: 0,

                    fontSize: "16.5px",

                    lineHeight: 1.7,

                    color: "rgba(255, 235, 209, 0.9)",

                    fontFamily: '"Vollkorn", serif',

                    fontStyle: "italic",
                  }}
                >
                  {isThapRua
                    ? "“Hồ Gươm nước biếc bốn mùa, ngọn tháp rêu phong soi bóng gò xưa. Không chỉ là nét chấm phá cổ kính giữa lòng Hà Nội, Tháp Rùa còn là chứng nhân của lịch sử, nơi lắng đọng linh khí đất trời và ký ức thiêng liêng của người Thăng Long qua bao thăng trầm dâu bể.”"
                    : isHangTrong
                      ? "“Dẫu những cửa hàng xưa đã thưa vắng, những nét khắc trên gỗ và sắc màu trên giấy dó vẫn tiếp tục kể câu chuyện về người Hà Nội, về nghệ thuật dân gian và về những giá trị văn hóa cần được trao truyền cho các thế hệ mai sau.”"
                      : "“Mùa đông tháng 10 năm Kỷ Dậu (1049), dựng chùa Diên Hựu. Vua Lý Thái Tông chiêm bao thấy Phật Quan Âm dắt lên tòa sen, bèn sai dựng chùa, xây cột đá ở giữa hồ, làm tòa sen của Phật Quan Âm đặt trên cột như đã thấy trong mộng...”"}
                </blockquote>
              </div>

              {/* Story Chapter 1 */}
              <div>
                <h3
                  style={{
                    fontSize: "26px",

                    color: "var(--gold)",

                    marginBottom: "16px",

                    fontFamily: '"Vollkorn", serif',

                    display: "flex",

                    alignItems: "center",

                    gap: "10px",
                  }}
                >
                  <Compass size={22} />{" "}
                  {isThapRua
                    ? "Nguồn gốc lịch sử & Dấu ấn Gò Rùa"
                    : isHangTrong
                      ? "Ký ức phố nghề xưa & Nơi hội tụ trăm thợ"
                      : "Huyền tích khởi lập (Năm 1049)"}
                </h3>
                {isThapRua ? (
                  <>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Về nguồn gốc lịch sử, trước khi có Tháp Rùa ngày nay, Gò
                      Rùa từng là nơi tọa lạc của những công trình gắn với các
                      triều đại trước. Theo các tư liệu được ghi lại, dưới thời
                      vua Lê Thánh Tông, nơi đây có Điếu Đài, là nơi nhà vua câu
                      cá và ngâm vịnh thơ ca. Đến thời Lê Trung Hưng, chúa Trịnh
                      cho xây dựng đình Tả Vọng trên gò. Về sau, những công
                      trình này bị phá bỏ và không còn tồn tại.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Tháp Rùa ngày nay được xây dựng trong khoảng từ giữa năm
                      1884 đến tháng 4/1886, gắn với một nhân vật thường được
                      gọi là Bá hộ Kim. Theo một câu chuyện được lưu truyền, ông
                      nhận thấy Gò Rùa có vị trí đẹp về phong thủy nên muốn xây
                      tháp để an táng hài cốt cha mình. Tuy nhiên, việc an táng
                      được cho là đã không thành công. Công trình vẫn được hoàn
                      thành và ban đầu được gọi là Tháp Bá hộ Kim. Bên cạnh đó,
                      một cách lý giải khác cho rằng Tháp Rùa được xây dựng nhằm
                      tạo thế hậu chẩm cho chùa Báo Ân, một ngôi chùa lớn từng
                      tồn tại gần Hồ Hoàn Kiếm. Những cách lý giải khác nhau cho
                      thấy nguồn gốc và mục đích xây dựng Tháp Rùa vẫn còn những
                      điểm chưa hoàn toàn thống nhất.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",
                      }}
                    >
                      Tháp Rùa còn gắn với những dấu ấn lịch sử đáng nhớ. Theo
                      các tư liệu ghi lại, ngày 19/5/1948, chiến sĩ trẻ Nguyễn
                      Trọng Quang cùng đồng đội đã bơi ra Tháp Rùa để treo lá cờ
                      đỏ sao vàng trên đỉnh tháp, ngay trong thời kỳ Hà Nội bị
                      thực dân Pháp chiếm đóng. Sự kiện này trở thành một câu
                      chuyện đặc biệt về tinh thần yêu nước và ý chí đấu tranh
                      của người dân Thủ đô.
                    </p>
                  </>
                ) : isHangTrong ? (
                  <>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Ngược dòng thời gian, khu vực phố Hàng Trống ngày nay vốn
                      được hình thành từ đất của nhiều thôn xóm cũ, trong đó có
                      Cổ Vũ, Khánh Thụy Hữu và Tự Tháp. Những cộng đồng dân cư
                      với nghề nghiệp và tập quán riêng đã góp phần tạo nên diện
                      mạo đặc trưng của khu phố. Khi người thợ từ các làng nghề
                      lân cận tìm đến đây sinh sống và buôn bán, con phố dần trở
                      thành nơi hội tụ của nhiều nghề thủ công truyền thống.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Ngày ấy, Hàng Trống không chỉ có một nghề. Người dân từ
                      làng Liên Thượng mang nghề làm trống đến đây, tạo ra nhiều
                      loại trống phục vụ đời sống và các hoạt động văn hóa.
                      Những người thợ từ Đào Xá lại nổi tiếng với nghề làm lọng,
                      làm tàn, tán dùng trong các nghi lễ và tại đình, đền,
                      chùa, miếu. Ở một đoạn khác của phố, những người thợ thêu
                      từ vùng Quất Động, Hướng Dương cũng góp mặt, khiến nơi đây
                      từng có đoạn được gọi là phố Hàng Thêu.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",
                      }}
                    >
                      Thế nhưng, giữa những âm thanh của nghề thủ công và nhịp
                      buôn bán ấy, có một nghề đã tạo nên dấu ấn đặc biệt cho
                      Hàng Trống: nghề làm tranh dân gian. Tranh Hàng Trống phát
                      triển mạnh vào cuối thế kỷ XIX, đầu thế kỷ XX, khi người
                      dân Hà Nội vẫn có nhu cầu lớn về tranh để thờ cúng, trang
                      trí nhà cửa và đón Tết. Những bức tranh không đơn thuần
                      dùng để làm đẹp không gian sống, mà còn gửi gắm niềm tin,
                      mong ước bình an, may mắn và cuộc sống sung túc.
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Theo huyền sử, vua Lý Thái Tông tuổi cao chưa có hoàng tử
                      nối dõi, thường đến cầu tự ở các chùa. Một đêm, ngài chiêm
                      bao thấy Bồ Tát Quan Âm tọa thiền trên tòa sen tỏa ánh hào
                      quang rực rỡ, đưa tay dắt nhà vua lên đài. Sau đó hoàng
                      hậu hạ sinh hoàng tử.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",
                      }}
                    >
                      Để tạ ơn hồng ân Tam Bảo, nhà vua cho dựng một ngôi chùa
                      đặt tên là <strong>Diên Hựu</strong>
                      (nghĩa là "Phước lành dài lâu") với dáng dấp một đóa hoa
                      sen vươn lên giữa hồ nước Linh Chiểu, trở thành biểu tượng
                      của tâm hồn thuần khiết và lòng từ bi của dân tộc.
                    </p>
                  </>
                )}
              </div>

              {/* Story Chapter 2: Unique Architecture */}
              <div>
                <h3
                  style={{
                    fontSize: "26px",

                    color: "var(--gold)",

                    marginBottom: "16px",

                    fontFamily: '"Vollkorn", serif',

                    display: "flex",

                    alignItems: "center",

                    gap: "10px",
                  }}
                >
                  <Layers size={22} />{" "}
                  {isThapRua
                    ? "Kiến trúc giao thoa Đông – Tây & Biểu tượng văn hóa"
                    : isHangTrong
                      ? "Kỹ thuật vờn màu độc bản & Giá trị văn hóa"
                      : "Triết lý kiến trúc: Trời tròn Đất vuông"}
                </h3>
                {isThapRua ? (
                  <>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Về kiến trúc, Tháp Rùa cao khoảng 8,8 m, gồm ba tầng chính
                      và một tầng đỉnh dạng vọng lâu, với quy mô thu nhỏ dần từ
                      dưới lên trên. Công trình mang nét giao thoa giữa kiến
                      trúc phương Tây và kiến trúc truyền thống Việt Nam. Hai
                      tầng dưới nổi bật với hệ thống cửa vòm nhọn, trong khi các
                      tầng phía trên có những chi tiết mái cong mang dáng dấp
                      kiến trúc Á Đông. Trên mặt phía đông của tầng ba có ba chữ
                      “Quy Sơn Tháp”, nghĩa là Tháp Núi Rùa. Sự kết hợp này tạo
                      nên diện mạo riêng của công trình giữa không gian Hồ Gươm.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",
                      }}
                    >
                      Trải qua thời gian, Tháp Rùa không chỉ là một công trình
                      kiến trúc giữa hồ mà còn trở thành biểu tượng gắn liền với
                      Hồ Gươm và Hà Nội. Hình ảnh ngọn tháp xuất hiện trong thơ
                      ca, hội họa, âm nhạc và ký ức của nhiều thế hệ. Giá trị
                      của Tháp Rùa vì thế không chỉ nằm ở tuổi đời hay hình dáng
                      kiến trúc, mà còn ở những câu chuyện lịch sử, văn hóa và
                      tình cảm mà cộng đồng đã gửi gắm vào công trình qua nhiều
                      thế hệ.
                    </p>
                  </>
                ) : isHangTrong ? (
                  <>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Điều làm nên nét riêng của tranh Hàng Trống nằm ở cách
                      người nghệ nhân tạo ra từng tác phẩm. Họ dùng ván khắc gỗ
                      để in những đường nét chính lên giấy dó, sau đó tự tay tô
                      màu bằng bút lông. Đặc biệt, kỹ thuật vờn màu tạo nên
                      những mảng đậm nhạt mềm mại, khiến bức tranh vừa có đường
                      nét rõ ràng, vừa mang vẻ uyển chuyển và giàu sức sống. Nếu
                      tranh Đông Hồ thường in màu bằng các bản khắc riêng, thì
                      với tranh Hàng Trống, bàn tay và cảm quan màu sắc của
                      người nghệ nhân đóng vai trò đặc biệt quan trọng trong
                      công đoạn hoàn thiện.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Mỗi bức tranh lại kể một câu chuyện khác nhau. Tranh Ngũ
                      Hổ gắn với tín ngưỡng dân gian; tranh Tố Nữ và Tứ Quý thể
                      hiện vẻ đẹp thanh nhã, hài hòa; còn tranh Lý Ngư Vọng
                      Nguyệt mang đến hình ảnh giàu tính biểu tượng. Có cả những
                      bức tranh tái hiện các nhân vật lịch sử như Hai Bà Trưng,
                      Bà Triệu và Trần Hưng Đạo. Qua từng nét khắc, từng lớp
                      màu, người xưa gửi gắm vào tranh niềm tin, quan niệm thẩm
                      mỹ và những giá trị được truyền từ thế hệ này sang thế hệ
                      khác.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",
                      }}
                    >
                      Ngày nay, phố Hàng Trống không còn giữ nguyên không khí
                      của một phố nghề xưa, nhưng tên gọi của nó vẫn gợi nhắc về
                      một thời kỳ mà những người thợ làm trống, làm lọng, thêu
                      thùa và vẽ tranh cùng góp phần tạo nên bản sắc của Hà Nội.
                      Đặc biệt, tranh Hàng Trống vẫn là minh chứng cho sự khéo
                      léo, óc sáng tạo và đời sống tinh thần phong phú của người
                      Việt. Dẫu những cửa hàng xưa đã thưa vắng, những nét khắc
                      trên gỗ và sắc màu trên giấy dó vẫn tiếp tục kể câu chuyện
                      về người Hà Nội, về nghệ thuật dân gian và về những giá
                      trị văn hóa cần được trao truyền cho các thế hệ mai sau.
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",

                        marginBottom: "16px",
                      }}
                    >
                      Khác với cấu trúc chùa chiền truyền thống nhiều gian, Chùa
                      Một Cột sở hữu giải pháp kiến trúc độc nhất vô nhị trên
                      thế giới: Toàn bộ ngôi chùa gỗ hình vuông (mỗi cạnh 3m)
                      được nâng đỡ bởi
                      <strong> một cột đá trụ tròn duy nhất</strong> có đường
                      kính 1.2m, chôn sâu vững chãi giữa lòng hồ.
                    </p>
                    <p
                      style={{
                        lineHeight: 1.75,

                        color: "rgba(255, 235, 209, 0.85)",

                        fontSize: "16px",
                      }}
                    >
                      Cột đá tròn tượng trưng cho Trời (Dương), mái chùa vuông
                      tượng trưng cho Đất (Âm), bốn góc mái đao cong mềm mại vút
                      lên tựa những cánh sen xòe nở. Hệ thống giằng mộng gỗ đòn
                      tay vươn ra từ cột đá là minh chứng đỉnh cao cho kỹ thuật
                      ghép mộng mộc truyền thống của thợ tài hoa đất Thăng Long.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Column Right (45%): Wooden Model Craft & AR Experience */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "35px" }}
            >
              {/* Product Card: Royal Deep Lacquer Ruby (Refined, no harsh red) */}
              <div
                style={{
                  background:
                    "linear-gradient(145deg, #380e15 0%, #220a0e 100%)",

                  padding: "36px",

                  borderRadius: "16px",

                  border: "1px solid rgba(255, 209, 141, 0.28)",

                  boxShadow:
                    "0 18px 45px rgba(0, 0, 0, 0.5), 0 0 30px rgba(143, 0, 25, 0.2)",

                  position: "relative",

                  overflow: "hidden",
                }}
              >
                <div style={{ position: "relative", zIndex: 2 }}>
                  <p
                    style={{
                      color: "var(--gold)",

                      fontSize: "12px",

                      textTransform: "uppercase",

                      letterSpacing: "0.15em",

                      fontWeight: 600,

                      marginBottom: "8px",
                    }}
                  >
                    MÔ HÌNH LẮP GHÉP GỖ NGUYÊN BẢN
                  </p>
                  <h3
                    style={{
                      fontSize: "26px",

                      color: "#fff7ec",

                      marginBottom: "16px",

                      fontFamily: '"Vollkorn", serif',
                    }}
                  >
                    Mô hình {product.name}
                  </h3>

                  <div
                    style={{
                      borderRadius: "10px",

                      overflow: "hidden",

                      marginBottom: "20px",

                      border: "1px solid rgba(255, 209, 141, 0.2)",
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: "100%",

                        height: "220px",

                        objectFit: "cover",

                        display: "block",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontSize: "14.5px",

                      lineHeight: 1.6,

                      color: "rgba(255, 235, 209, 0.8)",

                      marginBottom: "24px",
                    }}
                  >
                    {product.description}
                  </p>

                  <div
                    style={{
                      display: "flex",

                      alignItems: "center",

                      justifyContent: "space-between",

                      flexWrap: "wrap",

                      gap: "15px",

                      paddingTop: "15px",

                      borderTop: "1px solid rgba(255, 209, 141, 0.15)",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "12px",

                          display: "block",

                          color: "rgba(255, 235, 209, 0.6)",

                          textTransform: "uppercase",
                        }}
                      >
                        {isUpcomingProduct(product)
                          ? "Giá dự kiến"
                          : "Giá phát hành"}
                      </span>
                      <strong
                        style={{ fontSize: "22px", color: "var(--gold)" }}
                      >
                        {product.price}
                      </strong>
                    </div>

                    <Link
                      to={`/products/${product.slug}`}
                      style={{
                        display: "inline-flex",

                        alignItems: "center",

                        gap: "8px",

                        padding: "12px 24px",

                        borderRadius: "99px",

                        background:
                          "linear-gradient(135deg, var(--gold) 0%, #e8ba75 100%)",

                        color: "#351b18",

                        fontWeight: 700,

                        fontSize: "14px",

                        textTransform: "uppercase",

                        letterSpacing: "0.08em",

                        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",

                        transition: "transform 0.2s ease",
                      }}
                    >
                      Khám phá chi tiết <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* AR 3D Experience Portal Card */}
              <div
                style={{
                  background:
                    "linear-gradient(145deg, #201215 0%, #15090b 100%)",

                  padding: "32px",

                  borderRadius: "16px",

                  border: "1px solid rgba(255, 209, 141, 0.18)",

                  boxShadow: "0 12px 35px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div
                  style={{
                    display: "flex",

                    alignItems: "center",

                    gap: "10px",

                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",

                      height: "36px",

                      borderRadius: "8px",

                      background: "rgba(143, 0, 25, 0.6)",

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      color: "var(--gold)",

                      border: "1px solid rgba(255, 209, 141, 0.25)",
                    }}
                  >
                    <Box size={20} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "20px",

                        color: "#fff7ec",

                        fontFamily: '"Vollkorn", serif',

                        margin: 0,
                      }}
                    >
                      Trải nghiệm Không gian AR & 3D
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--gold)" }}>
                      Thực tế tăng cường trên điện thoại
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "14.5px",

                    lineHeight: 1.6,

                    color: "rgba(255, 235, 209, 0.75)",

                    marginBottom: "20px",
                  }}
                >
                  {isThapRua
                    ? "Quan sát mô hình Tháp Rùa 3D từ nhiều góc nhìn, phóng to để khám phá từng chi tiết thiết kế. Với thiết bị hỗ trợ AR, bạn còn có thể đặt mô hình ảo vào không gian thực thông qua camera điện thoại."
                    : isHangTrong
                      ? "Khám phá không gian kiến trúc phố Hàng Trống và tranh dân gian qua góc nhìn 3D trực quan cùng công nghệ thực tế tăng cường AR trên điện thoại."
                      : "Chiêm ngưỡng từng chi tiết mộng gỗ di sản xoay 360 độ hoặc đặt trực tiếp mô hình vào không gian phòng của bạn thông qua camera và chip NFC gắn kèm sản phẩm."}
                </p>

                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.3)",

                    borderRadius: "10px",

                    padding: "16px",

                    border: "1px dashed rgba(255, 209, 141, 0.2)",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "space-between",

                    flexWrap: "wrap",

                    gap: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",

                      alignItems: "center",

                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",

                        height: "8px",

                        borderRadius: "50%",

                        background: product.modelUrl
                          ? "#10b981"
                          : "var(--gold)",

                        boxShadow: product.modelUrl
                          ? "0 0 10px #10b981"
                          : "0 0 10px rgba(255, 209, 141, 0.5)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",

                        color: "rgba(255, 235, 209, 0.85)",
                      }}
                    >
                      {product.modelUrl
                        ? "Hỗ trợ iOS (QuickLook) & Android (WebXR)"
                        : "Mô hình 3D & AR đang được hoàn thiện"}
                    </span>
                  </div>

                  <div className="heritage-ar-actions">
                    {product.modelUrl ? (
                      <Link
                        className="heritage-ar-camera-link"
                        to={`/ar/${product.id}`}
                      >
                        <Camera size={17} />
                        <span>Mở camera AR</span>
                      </Link>
                    ) : (
                      <span className="heritage-ar-unavailable">AR sắp ra mắt</span>
                    )}
                    <button
                      ref={open3DButtonRef}
                      type="button"
                      disabled={!product.modelUrl}
                      onClick={() => {
                        if (product.modelUrl) setIs3DModalOpen(true)
                      }}
                      className="heritage-3d-button"
                      aria-haspopup="dialog"
                      aria-expanded={is3DModalOpen}
                      aria-controls="heritage-3d-dialog"
                    >
                      <Box size={16} />
                      <span>
                        {product.modelUrl ? "Xem mô hình 3D" : "Sắp ra mắt"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Next Heritage Journey / Other Destinations (Unified, no duplicates) */}
          <section
            id="other-heritages"
            className="reveal"
            style={{
              marginTop: "40px",

              paddingTop: "60px",

              borderTop: "1px solid rgba(255, 209, 141, 0.16)",

              maxWidth: "1200px",

              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",

                alignItems: "flex-end",

                justifyContent: "space-between",

                flexWrap: "wrap",

                gap: "20px",

                marginBottom: "36px",
              }}
            >
              <div>
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
                  TIẾP TỤC HÀNH TRÌNH DI SẢN
                </p>
                <h3
                  style={{
                    fontSize: "clamp(26px, 3.5vw, 34px)",

                    color: "#fff7ec",

                    fontFamily: '"Vollkorn", serif',

                    margin: 0,
                  }}
                >
                  Khám phá các điểm đến tiếp theo
                </h3>
              </div>

              <Link
                to="/heritage"
                style={{
                  display: "inline-flex",

                  alignItems: "center",

                  gap: "8px",

                  color: "var(--gold)",

                  fontSize: "13px",

                  textTransform: "uppercase",

                  letterSpacing: "0.1em",

                  fontWeight: 600,

                  padding: "8px 18px",

                  borderRadius: "99px",

                  border: "1px solid rgba(255, 209, 141, 0.3)",

                  background: "rgba(143, 0, 25, 0.35)",

                  transition: "all 0.2s ease",

                  textDecoration: "none",
                }}
              >
                <Compass size={15} />
                <span>Xem tất cả di sản</span>
              </Link>
            </div>

            <div
              style={{
                display: "grid",

                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",

                gap: "28px",
              }}
            >
              {products.map((p) => {
                const isCurrent = p.slug === product.slug

                return (
                  <div
                    key={p.id}
                    style={{
                      background: isCurrent
                        ? "linear-gradient(145deg, #2a1217 0%, #1a0b0e 100%)"
                        : "linear-gradient(145deg, #201214 0%, #170a0c 100%)",

                      borderRadius: "14px",

                      border: isCurrent
                        ? "1px solid rgba(255, 209, 141, 0.45)"
                        : "1px solid rgba(255, 209, 141, 0.18)",

                      overflow: "hidden",

                      boxShadow: isCurrent
                        ? "0 14px 35px rgba(0, 0, 0, 0.5), 0 0 25px rgba(143, 0, 25, 0.25)"
                        : "0 12px 30px rgba(0, 0, 0, 0.4)",

                      display: "flex",

                      flexDirection: "column",

                      justifyContent: "space-between",

                      transition: "transform 0.3s ease, border-color 0.3s ease",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          height: "210px",

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

                            transition: "transform 0.5s ease",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",

                            top: "14px",

                            left: "14px",

                            padding: "4px 10px",

                            borderRadius: "99px",

                            background: "rgba(143, 0, 25, 0.85)",

                            border: "1px solid rgba(255, 209, 141, 0.4)",

                            color: "var(--gold)",

                            fontSize: "11px",

                            fontWeight: 600,

                            textTransform: "uppercase",

                            letterSpacing: "0.1em",
                          }}
                        >
                          DI SẢN {p.number}
                        </span>

                        {isCurrent && (
                          <span
                            style={{
                              position: "absolute",

                              top: "14px",

                              right: "14px",

                              padding: "4px 10px",

                              borderRadius: "99px",

                              background: "rgba(143, 0, 25, 0.95)",

                              border: "1px solid var(--gold)",

                              color: "var(--gold)",

                              fontSize: "11px",

                              fontWeight: 700,

                              textTransform: "uppercase",

                              letterSpacing: "0.1em",
                            }}
                          >
                            Đang xem
                          </span>
                        )}
                      </div>

                      <div style={{ padding: "24px 24px 16px" }}>
                        <p
                          style={{
                            color: "var(--gold)",

                            fontSize: "12px",

                            textTransform: "uppercase",

                            letterSpacing: "0.1em",

                            marginBottom: "6px",
                          }}
                        >
                          {p.eyebrow}
                        </p>
                        <h4
                          style={{
                            fontSize: "22px",

                            color: "#fff7ec",

                            marginBottom: "10px",

                            fontFamily: '"Vollkorn", serif',

                            fontWeight: 600,
                          }}
                        >
                          {p.name}
                        </h4>
                        <p
                          style={{
                            color: "rgba(255, 235, 209, 0.8)",

                            fontSize: "14px",

                            lineHeight: 1.6,

                            marginBottom: "0",

                            display: "-webkit-box",

                            WebkitLineClamp: 3,

                            WebkitBoxOrient: "vertical",

                            overflow: "hidden",
                          }}
                        >
                          {p.description}
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: "0 24px 24px" }}>
                      <Link
                        to={`/heritage/${p.slug}`}
                        onClick={() => {
                          if (isCurrent) {
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }
                        }}
                        style={{
                          display: "inline-flex",

                          alignItems: "center",

                          gap: "8px",

                          color: "var(--gold)",

                          fontSize: "13px",

                          textTransform: "uppercase",

                          letterSpacing: "0.1em",

                          fontWeight: "bold",

                          paddingTop: "14px",

                          borderTop: "1px solid rgba(255, 209, 141, 0.12)",

                          width: "100%",

                          textDecoration: "none",
                        }}
                      >
                        {isCurrent ? "Đang khám phá" : "Khám phá di sản"}{" "}
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      {/* 3D & AR Interactive Modal Dialog */}
      {is3DModalOpen && product.modelUrl && (
        <div
          id="heritage-3d-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="heritage-3d-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIs3DModalOpen(false)
            }
          }}
        >
          <div
            className="w-full h-full sm:h-[90vh] sm:max-h-[820px] max-w-[1080px] flex flex-col sm:rounded-2xl overflow-hidden shadow-2xl relative"
            style={{
              background: "linear-gradient(145deg, #250f13 0%, #16080a 100%)",

              border: "1px solid rgba(255, 209, 141, 0.35)",

              boxShadow:
                "0 25px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(143, 0, 25, 0.25)",
            }}
          >
            {/* Modal Body: 3D Viewer with unified, integrated header and single close button */}
            <div className="flex-1 relative min-h-0 w-full flex">
              <ModelViewer3D
                src={product.modelUrl}
                iosSrc={product.usdzUrl}
                poster={product.image}
                alt={`Mô hình 3D tương tác ${product.name} - Di sản Kiến Tích Việt`}
                title={product.name}
                onClose={() => setIs3DModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
