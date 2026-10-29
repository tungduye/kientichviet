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

const CHUA_MOT_COT_VARIANTS: ProductVariant[] = [
  {
    id: "basic",
    name: "Basic",
    finish: "Gỗ không màu",
    description: "Phiên bản cơ bản của mô hình Chùa Một Cột đang được hoàn thiện.",
    price: "COMING SOON",
    imageMode: "monochrome",
  },
  {
    id: "signature",
    name: "Signature",
    finish: "Phiên bản có màu",
    description: "Phiên bản màu của Chùa Một Cột sẽ được giới thiệu sau.",
    price: "COMING SOON",
    imageMode: "color",
  },
  {
    id: "premium",
    name: "Premium",
    finish: "Khảm mosaic · COMING SOON",
    description: "Phiên bản Premium khảm mosaic đang trong giai đoạn chuẩn bị.",
    price: "COMING SOON",
    imageMode: "placeholder",
  },
]

export function getProductVariants(product: Product): ProductVariant[] {
  if (product.slug === "thap-rua") return THAP_RUA_VARIANTS
  if (product.slug === "chua-mot-cot") return CHUA_MOT_COT_VARIANTS
  return []
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
