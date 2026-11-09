import type { Product } from "../../data/products"

type HeritageImageProduct = Pick<Product, "slug" | "image">

export function getHeritageImage(product: HeritageImageProduct) {
  if (product.slug === "thap-rua") {
    return "/images/thap-rua-product-main.png"
  }

  if (product.slug === "pho-hang-trong") {
    return "/images/pho-hang-trong-heritage-horizontal.png"
  }

  return product.image
}

export function getHeritageImageAspectRatio(slug: string) {
  if (slug === "thap-rua") return "3 / 2"
  if (slug === "pho-hang-trong") return "1672 / 941"
  return "809 / 680"
}
