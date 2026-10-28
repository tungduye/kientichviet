import type { Product } from "../../data/products"

export type ProductImageMode = "monochrome" | "color" | "placeholder"

export interface ProductVariant {
  id: "basic" | "signature" | "premium"
  name: string
  finish: string
  description: string
  price: string
  imageMode: ProductImageMode
  imageUrl?: string
}

const THAP_RUA_VARIANTS: ProductVariant[] = [
  {
    id: "basic",
    name: "Basic",
    finish: "Gỗ không màu",
    description: "Giữ vẻ mộc nguyên bản để làm nổi bật cấu trúc lắp ghép.",
    price: "820.000 ₫",
    imageMode: "monochrome",
  },
  {
    id: "signature",
    name: "Signature",
    finish: "Phiên bản có màu",
    description: "Hoàn thiện màu sắc theo tinh thần Tháp Rùa giữa Hồ Gươm.",
    price: "Liên hệ",
    imageMode: "color",
  },
  {
    id: "premium",
    name: "Premium",
    finish: "Khảm mosaic",
    description: "Phiên bản thủ công cao cấp với bề mặt khảm mosaic.",
    price: "Liên hệ",
    imageMode: "placeholder",
  },
]

export function getProductVariants(product: Product): ProductVariant[] {
  return product.slug === "thap-rua" ? THAP_RUA_VARIANTS : []
}

export function buildVariantProduct(
  product: Product,
  variant: ProductVariant,
): Product {
  return {
    ...product,
    id: `${product.id}-${variant.id}`,
    name: `${product.name} · ${variant.name}`,
    price: variant.price,
    image: variant.imageUrl || product.image,
  }
}
