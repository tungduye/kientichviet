import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { AmbientLight, DirectionalLight, type Group } from "three"
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

type CameraZoom = { min: number; max: number; step: number; value: number }
type CameraZoomCapabilities = MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } }

function getCameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ""
  if (name === "NotAllowedError" || name === "SecurityError") return "Hãy cho phép website sử dụng camera trong cài đặt trình duyệt."
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Không tìm thấy camera phù hợp trên thiết bị."
  if (name === "NotReadableError" || name === "AbortError") return "Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại."
  return error instanceof Error ? error.message : "Hãy kiểm tra quyền camera rồi thử lại."
}

function waitForVideoFrame(video: HTMLVideoElement, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    const cleanup = () => {
      window.clearTimeout(timeout)
      video.removeEventListener("loadeddata", check)
      video.removeEventListener("playing", check)
      video.removeEventListener("timeupdate", check)
    }
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve()
    }
    const check = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        finish()
      }
    }
    const timeout = window.setTimeout(() => {
      finish(new Error("Camera đã được cấp quyền nhưng chưa truyền hình ảnh. Hãy đóng ứng dụng khác đang dùng camera rồi thử lại."))
    }, timeoutMs)
    video.addEventListener("loadeddata", check)
    video.addEventListener("playing", check)
    video.addEventListener("timeupdate", check)
    check()
  })
}

