export interface Product {
  id: string
  slug: string
  legacySlugs?: string[]
  name: string
  eyebrow: string
  price: string
  image: string
  number: string
  accent: string
  description: string
  modelUrl?: string
  usdzUrl?: string
  specifications: {
    pieces: string
    time: string
    difficulty: string
    material: string
    size: string
    audience: string
    weight: string
  }
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
    price: "820.000 ₫",
    image: "/images/thap-rua-angle-front.jpg",
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
      pieces: "148",
      time: "", // Bỏ thông tin thời gian lắp ghép theo feedback
      difficulty: "Nâng cao",
      material: "Gỗ sồi & bồ đề",
      size: "15 × 15 × 38 cm",
      audience: "14 tuổi trở lên",
      weight: "620g",
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
      time: "", // Bỏ số giờ lắp ghép theo feedback
      difficulty: "Trung bình",
      material: "Gỗ bồ đề tự nhiên",
      size: "20 × 20 × 25 cm",
      audience: "12 tuổi trở lên",
      weight: "500g",
    },
  },
  {
    id: "p3",
    slug: "pho-hang-trong",
    legacySlugs: ["khue-van-cac"],
    name: "Phố Hàng Trống",
    eyebrow: "Hà Nội · Phố cổ Hà Nội",
    price: "790.000 ₫",
    image: "/images/pho-hang-trong.jpg",
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
      pieces: "xxx", // Cập nhật thành xxx mảnh theo feedback
      time: "", // Bỏ số giờ lắp ghép theo feedback
      difficulty: "Trung bình",
      material: "Gỗ bồ đề tự nhiên",
      size: "18 × 18 × 22 cm",
      audience: "12 tuổi trở lên",
      weight: "450g",
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
