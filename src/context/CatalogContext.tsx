import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { products as baseProducts, type Product } from "../data/products"
import {
  applyCatalogSettings,
  applyVariantSettings,
  type CatalogProduct,
  type CatalogSetting,
  type CatalogVariant,
} from "../features/catalog/catalog"
import { getProductVariants } from "../features/products/productVariants"
import { supabase } from "../integrations/supabase/client"

interface CatalogContextValue {
  products: CatalogProduct[]
  adminProducts: CatalogProduct[]
  settings: CatalogSetting[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
  findProduct: (slugOrId?: string) => CatalogProduct | undefined
  getVariants: (product: Product, includeHidden?: boolean) => CatalogVariant[]
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

function mapCatalogSetting(row: {
  product_key: string
  product_id: string
  variant_id: string | null
  price: string
  image_url: string | null
  is_visible: boolean
  sort_order: number
}): CatalogSetting {
  return {
    productKey: row.product_key,
    productId: row.product_id,
    variantId: row.variant_id,
    price: row.price,
    imageUrl: row.image_url,
    isVisible: row.is_visible,
    sortOrder: row.sort_order,
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CatalogSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)

    const { data, error: catalogError } = await supabase
      .from("product_catalog_settings")
      .select(
        "product_key, product_id, variant_id, price, image_url, is_visible, sort_order",
      )
      .order("sort_order")

    if (catalogError) {
      setError("Chưa tải được dữ liệu sản phẩm mới nhất.")
    } else {
      setSettings((data ?? []).map(mapCatalogSetting))
      setError("")
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const products = useMemo(
    () => applyCatalogSettings(baseProducts, settings),
    [settings],
  )
  const adminProducts = useMemo(
    () => applyCatalogSettings(baseProducts, settings, true),
    [settings],
  )

  const findProduct = useCallback(
    (slugOrId?: string) => {
      if (!slugOrId) return undefined

      return products.find(
        (product) =>
          product.slug === slugOrId ||
          product.id === slugOrId ||
          product.legacySlugs?.includes(slugOrId),
      )
    },
    [products],
  )

  const getVariants = useCallback(
    (product: Product, includeHidden = false) =>
      applyVariantSettings(
        product,
        getProductVariants(product),
        settings,
        includeHidden,
      ),
    [settings],
  )

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      adminProducts,
      settings,
      loading,
      error,
      refresh,
      findProduct,
      getVariants,
    }),
    [
      products,
      adminProducts,
      settings,
      loading,
      error,
      refresh,
      findProduct,
      getVariants,
    ],
  )

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  )
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext)

  if (!context) {
    throw new Error("useCatalog must be used inside CatalogProvider")
  }

  return context
}
