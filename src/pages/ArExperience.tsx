import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AmbientLight, DirectionalLight } from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import { getArReadiness, type ArExperienceConfig } from "../features/ar/arConfig"
import { supabase } from "../integrations/supabase/client"
import ModelViewer3D from "../components/ModelViewer3D"

const IOS_MODEL_BY_PRODUCT: Record<string, string> = {
  p1: "/models/Thap-rua-model.usdz",
  p3: "/models/Hang-Trong-Model.usdz",
}

const TRACKING_IMAGE_BY_PRODUCT: Record<string, string> = {
  p1: "/images/thap-rua.jpg",
  p3: "/images/pho-hang-trong.jpg",
}

export default function ArExperience() {
  const { productId = "" } = useParams()
  const [config, setConfig] = useState<ArExperienceConfig | null>(null)
  const [status, setStatus] = useState("Đang tải cấu hình AR…")
  const [started, setStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(true)
  const attemptRef = useRef(0)
  const mindarRef = useRef<{ stop: () => void; renderer: { setAnimationLoop: (callback: null | (() => void)) => void } } | null>(null)

  useEffect(() => {
    activeRef.current = true
    const request = ++attemptRef.current
    setConfig(null)
    void supabase.from("ar_experiences").select("*").eq("product_id", productId).maybeSingle().then(({ data, error }) => {
      if (!activeRef.current || request !== attemptRef.current) return
      if (error || !data) { setStatus("Không tìm thấy trải nghiệm AR đang bật cho sản phẩm này."); return }
      setConfig({ productId: data.product_id, enabled: data.enabled, targetUrl: data.target_url, modelUrl: data.model_url, scale: data.scale, offsetX: data.offset_x, offsetY: data.offset_y, offsetZ: data.offset_z, rotationX: data.rotation_x, rotationY: data.rotation_y, rotationZ: data.rotation_z })
      setStatus(getArReadiness({ productId: data.product_id, enabled: data.enabled, targetUrl: data.target_url, modelUrl: data.model_url, scale: data.scale, offsetX: data.offset_x, offsetY: data.offset_y, offsetZ: data.offset_z, rotationX: data.rotation_x, rotationY: data.rotation_y, rotationZ: data.rotation_z }).message)
    })
    return () => {
      activeRef.current = false
      attemptRef.current += 1
      try { mindarRef.current?.renderer.setAnimationLoop(null); mindarRef.current?.stop() } catch { /* Camera may not have finished starting. */ }
    }
  }, [productId])

  const startTracking = async () => {
    if (!config?.targetUrl || !config.modelUrl || !containerRef.current) return
    const attempt = ++attemptRef.current
    setStarted(true); setStatus("Đang mở camera và tải mô hình…")
    try {
      const mindarModuleUrl = "/vendor/mindar/mindar-image-three.prod.js"
      const { MindARThree } = await import(/* @vite-ignore */ mindarModuleUrl)
      if (!activeRef.current || attempt !== attemptRef.current) return
      const mindar = new MindARThree({ container: containerRef.current, imageTargetSrc: config.targetUrl, maxTrack: 1 })
      mindarRef.current = mindar
      const anchor = mindar.addAnchor(0)
      mindar.scene.add(new AmbientLight(0xffffff, 2.1))
      const keyLight = new DirectionalLight(0xffffff, 2.6)
      keyLight.position.set(1, 2, 1)
      mindar.scene.add(keyLight)
      const model = await new GLTFLoader().loadAsync(config.modelUrl)
      if (!activeRef.current || attempt !== attemptRef.current) { try { mindar.stop() } catch { /* Not started yet. */ } return }
      model.scene.scale.setScalar(config.scale)
      model.scene.position.set(config.offsetX, config.offsetY, config.offsetZ)
      model.scene.rotation.set(config.rotationX, config.rotationY, config.rotationZ)
      anchor.group.add(model.scene)
      anchor.onTargetFound = () => setStatus("Đã nhận diện mục tiêu — mô hình đang bám theo camera.")
      anchor.onTargetLost = () => setStatus("Hãy đưa ảnh mục tiêu trở lại khung hình.")
      await mindar.start()
      if (!activeRef.current || attempt !== attemptRef.current) { mindar.stop(); return }
      mindar.renderer.setAnimationLoop(() => mindar.renderer.render(mindar.scene, mindar.camera))
      setStatus("Đưa camera hướng vào ảnh mục tiêu.")
    } catch (error) {
      try { mindarRef.current?.renderer.setAnimationLoop(null); mindarRef.current?.stop() } catch { /* Camera may not have finished starting. */ }
      mindarRef.current = null
      setStarted(false)
      setStatus(error instanceof Error ? `Không thể mở AR: ${error.message}` : "Không thể mở AR. Hãy kiểm tra quyền camera.")
    }
  }

  const stopTracking = () => {
    attemptRef.current += 1
    try { mindarRef.current?.renderer.setAnimationLoop(null); mindarRef.current?.stop() } catch { /* Camera may already be stopped. */ }
    mindarRef.current = null
    containerRef.current?.replaceChildren()
    setStarted(false)
    setStatus("Camera đã dừng.")
  }

  const readiness = config ? getArReadiness(config) : null
  return <main className="ar-page">
    <header className="ar-page-header">
      <Link to="/heritage">← Quay lại Di sản số</Link>
      <p className="ar-page-kicker">Trải nghiệm dành cho khách hàng</p>
      <h1>Đưa mô hình vào không gian thật</h1>
      <p className="ar-page-status" role="status">{status}</p>
    </header>
    {readiness?.ready && readiness.mode === "image-tracking" && <>
      <div ref={containerRef} className="ar-camera-stage" />
      {!started && <button className="ar-start-button" onClick={() => void startTracking()}>Mở camera & quét ảnh sản phẩm</button>}
      {started && <button className="ar-stop-button" onClick={stopTracking}>Dừng camera</button>}
      <div className="ar-customer-guide">
        <strong>Cách sử dụng</strong>
        <ol><li>Bấm nút mở camera và cho phép truy cập camera.</li><li>Hướng camera vào đúng ảnh nhận diện bên dưới.</li><li>Khi nhận diện thành công, mô hình sẽ xuất hiện và bám theo ảnh trong khung hình.</li></ol>
        {TRACKING_IMAGE_BY_PRODUCT[productId] && <figure className="ar-tracking-target">
          <img src={TRACKING_IMAGE_BY_PRODUCT[productId]} alt="Ảnh dùng để nhận diện sản phẩm trong camera AR" />
          <figcaption>Ảnh nhận diện — có thể mở ảnh này trên thiết bị khác hoặc dùng ảnh in trên hộp sản phẩm.</figcaption>
        </figure>}
      </div>
      <p className="ar-privacy">Camera chỉ mở sau khi bạn bấm nút. Hình ảnh được xử lý trực tiếp trên thiết bị và không được tải lên máy chủ.</p>
    </>}
    {readiness?.ready && readiness.mode === "plane-placement" && config?.modelUrl && <section className="ar-fallback">
      <div className="ar-mode-intro"><strong>Camera AR</strong><span>Bấm “Xem AR” trên khung mô hình để đặt sản phẩm lên bàn hoặc sàn nhà.</span></div>
      <ModelViewer3D src={config.modelUrl} iosSrc={IOS_MODEL_BY_PRODUCT[productId]} title="Mở camera AR" alt="Mô hình AR Kiến Tích Việt" />
      <p>Trên điện thoại hỗ trợ AR, nút “Xem AR” sẽ mở camera và cho phép đặt mô hình vào không gian thật.</p>
    </section>}
    {readiness && !readiness.ready && <div className="ar-empty">{readiness.message}</div>}
  </main>
}