export default function ArExperience() {
  const { productId = "" } = useParams()
  const [config, setConfig] = useState<ArExperienceConfig | null>(null)
  const [status, setStatus] = useState("Đang tải cấu hình AR…")
  const [started, setStarted] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [cameraZoom, setCameraZoom] = useState<CameraZoom | null>(null)
  const [modelZoom, setModelZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraShellRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(true)
  const attemptRef = useRef(0)
  const zoomTrackRef = useRef<MediaStreamTrack | null>(null)
  const modelRef = useRef<Group | null>(null)
  const pendingStartRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === cameraShellRef.current)
    document.addEventListener("fullscreenchange", syncFullscreen)
    return () => document.removeEventListener("fullscreenchange", syncFullscreen)
  }, [])
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
      const activeMindar = mindarRef.current
      const pendingStart = pendingStartRef.current
      if (pendingStart && activeMindar) void pendingStart.then(() => activeMindar.stop()).catch(() => undefined)
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
      mindar.renderer.domElement.style.zIndex = "1"
      mindar.renderer.domElement.style.inset = "0"
      mindar.renderer.domElement.style.width = "100%"
      mindar.renderer.domElement.style.height = "100%"
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
      modelRef.current = model.scene
      anchor.group.add(model.scene)
      anchor.onTargetFound = () => setStatus("Đã nhận diện mục tiêu — mô hình đang bám theo camera.")
      anchor.onTargetLost = () => setStatus("Hãy đưa ảnh mục tiêu trở lại khung hình.")
      const startPromise: Promise<void> = mindar.start()
      pendingStartRef.current = startPromise
      let startTimeout = 0
      try {
        await Promise.race([
          startPromise,
          new Promise<never>((_, reject) => {
            startTimeout = window.setTimeout(() => reject(new Error("Hết thời gian chờ camera. Hãy đóng ứng dụng khác đang sử dụng camera rồi thử lại.")), 15000)
          }),
        ])
      } catch (error) {
        void startPromise.then(() => mindar.stop()).catch(() => undefined)
        throw error
      } finally {
        window.clearTimeout(startTimeout)
      }
      pendingStartRef.current = null
      if (!activeRef.current || attempt !== attemptRef.current) { mindar.stop(); return }
      const video = mindar.video as HTMLVideoElement | undefined
      if (!video) throw new Error("Không tìm thấy luồng hình ảnh từ camera.")
      video.muted = true
      video.playsInline = true
      video.style.position = "absolute"
      video.style.top = "0"
      video.style.left = "0"
      video.style.zIndex = "0"
      video.style.width = "100%"
      video.style.height = "100%"
      video.style.objectFit = "cover"
      await video.play()
      await waitForVideoFrame(video)
      if (!activeRef.current || attempt !== attemptRef.current) { mindar.stop(); return }
      setCameraReady(true)
      const videoTrack = (mindar.video as HTMLVideoElement | undefined)?.srcObject instanceof MediaStream
        ? ((mindar.video as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0]
        : undefined
      const zoom = videoTrack?.getCapabilities?.() as CameraZoomCapabilities | undefined
      if (videoTrack && zoom?.zoom && zoom.zoom.max > zoom.zoom.min) {
        const settings = videoTrack.getSettings()
        zoomTrackRef.current = videoTrack
        setCameraZoom({
          min: zoom.zoom.min,
          max: zoom.zoom.max,
          step: zoom.zoom.step || 0.1,
          value: settings.zoom ?? zoom.zoom.min,
        })
      } else {
        zoomTrackRef.current = null
        setCameraZoom(null)
      }
      mindar.renderer.setAnimationLoop(() => mindar.renderer.render(mindar.scene, mindar.camera))
      setStatus("Camera đã sẵn sàng. Đưa camera hướng vào ảnh mục tiêu.")
    } catch (error) {
      try { mindarRef.current?.renderer.setAnimationLoop(null); mindarRef.current?.stop() } catch { /* Camera may not have finished starting. */ }
      mindarRef.current = null
      pendingStartRef.current = null
      zoomTrackRef.current = null
      modelRef.current = null
      setCameraReady(false)
      setCameraZoom(null)
      setStarted(false)
      setStatus(`Không thể mở camera AR: ${getCameraErrorMessage(error)}`)
    }
  }

  const adjustCameraZoom = async (direction: -1 | 1) => {
    const track = zoomTrackRef.current
    if (!track || !cameraZoom) return
    const next = Number(Math.max(cameraZoom.min, Math.min(cameraZoom.max, cameraZoom.value + cameraZoom.step * direction)).toFixed(3))
    if (next === cameraZoom.value) return
    try {
      await track.applyConstraints({ advanced: [{ zoom: next } as MediaTrackConstraintSet] })
      setCameraZoom((current) => current ? { ...current, value: track.getSettings().zoom ?? next } : current)
    } catch {
      setStatus("Không thể đổi mức thu phóng trên camera này.")
    }
  }

  const stopTracking = () => {
    attemptRef.current += 1
    const activeMindar = mindarRef.current
    const pendingStart = pendingStartRef.current
    if (pendingStart && activeMindar) void pendingStart.then(() => activeMindar.stop()).catch(() => undefined)
    try { activeMindar?.renderer.setAnimationLoop(null); activeMindar?.stop() } catch { /* Camera may already be stopped. */ }
    if (document.fullscreenElement === cameraShellRef.current) void document.exitFullscreen().catch(() => undefined)
    mindarRef.current = null
    pendingStartRef.current = null
    zoomTrackRef.current = null
    modelRef.current = null
    containerRef.current?.replaceChildren()
    setCameraReady(false)
    setCameraZoom(null)
    setModelZoom(1)
    setFullscreen(false)
    setStarted(false)
    setStatus("Camera đã dừng.")
  }

  const toggleFullscreen = async () => {
    const shell = cameraShellRef.current
    if (!shell) return
    if (fullscreen) {
      if (document.fullscreenElement === shell) await document.exitFullscreen().catch(() => undefined)
      setFullscreen(false)
      return
    }
    try {
      await shell.requestFullscreen()
      setFullscreen(true)
    } catch {
      // Keep a CSS full-screen view on browsers that do not allow element fullscreen.
      setFullscreen(true)
    }
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
      <div ref={cameraShellRef} className={`ar-camera-shell${fullscreen ? " is-fullscreen" : ""}${cameraReady ? " has-model-scale" : ""}${cameraZoom ? " has-camera-zoom" : ""}`}>
        <div ref={containerRef} className="ar-camera-stage" />
        {started && !cameraReady && <div className="ar-camera-wait" role="status">Đang bật camera và chờ hình ảnh…<small>Nếu màn hình vẫn đen, đóng ứng dụng khác đang dùng camera rồi thử lại.</small></div>}
        {started && <button type="button" className="ar-camera-fullscreen-button" aria-label={fullscreen ? "Thoát toàn màn hình" : "Phóng camera toàn màn hình"} onClick={() => void toggleFullscreen()}>{fullscreen ? "Thu nhỏ màn hình" : "Toàn màn hình"}</button>}
        {started && cameraReady && <>
          <label className="ar-model-scale">
            <span>Phóng mô hình <output>{modelZoom.toFixed(1)}×</output></span>
            <input aria-label="Phóng to hoặc thu nhỏ mô hình AR" type="range" min="0.5" max="2" step="0.1" value={modelZoom} onChange={(event) => {
              const next = Number(event.target.value)
              setModelZoom(next)
              modelRef.current?.scale.setScalar((config?.scale ?? 1) * next)
            }} />
          </label>
        </>}
        {started && <button type="button" className="ar-stop-button ar-stop-button-floating" onClick={stopTracking}>Dừng camera</button>}
        {started && cameraZoom && <div className="ar-camera-zoom" aria-label="Điều chỉnh mức thu phóng camera">
          <button type="button" aria-label="Thu nhỏ camera" title="Thu nhỏ camera" disabled={cameraZoom.value <= cameraZoom.min} onClick={() => void adjustCameraZoom(-1)}>−</button>
          <output aria-live="polite">{cameraZoom.value.toFixed(1)}× <span>thu phóng</span></output>
          <button type="button" aria-label="Phóng to camera" title="Phóng to camera" disabled={cameraZoom.value >= cameraZoom.max} onClick={() => void adjustCameraZoom(1)}>+</button>
        </div>}
      </div>
      {!started && <button className="ar-start-button" onClick={() => void startTracking()}>Mở camera & quét ảnh sản phẩm</button>}
      <div className="ar-customer-guide">
        <strong>Cách sử dụng</strong>
        <ol><li>Bấm nút mở camera và cho phép truy cập camera.</li><li>Hướng camera vào đúng ảnh nhận diện bên dưới.</li><li>Khi nhận diện thành công, mô hình sẽ xuất hiện và bám theo ảnh trong khung hình.</li></ol>
        {TRACKING_IMAGE_BY_PRODUCT[productId] && <figure className="ar-tracking-target">
          <img src={TRACKING_IMAGE_BY_PRODUCT[productId]} alt="Ảnh dùng để nhận diện sản phẩm trong camera AR" />
          <figcaption>Ảnh cần quét: {productId === "p1" ? "Tháp Rùa" : "Phố Hàng Trống"}. Đưa camera vào ảnh này, không cần quét mô hình gỗ.<br /><a href={TRACKING_IMAGE_BY_PRODUCT[productId]} target="_blank" rel="noreferrer">Mở ảnh mục tiêu cỡ lớn</a></figcaption>
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
