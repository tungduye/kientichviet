import type { Product } from "../../data/products"
import type { ProductVariant } from "../products/productVariants"

export interface CatalogSetting {
  productKey: string
  productId: string
  variantId: string | null
  price: string
  imageUrl: string | null
  imageUrls: string[]
  isVisible: boolean
  sortOrder: number
  revision?: number
}

export interface CatalogProduct extends Product {
  isVisible: boolean
  sortOrder: number
  imageUrls: string[]
}

export interface CatalogVariant extends ProductVariant {
  imageUrl?: string
  imageUrls: string[]
  isVisible: boolean
  sortOrder: number
}

export interface ImageFileMetadata {
  name: string
  type: string
  size: number
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const MAX_PRODUCT_GALLERY_IMAGES = 8

export function resolveCatalogGallery(
  setting?: Pick<CatalogSetting, "imageUrl" | "imageUrls">,
  fallbackImage?: string,
): string[] {
  const configuredImages = (setting?.imageUrls ?? []).filter(Boolean)
  const images = configuredImages.length
    ? configuredImages
    : setting?.imageUrl
      ? [setting.imageUrl]
      : fallbackImage
        ? [fallbackImage]
        : []

  return [...new Set(images)].slice(0, MAX_PRODUCT_GALLERY_IMAGES)
}

export function moveGalleryImageToFront<T>(
  images: T[],
  selectedIndex: number,
): T[] {
  if (selectedIndex <= 0 || selectedIndex >= images.length) return [...images]
  return [
    images[selectedIndex],
    ...images.filter((_, index) => index !== selectedIndex),
  ]
}

export function applyCatalogSettings(
  baseProducts: Product[],
  settings: CatalogSetting[],
  includeHidden = false,
): CatalogProduct[] {
  const settingsByKey = new Map(
    settings
      .filter((setting) => setting.variantId === null)
      .map((setting) => [setting.productKey, setting]),
  )

  return baseProducts
    .map((product, index) => {
      const setting = settingsByKey.get(product.id)
      const imageUrls = resolveCatalogGallery(setting, product.image)

      return {
        ...product,
        price: setting?.price || product.price,
        image: imageUrls[0] || product.image,
        imageUrls,
        isVisible: setting?.isVisible ?? false,
        sortOrder: setting?.sortOrder ?? index + 1,
      }
    })
    .filter((product) => includeHidden || product.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function applyVariantSettings(
  product: Product,
  variants: ProductVariant[],
  settings: CatalogSetting[],
  includeHidden = false,
): CatalogVariant[] {
  const settingsByVariant = new Map(
    settings
      .filter(
        (setting) => setting.productId === product.id && setting.variantId,
      )
      .map((setting) => [setting.variantId, setting]),
  )

  return variants
    .map((variant, index) => {
      const setting = settingsByVariant.get(variant.id)
      const imageUrls = resolveCatalogGallery(setting, variant.imageUrl)

      return {
        ...variant,
        price: setting?.price || variant.price,
        imageUrl: imageUrls[0],
        imageUrls,
        isVisible: setting?.isVisible ?? false,
        sortOrder: setting?.sortOrder ?? index + 1,
      }
    })
    .filter((variant) => includeHidden || variant.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function validateProductImage(file: ImageFileMetadata): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP."
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    return "Ảnh phải có dung lượng từ 1 byte đến 5 MB."
  }

  return null
}
