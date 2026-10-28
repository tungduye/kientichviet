import { describe, expect, it } from "vitest"

import { products } from "../../data/products"
import { getProductVariants } from "../products/productVariants"
import {
  applyCatalogSettings,
  applyVariantSettings,
  validateProductImage,
  type CatalogSetting,
} from "./catalog"

const settings: CatalogSetting[] = [
  {
    productKey: "p1",
    productId: "p1",
    variantId: null,
    price: "950.000 ₫",
    imageUrl: "https://cdn.example/thap-rua.webp",
    isVisible: true,
    sortOrder: 2,
  },
  {
    productKey: "p2",
    productId: "p2",
    variantId: null,
    price: "890.000 ₫",
    imageUrl: null,
    isVisible: false,
    sortOrder: 1,
  },
  {
    productKey: "p1-basic",
    productId: "p1",
    variantId: "basic",
    price: "870.000 ₫",
    imageUrl: "https://cdn.example/basic.webp",
    isVisible: true,
    sortOrder: 1,
  },
  {
    productKey: "p1-premium",
    productId: "p1",
    variantId: "premium",
    price: "Liên hệ",
    imageUrl: null,
    isVisible: false,
    sortOrder: 3,
  },
]

describe("catalog settings", () => {
  it("hides disabled products from the customer catalog", () => {
    const visibleProducts = applyCatalogSettings(products, settings)

    expect(visibleProducts.map((product) => product.id)).not.toContain("p2")
  })

  it("overrides customer-facing price and image", () => {
    const visibleProducts = applyCatalogSettings(products, settings)
    const thapRua = visibleProducts.find((product) => product.id === "p1")

    expect(thapRua?.price).toBe("950.000 ₫")
    expect(thapRua?.image).toBe("https://cdn.example/thap-rua.webp")
  })

  it("keeps hidden products available to the admin editor", () => {
    const allProducts = applyCatalogSettings(products, settings, true)
    const hiddenProduct = allProducts.find((product) => product.id === "p2")

    expect(hiddenProduct?.isVisible).toBe(false)
  })

  it("fails closed when a catalog row is missing", () => {
    const unconfiguredProduct = products.find((product) => product.id === "p3")!

    expect(applyCatalogSettings([unconfiguredProduct], [])).toEqual([])
    expect(
      applyCatalogSettings([unconfiguredProduct], [], true)[0],
    ).toMatchObject({
      id: "p3",
      isVisible: false,
    })
  })

  it("overrides and hides individual product variants", () => {
    const thapRua = products.find((product) => product.id === "p1")!
    const variants = applyVariantSettings(
      thapRua,
      getProductVariants(thapRua),
      settings,
    )

    expect(variants.map((variant) => variant.id)).not.toContain("premium")
    expect(variants.find((variant) => variant.id === "basic")).toMatchObject({
      price: "870.000 ₫",
      imageUrl: "https://cdn.example/basic.webp",
    })
  })

  it("rejects unsafe or oversized image uploads", () => {
    expect(
      validateProductImage({
        name: "payload.svg",
        type: "image/svg+xml",
        size: 100,
      }),
    ).toMatch(/JPG, PNG hoặc WebP/)

    expect(
      validateProductImage({
        name: "large.webp",
        type: "image/webp",
        size: 5 * 1024 * 1024 + 1,
      }),
    ).toMatch(/5 MB/)
  })

  it("accepts a bounded raster image", () => {
    expect(
      validateProductImage({
        name: "product.webp",
        type: "image/webp",
        size: 900_000,
      }),
    ).toBeNull()
  })
})
