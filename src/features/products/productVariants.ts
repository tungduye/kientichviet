import type { Product, ProductSpecifications } from "../../data/products"

export type ProductImageMode = "monochrome" | "color" | "placeholder"

export interface ProductVariant {
  id: "basic" | "signature" | "premium"
  name: string
  finish: string
  description: string
  price: string
  imageMode: ProductImageMode
  imageUrl?: string
  specifications?: ProductSpecifications
}

const THAP_RUA_VARIANTS: ProductVariant[] = [
  {
    id: "basic",
    name: "Basic",
    finish: "Gỗ không màu",
    description: "Giữ vẻ mộc nguyên bản để làm nổi bật cấu trúc lắp ghép.",
    price: "820.000 ₫",
    // "Gỗ không màu" describes the unpainted material, not a black-and-white photo.
    imageMode: "color",
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
    specifications: {
      pieces: "150",
      time: "15 tiếng",
      difficulty: "Trung bình",
      material: "Gỗ basswood kết hợp khảm đá mosaic",
      size: "20 × 20 × 30 cm",
      audience: "15 tuổi trở lên",
    },
  },
]

const CHUA_MOT_COT_VARIANTS: ProductVariant[] = [
  {
    id: "basic",
    name: "Basic",
    finish: "COMING SOON",
    description: "Đang cập nhật",
    price: "COMING SOON",
    imageMode: "color",
  },
  {
    id: "signature",
    name: "Signature",
    finish: "COMING SOON",
    description: "Đang cập nhật",
    price: "COMING SOON",
    imageMode: "color",
  },
  {
    id: "premium",
    name: "Premium",
    finish: "COMING SOON",
    description: "Đang cập nhật",
    price: "COMING SOON",
    imageMode: "placeholder",
  },
]

const PHO_HANG_TRONG_VARIANTS: ProductVariant[] = [
  {
    id: "basic",
    name: "Basic",
    finish: "Gỗ không màu",
    description: "Phiên bản gỗ mộc nguyên bản của mô hình Phố Hàng Trống.",
    price: "790.000 ₫",
    // Keep the original product-photo colors for the natural wood edition.
    imageMode: "color",
  },
  {
    id: "signature",
    name: "Signature",
    finish: "Phiên bản có màu",
    description: "Phiên bản hoàn thiện màu theo tinh thần phố nghề Hàng Trống.",
    price: "Liên hệ",
    imageMode: "color",
  },
]

export function getProductVariants(product: Product): ProductVariant[] {
  if (product.slug === "thap-rua") return THAP_RUA_VARIANTS
  if (product.slug === "chua-mot-cot") return CHUA_MOT_COT_VARIANTS
  if (product.slug === "pho-hang-trong") return PHO_HANG_TRONG_VARIANTS
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
    specifications: variant.specifications || product.specifications,
  }
}
