import { useEffect } from "react"

import { Icon } from "../Shared"

import { useCart } from "../../context/CartContext"

import { Link } from "react-router-dom"

export default function CartDrawer() {
  const {
    cartOpen,

    setCartOpen,

    cartCount,

    cartItems,

    updateQuantity,

    removeFromCart,
  } = useCart()

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : ""

    return () => {
      document.body.style.overflow = ""
    }
  }, [cartOpen])

  const subtotal = cartItems.reduce((total, item) => {
    const numericPrice = parseInt(item.product.price.replace(/\D/g, "")) || 0

    return total + numericPrice * item.quantity
  }, 0)

  const hasContactItems = cartItems.some(
    (item) => item.product.price === "Liên hệ",
  )

  return (
    <div
      className={`cart-drawer-wrap ${cartOpen ? "is-open" : ""}`}
      aria-hidden={!cartOpen}
    >
      <button
        className="cart-backdrop"
        onClick={() => setCartOpen(false)}
        aria-label="Đóng giỏ hàng"
      />
      <aside className="cart-drawer">
        <div className="cart-head">
          <div>
            <p>Đơn hàng của bạn</p>
            <h2>Giỏ hàng ({cartCount})</h2>
          </div>
          <button onClick={() => setCartOpen(false)} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </div>
        {cartCount === 0 ? (
          <div className="empty-cart">
            <Icon name="bag" size={42} />
            <h3>Giỏ hàng còn trống</h3>
            <p>Một dấu tích đang chờ bạn tự tay dựng nên.</p>
            <Link to="/products" onClick={() => setCartOpen(false)}>
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items" style={{ flex: 1, overflowY: "auto" }}>
              {cartItems.map((item) => (
                <div
                  className="cart-product"
                  key={item.product.id}
                  style={{ marginBottom: "20px" }}
                >
                  <Link
                    to={`/products/${item.product.slug}`}
                    onClick={() => setCartOpen(false)}
                    style={{ display: "block" }}
                  >
                    <img src={item.product.image} alt={item.product.name} />
                  </Link>
                  <div>
                    <small>
                      {item.product.eyebrow.split("·")[0].trim() ||
                        "Bộ sưu tập Thăng Long"}
                    </small>
                    <h3>
                      <Link
                        to={`/products/${item.product.slug}`}
                        onClick={() => setCartOpen(false)}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {item.product.name}
                      </Link>
                    </h3>
                    <div
                      style={{
                        display: "flex",

                        alignItems: "center",

                        gap: "15px",

                        marginTop: "10px",
                      }}
                    >
                      <div
                        className="quantity-controls"
                        style={{
                          display: "flex",

                          alignItems: "center",

                          gap: "15px",

                          border: "1px solid rgba(255, 235, 209, 0.2)",

                          padding: "4px 12px",

                          borderRadius: "4px",
                        }}
                      >
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          style={{
                            opacity: item.quantity <= 1 ? 0.5 : 1,

                            cursor:
                              item.quantity <= 1 ? "not-allowed" : "pointer",

                            background: "none",

                            border: "none",

                            color: "inherit",

                            fontSize: "18px",
                          }}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          style={{
                            background: "none",

                            border: "none",

                            color: "inherit",

                            fontSize: "18px",

                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        style={{
                          color: "var(--color-primary)",

                          textDecoration: "underline",

                          fontSize: "12px",
                        }}
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                  <strong>{item.product.price}</strong>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <span>Tạm tính</span>
              <strong>
                {hasContactItems
                  ? "Liên hệ xác nhận"
                  : `${subtotal.toLocaleString("vi-VN")}₫`}
              </strong>
            </div>
            <Link
              to="/cart"
              onClick={() => setCartOpen(false)}
              className="checkout-button"
            >
              Tiến hành đặt hàng <Icon name="arrow" />
            </Link>
          </>
        )}
      </aside>
    </div>
  )
}
