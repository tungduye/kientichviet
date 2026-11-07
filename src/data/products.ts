export interface ProductSpecifications {
  pieces: string
  time: string
  difficulty: string
  material: string
  size: string
  audience: string
}

export interface Product {
  id: string
  slug: string
  legacySlugs?: string[]
  name: string
  eyebrow: string
  price: string
  image: string
  listingImage?: string
  number: string
  accent: string
  description: string
  modelUrl?: string
  usdzUrl?: string
  specifications: ProductSpecifications
  audioUrl?: string
  audioTitle?: string
  audioAuthor?: string
}

export const UPCOMING_PRODUCT_ACCENT = "COMING SOON"

const PRODUCT_DISPLAY_ORDER = ["p3", "p1", "p2"]

export const products: Product[] = [
  {
    id: "p1",
    slug: "thap-rua",
    legacySlugs: ["thap-pho-minh"],
    name: "Tháp Rùa",
    eyebrow: "Hà Nội · Hồ Gươm",
    price: "369.000 ₫",
    image: "/images/thap-rua-product-main.png",
    listingImage: "/images/thap-rua-angle-front.jpg",
    number: "02",
    accent: "Mới",
    description:
      "Mô hình lắp ghép gỗ 3D tái hiện Tháp Rùa, biểu tượng quen thuộc giữa lòng Hồ Gươm.",
    modelUrl: "/models/Thap-rua-model.glb",
    usdzUrl: "/models/Thap-rua-model.usdz",
    audioUrl: "/audio/thap-rua.mp3",
    audioTitle: "Tháp Rùa — Biểu tượng giữa lòng Hồ Hoàn Kiếm",
    audioAuthor: "Thuyết minh Di sản · Kiến Tích Việt",
    specifications: {
      pieces: "150",
      time: "10 tiếng",
      difficulty: "Trung bình",
      material: "Gỗ basswood",
      size: "20 × 20 × 30 cm",
      audience: "15 tuổi trở lên",
    },
  },
  {
    id: "p2",
    slug: "chua-mot-cot",
    name: "Chùa Một Cột",
    eyebrow: "Hà Nội · Di sản Thăng Long",
    price: UPCOMING_PRODUCT_ACCENT,
    image: "/images/chua-mot-cot.jpg",
    number: "03",
    accent: UPCOMING_PRODUCT_ACCENT,
    description:
      "Mô hình lắp ghép gỗ 3D lấy cảm hứng từ kiến trúc độc đáo mang hình tượng đóa sen của Chùa Một Cột.",
    audioUrl:
      "/audio/chuyen_ve_doa_sen_go_cua_ngan_nam_van_hienco_270f3316-cf23-4e17-8255-8693ab8597a5.mp3",
    audioTitle: "Chuyện về đóa sen gỗ của ngàn năm văn hiến",
    audioAuthor: "Thuyết minh Di sản · Kiến Tích Việt",
    specifications: {
      pieces: "xxx", // Cập nhật thành xxx mảnh theo feedback
      time: "Đang cập nhật",
      difficulty: "Đang cập nhật",
      material: "Đang cập nhật",
      size: "Đang cập nhật",
      audience: "Đang cập nhật",
    },
  },
  {
    id: "p3",
    slug: "pho-hang-trong",
    legacySlugs: ["khue-van-cac"],
    name: "Phố Hàng Trống",
    eyebrow: "Hà Nội · Phố cổ Hà Nội",
    price: "219.000 ₫",
    image:
      "https://veuzowtvsbxnyrfdbgfz.supabase.co/storage/v1/object/public/product-images/catalog/p3/91578fc6-8bae-48c4-954d-6622d9262801?v=1793870074128",
    listingImage:
      "https://veuzowtvsbxnyrfdbgfz.supabase.co/storage/v1/object/public/product-images/catalog/p3/91578fc6-8bae-48c4-954d-6622d9262801?v=1793870074128",
    number: "01",
    accent: "Bán chạy",
    description:
      "Mô hình lắp ghép gỗ 3D lấy cảm hứng từ kiến trúc phố Hàng Trống, tái hiện một góc phố nghề mang dấu ấn tranh dân gian Hà Nội xưa.",
    modelUrl: "/models/Hang-Trong-Model.glb",
    usdzUrl: "/models/Hang-Trong-Model.usdz",
    audioUrl: "/audio/pho-hang-trong.mp3",
    audioTitle:
      "Phố Hàng Trống — Nơi sắc màu dân gian lưu dấu giữa lòng Hà Nội",
    audioAuthor: "Thuyết minh Di sản · Kiến Tích Việt",
    specifications: {
      pieces: "211",
      time: "5 tiếng",
      difficulty: "Trung bình",
      material: "Gỗ basswood",
      size: "15 × 15 × 15 cm",
      audience: "15 tuổi trở lên",
    },
  },
].sort(
  (left, right) =>
    PRODUCT_DISPLAY_ORDER.indexOf(left.id) -
    PRODUCT_DISPLAY_ORDER.indexOf(right.id),
)

export function isUpcomingProduct(product: Pick<Product, "accent">): boolean {
  return product.accent === UPCOMING_PRODUCT_ACCENT
}

export function findProduct(slugOrId?: string): Product | undefined {
  if (!slugOrId) return undefined
  return (
    products.find((p) => p.slug === slugOrId || p.id === slugOrId) ||
    products.find((p) => p.legacySlugs?.includes(slugOrId))
  )
}
