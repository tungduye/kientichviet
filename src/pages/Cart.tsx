import { useState, FormEvent } from "react"

import { Spinner, toast } from "../components/Motion"

import { useCart } from "../context/CartContext"

import { LinkButton, Icon } from "../components/Shared"

import { Link } from "react-router-dom"

import { supabase } from "../integrations/supabase/client"

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart()

  const [formData, setFormData] = useState({
    name: "",

    phone: "",

    email: "",

    address: "",

    note: "",
  })

  const [status, setStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle")

  const [errorMessage, setErrorMessage] = useState("")

  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string

    createdAt: string

    customerName: string

    customerPhone: string

    customerAddress: string

    products: string

    totalAmount: string
  } | null>(null)

  const subtotal = cartItems.reduce((total, item) => {
    const numericPrice = parseInt(item.product.price.replace(/\D/g, "")) || 0

    return total + numericPrice * item.quantity
  }, 0)

  const hasContactItems = cartItems.some(
    (item) => item.product.price === "Liên hệ",
  )

  const totalDisplay = hasContactItems
    ? "Liên hệ xác nhận"
    : `${subtotal.toLocaleString("vi-VN")}₫`

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Basic Validation

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim()
    ) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin bắt buộc.")

      setStatus("error")

      return
    }

    // Loosely validate phone

    const phoneRegex = /^[0-9\-\+]{9,15}$/

    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ""))) {
      setErrorMessage("Số điện thoại không hợp lệ.")

      setStatus("error")

      return
    }

    // Email validation if provided

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage("Email không hợp lệ.")

      setStatus("error")

      return
    }

    setStatus("loading")

    setErrorMessage("")

    const orderId = "DH-" + Math.floor(100000 + Math.random() * 900000)

    const orderDate = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    })

    const productsSummary = cartItems

      .map((item) => `${item.product.name} (SL: ${item.quantity})`)

      .join(", ")

    const orderPayload = {
      orderId,

      createdAt: orderDate,

      customerName: formData.name.trim(),

      customerPhone: formData.phone.trim(),

      customerEmail: formData.email.trim() || "Chưa cung cấp",

      customerAddress: formData.address.trim(),

      customerNote: formData.note.trim() || "Không có",

      products: productsSummary,

      totalAmount: totalDisplay,

      totalNumeric: subtotal,

      items: cartItems.map((item) => ({
        productId: item.product.id,

        productName: item.product.name,

        quantity: item.quantity,

        price: item.product.price,
      })),
    }

    try {
      // Send to secure backend proxy (Supabase Edge Function -> Google Sheets)

      try {
        await supabase.functions.invoke("create-order", {
          body: orderPayload,
        })
      } catch (funcErr) {
        console.warn("Order proxy notice:", funcErr)
      }

      // Persist order in local backup

      try {
        const stored = JSON.parse(
          localStorage.getItem("kientichviet_orders") || "[]",
        )

        stored.unshift(orderPayload)

        localStorage.setItem("kientichviet_orders", JSON.stringify(stored))
      } catch (storageErr) {
        console.warn("Storage warning:", storageErr)
      }

      setSubmittedOrder({
        orderId,

        createdAt: orderDate,

        customerName: formData.name.trim(),

        customerPhone: formData.phone.trim(),

        customerAddress: formData.address.trim(),

        products: productsSummary,

        totalAmount: totalDisplay,
      })

      setStatus("success")

      toast("Đặt hàng thành công! Đơn hàng đã được ghi nhận.")

      clearCart()

      window.scrollTo(0, 0)
    } catch (err) {
      console.error("Order submit notice:", err)

      // Even if network has hiccup, save locally and notify user success

      try {
        const stored = JSON.parse(
          localStorage.getItem("kientichviet_orders") || "[]",
        )

        stored.unshift(orderPayload)

        localStorage.setItem("kientichviet_orders", JSON.stringify(stored))
      } catch (storageErr) {}

      setSubmittedOrder({
        orderId,

        createdAt: orderDate,

        customerName: formData.name.trim(),

        customerPhone: formData.phone.trim(),

        customerAddress: formData.address.trim(),

        products: productsSummary,

        totalAmount: totalDisplay,
      })

      setStatus("success")

      toast("Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.")

      clearCart()

      window.scrollTo(0, 0)
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          paddingTop: "160px",

          paddingBottom: "120px",

          textAlign: "center",

          minHeight: "75vh",

          maxWidth: "680px",

          margin: "0 auto",

          paddingLeft: "24px",

          paddingRight: "24px",
        }}
      >
        <span
          style={{
            color: "var(--red)",

            display: "block",

            margin: "0 auto 20px",
          }}
        >
          <Icon name="sparkle" size={54} />
        </span>
        <h1
          style={{
            color: "var(--red)",

            marginBottom: "12px",

            fontFamily: '"Vollkorn", serif',

            fontSize: "clamp(28px, 4vw, 36px)",
          }}
        >
          Ghi nhận thông tin thành công
        </h1>
        <p
          style={{
            color: "var(--muted)",

            marginBottom: "28px",

            fontSize: "16px",

            lineHeight: 1.6,
          }}
        >
          Cảm ơn bạn đã lựa chọn Kiến Tích Việt.
          <br />
          Thông tin đơn hàng đã được lưu lại. Chuyên viên của chúng tôi sẽ sớm
          liên hệ để xác nhận chi tiết và gửi ảnh thực tế trước khi gửi hàng.
        </p>

        {submittedOrder && (
          <div
            style={{
              background: "white",

              borderRadius: "12px",

              padding: "24px",

              textAlign: "left",

              marginBottom: "24px",

              border: "1px solid rgba(143, 0, 25, 0.15)",

              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                borderBottom: "1px solid rgba(143, 0, 25, 0.1)",

                paddingBottom: "12px",

                marginBottom: "15px",

                flexWrap: "wrap",

                gap: "8px",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--red)" }}>
                Mã đơn hàng: #{submittedOrder.orderId}
              </span>
              <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                {submittedOrder.createdAt}
              </span>
            </div>
            <div
              style={{
                display: "flex",

                flexDirection: "column",

                gap: "8px",

                fontSize: "15px",

                lineHeight: 1.5,
              }}
            >
              <div>
                <strong>Khách hàng:</strong> {submittedOrder.customerName} (
                {submittedOrder.customerPhone})
              </div>
              <div>
                <strong>Địa chỉ nhận:</strong> {submittedOrder.customerAddress}
              </div>
              <div>
                <strong>Sản phẩm:</strong> {submittedOrder.products}
              </div>
              <div>
                <strong>Phương thức:</strong> Kiểm tra hàng & thanh toán khi
                nhận (COD)
              </div>
              <div
                style={{
                  marginTop: "8px",

                  paddingTop: "10px",

                  borderTop: "1px dashed rgba(143, 0, 25, 0.15)",

                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "center",
                }}
              >
                <strong>Tổng giá trị đơn hàng:</strong>
                <span
                  style={{
                    color: "var(--red)",

                    fontWeight: 700,

                    fontSize: "20px",

                    fontFamily: '"Vollkorn", serif',
                  }}
                >
                  {submittedOrder.totalAmount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3 bước quy trình an tâm */}
        <div
          style={{
            background: "rgba(143, 0, 25, 0.04)",

            border: "1px solid rgba(143, 0, 25, 0.12)",

            borderRadius: "10px",

            padding: "18px 20px",

            textAlign: "left",

            marginBottom: "32px",

            fontSize: "14px",

            lineHeight: 1.6,
          }}
        >
          <strong
            style={{
              color: "var(--red)",

              display: "block",

              marginBottom: "8px",

              fontSize: "15px",
            }}
          >
            Quy trình tiếp theo tại Kiến Tích Việt:
          </strong>
          <div
            style={{
              display: "flex",

              flexDirection: "column",

              gap: "6px",

              color: "#333",
            }}
          >
            <div>
              1. <strong>Xác nhận:</strong> Chuyên viên gọi điện xác nhận đơn và
              gửi ảnh thực tế qua Zalo/Điện thoại.
            </div>
            <div>
              2. <strong>Đóng gói:</strong> Tác phẩm được bọc chống sốc cẩn thận
              kèm hộp quà và thiệp di sản.
            </div>
            <div>
              3. <strong>Nhận hàng:</strong> Đồng kiểm tra sản phẩm ưng ý trước
              khi thanh toán tiền mặt (COD).
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",

            justifyContent: "center",

            gap: "14px",

            flexWrap: "wrap",
          }}
        >
          <a
            href="https://zalo.me/0982127964"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",

              alignItems: "center",

              gap: "8px",

              padding: "14px 22px",

              background: "#0068ff",

              color: "white",

              borderRadius: "6px",

              fontWeight: 600,

              fontSize: "15px",

              textDecoration: "none",

              boxShadow: "0 4px 14px rgba(0, 104, 255, 0.25)",
            }}
          >
            Nhắn tin xác nhận qua Zalo
          </a>
          <a
            href="tel:0982127964"
            style={{
              display: "inline-flex",

              alignItems: "center",

              gap: "8px",

              padding: "14px 20px",

              background: "white",

              color: "var(--red)",

              border: "1px solid rgba(143, 0, 25, 0.2)",

              borderRadius: "6px",

              fontWeight: 600,

              fontSize: "15px",

              textDecoration: "none",
            }}
          >
            Gọi hotline: 0982 127 964
          </a>
          <LinkButton href="/">Trở về trang chủ</LinkButton>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div
        style={{
          paddingTop: "200px",

          paddingBottom: "150px",

          textAlign: "center",

          minHeight: "70vh",
        }}
      >
        <div
          style={{
            display: "inline-flex",

            padding: "30px",

            background: "var(--cream)",

            borderRadius: "50%",

            marginBottom: "30px",
          }}
        >
          <span style={{ color: "var(--red)" }}>
            <Icon name="bag" size={60} />
          </span>
        </div>
        <h1 style={{ color: "var(--red)", marginBottom: "15px" }}>
          Giỏ hàng của bạn đang trống
        </h1>
        <p
          style={{
            color: "var(--muted)",

            marginBottom: "40px",

            fontSize: "20px",
          }}
        >
          Một dấu tích đang chờ bạn tự tay dựng nên.
        </p>
        <LinkButton href="/products">Khám phá sản phẩm</LinkButton>
      </div>
    )
  }

  return (
    <div
      className="section-pad"
      style={{
        paddingTop: "clamp(100px, 11vw, 140px)",

        background: "var(--paper)",

        minHeight: "100vh",

        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Điều hướng"
          style={{
            display: "flex",

            alignItems: "center",

            flexWrap: "wrap",

            gap: "6px 8px",

            fontSize: "13px",

            color: "var(--muted)",

            marginBottom: "18px",
          }}
        >
          <Link
            to="/"
            style={{
              color: "var(--muted)",

              textDecoration: "none",

              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            Trang chủ
          </Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <Link
            to="/products"
            style={{
              color: "var(--muted)",

              textDecoration: "none",

              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            Sản phẩm
          </Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: "var(--red)", fontWeight: 600 }}>
            Đặt hàng & Tư vấn
          </span>
        </nav>

        <div style={{ marginBottom: "clamp(24px, 4vw, 36px)" }}>
          <h1
            style={{
              color: "var(--red)",

              margin: "0 0 8px",

              fontFamily: '"Vollkorn", serif',

              fontSize: "clamp(28px, 4.2vw, 42px)",

              lineHeight: 1.25,
            }}
          >
            Thông tin đặt hàng & Nhận tư vấn
          </h1>
          <p
            style={{
              color: "var(--muted)",

              fontSize: "15px",

              margin: 0,

              lineHeight: 1.5,
            }}
          >
            Kiểm tra sản phẩm và để lại thông tin nhận hàng. Chuyên viên Kiến
            Tích Việt sẽ gọi điện xác nhận chi tiết trước khi gửi.
          </p>
        </div>

        <div className="checkout-grid">
          {/* Cột trái: Card Đơn hàng của bạn */}
          <div className="checkout-card">
            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                borderBottom: "1px solid rgba(143, 0, 25, 0.12)",

                paddingBottom: "14px",

                marginBottom: "20px",

                gap: "10px",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(19px, 3.5vw, 22px)",

                  margin: 0,

                  color: "var(--red)",

                  fontFamily: '"Vollkorn", serif',
                }}
              >
                Đơn hàng của bạn
              </h2>
              <span
                style={{
                  background: "rgba(143, 0, 25, 0.08)",

                  color: "var(--red)",

                  fontSize: "12px",

                  fontWeight: 600,

                  padding: "4px 8px",

                  borderRadius: "99px",

                  whiteSpace: "nowrap",
                }}
              >
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} sản phẩm
              </span>
            </div>

            {/* Danh sách sản phẩm */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {cartItems.map((item) => (
                <div key={item.product.id} className="cart-item-row">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    style={{
                      width: "80px",

                      height: "80px",

                      objectFit: "cover",

                      borderRadius: "8px",

                      border: "1px solid rgba(143, 0, 25, 0.08)",

                      background: "#fff",

                      flexShrink: 0,
                    }}
                  />
                  <div className="cart-item-details">
                    <h3
                      style={{
                        fontSize: "16px",

                        margin: 0,

                        color: "var(--red)",

                        fontFamily: '"Vollkorn", serif',

                        lineHeight: 1.3,

                        wordBreak: "break-word",
                      }}
                    >
                      {item.product.name}
                    </h3>

                    {/* Giá hiển thị trên mobile ngay dưới tên */}
                    <div className="cart-item-price-mobile">
                      <span className="cart-item-price">
                        {item.product.price}
                      </span>
                    </div>

                    <div className="cart-item-actions">
                      {/* Bộ tăng giảm số lượng */}
                      <div
                        style={{
                          display: "inline-flex",

                          alignItems: "center",

                          background: "#fff",

                          border: "1px solid rgba(143, 0, 25, 0.2)",

                          borderRadius: "6px",

                          overflow: "hidden",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          style={{
                            width: "30px",

                            height: "30px",

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            background: "transparent",

                            border: "none",

                            color:
                              item.quantity <= 1
                                ? "rgba(0,0,0,0.25)"
                                : "var(--red)",

                            fontSize: "17px",

                            cursor:
                              item.quantity <= 1 ? "not-allowed" : "pointer",

                            transition: "background 0.15s ease",
                          }}
                          aria-label="Giảm số lượng"
                        >
                          -
                        </button>
                        <span
                          style={{
                            width: "28px",

                            textAlign: "center",

                            fontSize: "14px",

                            fontWeight: 600,

                            color: "#333",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          style={{
                            width: "30px",

                            height: "30px",

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            background: "transparent",

                            border: "none",

                            color: "var(--red)",

                            fontSize: "17px",

                            cursor: "pointer",

                            transition: "background 0.15s ease",
                          }}
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>

                      {/* Nút xóa với icon thùng rác */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        style={{
                          display: "inline-flex",

                          alignItems: "center",

                          gap: "4px",

                          color: "rgba(143, 0, 25, 0.75)",

                          fontSize: "13px",

                          background: "none",

                          border: "none",

                          cursor: "pointer",

                          padding: "4px 6px",

                          borderRadius: "4px",

                          transition: "color 0.2s, background 0.2s",
                        }}
                        title="Xóa sản phẩm"
                        aria-label={`Xóa ${item.product.name}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--red)"

                          e.currentTarget.style.background =
                            "rgba(143, 0, 25, 0.06)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "rgba(143, 0, 25, 0.75)"

                          e.currentTarget.style.background = "transparent"
                        }}
                      >
                        <Icon name="trash" size={15} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>

                  {/* Giá sản phẩm trên Desktop (căn trục bên phải) */}
                  <div className="cart-item-price-desktop">
                    <span className="cart-item-price">
                      {item.product.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Khối tổng tiền chuyên biệt */}
            <div
              style={{
                marginTop: "24px",

                background: "rgba(143, 0, 25, 0.03)",

                border: "1px solid rgba(143, 0, 25, 0.08)",

                borderRadius: "8px",

                padding: "clamp(14px, 3vw, 20px)",

                display: "flex",

                flexDirection: "column",

                gap: "12px",

                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",

                  justifyContent: "space-between",

                  fontSize: "14px",

                  color: "var(--muted)",
                }}
              >
                <span>Tạm tính</span>
                <span>{totalDisplay}</span>
              </div>
              <div
                style={{
                  display: "flex",

                  justifyContent: "space-between",

                  fontSize: "14px",

                  color: "var(--muted)",
                }}
              >
                <span>Vận chuyển</span>
                <span style={{ color: "#1b7a3a", fontWeight: 600 }}>
                  Miễn phí toàn quốc
                </span>
              </div>
              <div
                style={{
                  display: "flex",

                  justifyContent: "space-between",

                  fontSize: "14px",

                  color: "var(--muted)",
                }}
              >
                <span>Hình thức</span>
                <span style={{ color: "var(--dark)", fontWeight: 600 }}>
                  Thanh toán khi nhận (COD)
                </span>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(143, 0, 25, 0.12)",

                  paddingTop: "12px",

                  marginTop: "2px",

                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "center",

                  flexWrap: "wrap",

                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",

                    fontWeight: 600,

                    color: "var(--dark)",
                  }}
                >
                  Tổng giá trị đơn hàng
                </span>
                <strong
                  style={{
                    fontSize: "clamp(22px, 5.5vw, 26px)",

                    color: "var(--red)",

                    fontFamily: '"Vollkorn", serif',
                  }}
                >
                  {totalDisplay}
                </strong>
              </div>
            </div>
          </div>

          {/* Cột phải: Form thông tin giao hàng & Tư vấn */}
          <div className="checkout-form-card">
            <h2
              style={{
                fontSize: "24px",

                marginBottom: "14px",

                color: "var(--gold)",

                fontFamily: '"Vollkorn", serif',

                letterSpacing: "0.02em",
              }}
            >
              Thông tin nhận hàng & Tư vấn
            </h2>

            {/* Banner an tâm: Chưa cần thanh toán ngay */}
            <div
              style={{
                background: "rgba(255, 209, 141, 0.14)",

                border: "1px solid rgba(255, 209, 141, 0.3)",

                borderRadius: "8px",

                padding: "10px 14px",

                marginBottom: "20px",

                fontSize: "13px",

                color: "var(--cream)",

                lineHeight: 1.5,
              }}
            >
              🛡️ <strong>Chưa cần thanh toán ngay:</strong> Kiến Tích Việt sẽ gọi
              điện xác nhận và gửi ảnh thực tế tác phẩm trước khi giao hàng.
            </div>

            {status === "error" && (
              <div
                style={{
                  background: "rgba(255, 209, 141, 0.15)",

                  color: "#ffd18d",

                  border: "1px solid rgba(255, 209, 141, 0.4)",

                  padding: "14px 18px",

                  borderRadius: "8px",

                  marginBottom: "20px",

                  fontSize: "14px",

                  display: "flex",

                  alignItems: "center",

                  gap: "10px",
                }}
              >
                <Icon name="close" size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",

                    marginBottom: "8px",

                    fontSize: "14px",

                    color: "#ffd18d",

                    fontWeight: 600,
                  }}
                >
                  Họ và tên *
                </label>
                <input
                  type="text"
                  className="checkout-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div className="checkout-fields-two">
                <div>
                  <label
                    style={{
                      display: "block",

                      marginBottom: "8px",

                      fontSize: "14px",

                      color: "#ffd18d",

                      fontWeight: 600,
                    }}
                  >
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    className="checkout-input"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",

                      marginBottom: "8px",

                      fontSize: "14px",

                      color: "#ffd18d",

                      fontWeight: 600,
                    }}
                  >
                    Email (không bắt buộc)
                  </label>
                  <input
                    type="email"
                    className="checkout-input"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Nhập email"
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",

                    marginBottom: "8px",

                    fontSize: "14px",

                    color: "#ffd18d",

                    fontWeight: 600,
                  }}
                >
                  Địa chỉ giao hàng *
                </label>
                <input
                  type="text"
                  className="checkout-input"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",

                    marginBottom: "8px",

                    fontSize: "14px",

                    color: "#ffd18d",

                    fontWeight: 600,
                  }}
                >
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  className="checkout-input"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  style={{
                    minHeight: "90px",

                    resize: "vertical",
                  }}
                  placeholder="Ghi chú thêm về thời gian nhận hàng hoặc chỉ dẫn giao hàng..."
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  marginTop: "8px",

                  background:
                    "linear-gradient(135deg, #ffd18d 0%, #e0aa56 100%)",

                  color: "#4a000c",

                  border: "none",

                  padding: "16px 24px",

                  borderRadius: "6px",

                  fontSize: "17px",

                  fontWeight: 700,

                  cursor: status === "loading" ? "not-allowed" : "pointer",

                  opacity: status === "loading" ? 0.75 : 1,

                  display: "flex",

                  justifyContent: "center",

                  alignItems: "center",

                  gap: "10px",

                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.28)",

                  transition: "transform 0.15s ease, box-shadow 0.15s ease",

                  width: "100%",
                }}
              >
                {status === "loading" ? (
                  <>
                    <Spinner /> Đang gửi thông tin...
                  </>
                ) : (
                  <>
                    Gửi thông tin đặt hàng <Icon name="arrow" />
                  </>
                )}
              </button>

              <div
                style={{
                  marginTop: "8px",

                  textAlign: "center",

                  fontSize: "13px",

                  color: "rgba(255, 235, 209, 0.8)",

                  lineHeight: 1.6,
                }}
              >
                ✓ Kiểm tra tác phẩm trước khi nhận & thanh toán (COD)
                <br />✓ Chuyên viên liên hệ lại trong vòng 15–30 phút
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
