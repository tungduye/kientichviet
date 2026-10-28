import { BrowserRouter, Routes, Route } from "react-router-dom"

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

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CatalogProvider>
        <CartProvider>
          <Routes>
            <Route path="/quan-tri" element={<AdminCatalog />} />
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
        </CartProvider>
      </CatalogProvider>
    </BrowserRouter>
  )
}
