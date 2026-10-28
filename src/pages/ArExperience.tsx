import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AmbientLight, DirectionalLight } from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import { getArReadiness, type ArExperienceConfig } from "../features/ar/arConfig"
import { supabase } from "../integrations/supabase/client"
import ModelViewer3D from "../components/ModelViewer3D"

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
      const { MindARThree } = await import("mind-ar/dist/mindar-image-three.prod.js")
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
    <header className="ar-page-header"><Link to="/">← Trang chủ</Link><h1>Kiến Tích Việt · Web AR</h1><p>{status}</p></header>
    {readiness?.ready && readiness.mode === "image-tracking" && <>
      <div ref={containerRef} className="ar-camera-stage" />
      {!started && <button className="ar-start-button" onClick={() => void startTracking()}>Mở camera & bắt đầu quét</button>}
      {started && <button className="ar-stop-button" onClick={stopTracking}>Dừng camera</button>}
      <p className="ar-privacy">Camera chỉ được mở sau khi bạn bấm nút. Trình duyệt sẽ yêu cầu cấp quyền; luồng hình ảnh được xử lý trên thiết bị.</p>
    </>}
    {readiness?.ready && readiness.mode === "plane-placement" && config?.modelUrl && <section className="ar-fallback"><ModelViewer3D src={config.modelUrl} alt="Mô hình AR Kiến Tích Việt" /><p>Chưa có tệp mục tiêu .mind. Bạn vẫn có thể bấm “Xem AR” để đặt mô hình trên mặt phẳng bằng tính năng AR của điện thoại.</p></section>}
    {readiness && !readiness.ready && <div className="ar-empty">{readiness.message}</div>}
  </main>
}
