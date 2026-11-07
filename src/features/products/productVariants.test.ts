import { describe, expect, it } from "vitest"

import { products } from "../../data/products"
import { buildVariantProduct, getProductVariants } from "./productVariants"

describe("Product variants", () => {
  const thapRua = products.find((product) => product.slug === "thap-rua")!

  it("offers Basic, Signature and Premium in the requested order", () => {
    const variants = getProductVariants(thapRua)

    expect(variants.map((variant) => variant.id)).toEqual([
      "basic",
      "signature",
      "premium",
    ])
    expect(variants.map((variant) => variant.name)).toEqual([
      "Basic",
      "Signature",
      "Premium",
    ])
    expect(variants[0].finish).toContain("không màu")
    expect(variants[0].imageMode).toBe("color")
    expect(variants[1].finish).toContain("có màu")
    expect(variants[2].finish).toContain("mosaic")
  })

  it("uses the current price for Basic and contact labels for unpriced editions", () => {
    const variants = getProductVariants(thapRua)

    expect(variants[0].price).toBe("820.000 ₫")
    expect(variants[1].price).toBe("Liên hệ")
    expect(variants[2].price).toBe("Liên hệ")
  })

  it("builds distinct cart products for each edition", () => {
    const variants = getProductVariants(thapRua)
    const cartProducts = variants.map((variant) =>
      buildVariantProduct(thapRua, variant),
    )

    expect(cartProducts.map((product) => product.id)).toEqual([
      "p1-basic",
      "p1-signature",
      "p1-premium",
    ])
    expect(cartProducts[2].name).toBe("Tháp Rùa · Premium")
  })

  it("offers Basic and Signature for Phố Hàng Trống", () => {
    const phoHangTrong = products.find(
      (product) => product.slug === "pho-hang-trong",
    )!

    const variants = getProductVariants(phoHangTrong)

    expect(variants.map((variant) => variant.id)).toEqual(["basic", "signature"])
    expect(variants[0].price).toBe("790.000 ₫")
    expect(variants[0].imageMode).toBe("color")
    expect(variants[1].price).toBe("Liên hệ")
  })

  it("uses the Premium specifications for the Premium cart item", () => {
    const premium = getProductVariants(thapRua).find(
      (variant) => variant.id === "premium",
    )!
    const product = buildVariantProduct(thapRua, premium)

    expect(product.specifications.time).toBe("15 tiếng")
    expect(product.specifications.material).toContain("mosaic")
  })
})
