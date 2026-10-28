import { BrowserRouter, Routes, Route } from "react-router-dom"
import { lazy, Suspense } from "react"

import MainLayout from "./components/layout/MainLayout"

import Home from "./pages/Home"

import OurStory from "./pages/OurStory"

import Products from "./pages/Products"

import ProductDetail from "./pages/ProductDetail"

import Heritage from "./pages/Heritage"

import Cart from "./pages/Cart"

import NotFound from "./pages/NotFound"

import { CartProvider } from "./context/CartContext"

import ScrollToTop from "./components/ScrollToTop"

import { CatalogProvider } from "./context/CatalogContext"

import AdminCatalog from "./pages/AdminCatalog"
import { SiteContentProvider } from "./context/SiteContentContext"
const ArExperience = lazy(() => import("./pages/ArExperience"))

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CatalogProvider>
        <SiteContentProvider><CartProvider>
          <Routes>
            <Route path="/quan-tri" element={<AdminCatalog />} />
            <Route path="/ar/:productId" element={<Suspense fallback={<main className="ar-page">Đang tải trải nghiệm AR…</main>}><ArExperience /></Suspense>} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="our-story" element={<OurStory />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:slug" element={<ProductDetail />} />
              <Route path="heritage" element={<Heritage />} />
              <Route path="heritage/:id" element={<Heritage />} />
              <Route path="cart" element={<Cart />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider></SiteContentProvider>
      </CatalogProvider>
    </BrowserRouter>
  )
}
