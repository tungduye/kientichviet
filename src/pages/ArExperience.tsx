import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { Link, useParams } from "react-router-dom"
import { AmbientLight, Box3, DirectionalLight, Matrix4, Quaternion, Raycaster, Scene, Vector2, Vector3, type Camera, type Group } from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import { getArReadiness, type ArExperienceConfig } from "../features/ar/arConfig"
import { supabase } from "../integrations/supabase/client"
import ModelViewer3D from "../components/ModelViewer3D"

const IOS_MODEL_BY_PRODUCT: Record<string, string> = {
  p1: "/models/Thap-rua-model.usdz",
  p3: "/models/Hang-Trong-Model.usdz",
}

const TRACKING_IMAGE_BY_PRODUCT: Record<string, string> = {
  p3: "/images/pho-hang-trong.jpg",
}

const THAP_RUA_ANGLE_IMAGES = [
  { src: "/images/thap-rua-angle-front.jpg", label: "Mặt trước", alt: "Tháp Rùa mô hình nhìn chính diện" },
  { src: "/images/thap-rua-angle-side.jpg", label: "Góc nghiêng", alt: "Tháp Rùa mô hình nhìn từ góc nghiêng" },
  { src: "/images/thap-rua-angle-detail.jpg", label: "Chi tiết", alt: "Chi tiết các tầng của mô hình Tháp Rùa" },
]

type CameraZoom = { min: number; max: number; step: number; value: number }
type CameraZoomCapabilities = MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } }
type TargetState = "searching" | "tracking" | "held"
type MindARAnchor = { group: Group; onTargetUpdate?: () => void; onTargetFound?: () => void; onTargetLost?: () => void }
type MindARRuntime = {
  camera: Camera
  renderer: {
    domElement: HTMLCanvasElement
    setPixelRatio: (ratio: number) => void
    setAnimationLoop: (callback: null | (() => void)) => void
    render: (scene: Scene, camera: Camera) => void
  }
  scene: Scene
  video?: HTMLVideoElement
  addAnchor: (targetIndex: number) => MindARAnchor
  start: () => Promise<void>
  stop: () => void
}
type MindARThreeConstructor = new (options: {
  container: HTMLElement
  imageTargetSrc: string
  maxTrack: number
  filterMinCF: number
  filterBeta: number
  missTolerance: number
  uiScanning: string
}) => MindARRuntime
type MindARWindow = Window & { MINDAR?: { IMAGE?: { MindARThree?: MindARThreeConstructor } } }

let mindARThreeLoader: Promise<MindARThreeConstructor> | null = null

function loadMindARThree(): Promise<MindARThreeConstructor> {
  const mindARWindow = window as MindARWindow
  const loadedConstructor = mindARWindow.MINDAR?.IMAGE?.MindARThree
  if (loadedConstructor) return Promise.resolve(loadedConstructor)
  if (mindARThreeLoader) return mindARThreeLoader

  mindARThreeLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.type = "module"
    script.src = "/vendor/mindar/mindar-image-three.prod.js"
    script.dataset.mindarImageThree = "true"
    script.onload = () => {
      const constructor = mindARWindow.MINDAR?.IMAGE?.MindARThree
      if (!constructor) {
        mindARThreeLoader = null
        reject(new Error("Không tìm thấy thư viện nhận diện ảnh MindAR."))
        return
      }
      resolve(constructor)
    }
    script.onerror = () => {
      script.remove()
      mindARThreeLoader = null
      reject(new Error("Không tải được thư viện AR. Hãy tải lại trang rồi thử lại."))
    }
    document.head.appendChild(script)
  })

  return mindARThreeLoader
}

const INITIAL_MODEL_ZOOM = 2.5
const MODEL_TARGET_HEIGHT_MULTIPLIER = 3
const MIN_MODEL_ZOOM = 0.5
const MAX_MODEL_ZOOM = 5

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
  const [modelZoom, setModelZoom] = useState(INITIAL_MODEL_ZOOM)
  const [targetState, setTargetState] = useState<TargetState>("searching")
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraShellRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(true)
  const attemptRef = useRef(0)
  const zoomTrackRef = useRef<MediaStreamTrack | null>(null)
  const modelRefs = useRef<Group[]>([])
  const modelScaleBasesRef = useRef<number[]>([])
  const modelRaycasterRef = useRef(new Raycaster())
  const modelPointerRef = useRef(new Vector2())
  const modelDragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const pendingStartRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === cameraShellRef.current)
    document.addEventListener("fullscreenchange", syncFullscreen)
    return () => document.removeEventListener("fullscreenchange", syncFullscreen)
  }, [])
  const mindarRef = useRef<MindARRuntime | null>(null)

  const beginModelRotation = (event: ReactPointerEvent<HTMLDivElement>) => {
    const mindar = mindarRef.current
    const canvas = mindar?.renderer.domElement
    if (!mindar || !canvas || event.target !== canvas || (event.pointerType === "mouse" && event.button !== 0)) return
    const rect = canvas.getBoundingClientRect()
    modelPointerRef.current.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    modelRaycasterRef.current.setFromCamera(modelPointerRef.current, mindar.camera)
    const visibleModels = modelRefs.current.filter((model) => model.parent?.visible)
    if (!modelRaycasterRef.current.intersectObjects(visibleModels, true).length) return
    event.preventDefault()
    modelDragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    try { canvas.setPointerCapture(event.pointerId) } catch { /* Pointer capture is not required on every browser. */ }
  }

  const rotateModel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = modelDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.x
    const deltaY = event.clientY - drag.y
    drag.x = event.clientX
    drag.y = event.clientY
    for (const model of modelRefs.current) {
      model.rotation.y += deltaX * 0.012
      model.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, model.rotation.x + deltaY * 0.012))
    }
    event.preventDefault()
  }

  const endModelRotation = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (modelDragRef.current?.pointerId === event.pointerId) modelDragRef.current = null
  }

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
    setTargetState("searching")
    setStarted(true); setStatus("Đang mở camera và tải mô hình…")
    try {
      const MindARThree = await loadMindARThree()
      if (!activeRef.current || attempt !== attemptRef.current) return
      const mindar = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: config.targetUrl,
        maxTrack: 1,
        filterMinCF: 0.0005,
        filterBeta: 1000,
        missTolerance: 12,
        uiScanning: "no",
      })
      mindarRef.current = mindar
      mindar.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      mindar.renderer.domElement.style.zIndex = "1"
      mindar.renderer.domElement.style.inset = "0"
      mindar.renderer.domElement.style.width = "100%"
      mindar.renderer.domElement.style.height = "100%"
      mindar.renderer.domElement.style.touchAction = "none"
      const targetLabels = productId === "p1" ? THAP_RUA_ANGLE_IMAGES.map((image) => image.label) : ["Phố Hàng Trống"]
      const anchors = targetLabels.map((label, index) => {
        const anchor = mindar.addAnchor(index)
        const lastPose = new Matrix4()
        const smoothedPose = new Matrix4()
        const rawPosition = new Vector3()
        const rawQuaternion = new Quaternion()
        const rawScale = new Vector3()
        const currentPosition = new Vector3()
        const currentQuaternion = new Quaternion()
        const currentScale = new Vector3()
        let hasLastPose = false
        let hasSmoothedPose = false
        anchor.onTargetUpdate = () => {
          if (anchor.group.visible) {
            const detectedPose = anchor.group.matrix
            if (!hasSmoothedPose) {
              smoothedPose.copy(detectedPose)
              hasSmoothedPose = true
            } else {
              detectedPose.decompose(rawPosition, rawQuaternion, rawScale)
              smoothedPose.decompose(currentPosition, currentQuaternion, currentScale)
              const movement = currentPosition.distanceTo(rawPosition)
              const rotation = currentQuaternion.angleTo(rawQuaternion)
              const follow = Math.min(0.85, Math.max(0.18, 0.18 + movement * 4 + rotation * 0.18))
              currentPosition.lerp(rawPosition, follow)
              currentQuaternion.slerp(rawQuaternion, follow)
              currentScale.lerp(rawScale, follow)
              smoothedPose.compose(currentPosition, currentQuaternion, currentScale)
              anchor.group.matrix.copy(smoothedPose)
              anchor.group.matrixWorldNeedsUpdate = true
            }
            lastPose.copy(smoothedPose)
            hasLastPose = true
          }
        }
        anchor.onTargetFound = () => {
          hasSmoothedPose = false
          hasLastPose = false
          anchors.forEach((otherAnchor, otherIndex) => {
            if (otherIndex !== index) otherAnchor.group.visible = false
          })
          setTargetState("tracking")
          setStatus(`Đã nhận diện ảnh ${label} — mô hình đang bám theo ảnh.`)
        }
        anchor.onTargetLost = () => {
          if (hasLastPose) {
            anchor.group.matrix.copy(lastPose)
            anchor.group.matrixWorldNeedsUpdate = true
            anchor.group.visible = true
            setTargetState("held")
            setStatus("Ảnh mục tiêu đã khuất — mô hình được giữ tại vị trí nhìn cuối. Quét lại ảnh để tiếp tục bám theo.")
          } else {
            setTargetState("searching")
            setStatus("Hướng camera vào một trong các ảnh mục tiêu để bắt đầu.")
          }
        }
        return anchor
      })
      mindar.scene.add(new AmbientLight(0xffffff, 2.1))
      const keyLight = new DirectionalLight(0xffffff, 2.6)
      keyLight.position.set(1, 2, 1)
      mindar.scene.add(keyLight)
      const model = await new GLTFLoader().loadAsync(config.modelUrl)
      if (!activeRef.current || attempt !== attemptRef.current) { try { mindar.stop() } catch { /* Not started yet. */ } return }
      const modelBounds = new Box3().setFromObject(model.scene)
      const modelHeight = modelBounds.getSize(new Vector3()).y
      // MindAR anchors use a normalized target width. The CMS scale values were
      // originally tuned for raw GLB coordinates, which made normalized models
      // appear tiny. Convert the configured value into a useful target height.
      const targetHeight = Math.max(config.scale * MODEL_TARGET_HEIGHT_MULTIPLIER, 1.2)
      const scaleBase = modelHeight > 0 ? targetHeight / modelHeight : targetHeight
      modelScaleBasesRef.current = anchors.map(() => scaleBase)
      modelRefs.current = anchors.map(({ group }) => {
        const modelScene = model.scene.clone(true)
        modelScene.scale.setScalar(scaleBase * INITIAL_MODEL_ZOOM)
        modelScene.position.set(config.offsetX, config.offsetY, config.offsetZ)
        modelScene.rotation.set(config.rotationX, config.rotationY, config.rotationZ)
        group.add(modelScene)
        return modelScene
      })
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
      modelRefs.current = []
      modelScaleBasesRef.current = []
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
    modelRefs.current = []
    modelScaleBasesRef.current = []
    modelDragRef.current = null
    containerRef.current?.replaceChildren()
    setCameraReady(false)
    setCameraZoom(null)
    setModelZoom(INITIAL_MODEL_ZOOM)
    setTargetState("searching")
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
    <header className={`ar-page-header${started ? " is-running" : ""}`}>
      <Link to="/heritage">← Quay lại Khám phá di sản</Link>
      <p className="ar-page-kicker">Trải nghiệm dành cho khách hàng</p>
      <h1>{productId === "p1" ? "AR Tháp Rùa" : productId === "p3" ? "AR Phố Hàng Trống" : "Trải nghiệm AR"}</h1>
      <p className={`ar-page-status${started ? " is-active" : ""}`} role="status">{status}</p>
    </header>
    {readiness?.ready && readiness.mode === "image-tracking" && <>
      <div ref={cameraShellRef} className={`ar-camera-shell${fullscreen ? " is-fullscreen" : ""}${cameraReady ? " has-model-scale" : ""}${cameraZoom ? " has-camera-zoom" : ""}`}>
        <div ref={containerRef} className="ar-camera-stage" onPointerDown={beginModelRotation} onPointerMove={rotateModel} onPointerUp={endModelRotation} onPointerCancel={endModelRotation} />
        {!started && <button className="ar-start-button ar-start-button-overlay" onClick={() => void startTracking()}>Mở camera &amp; quét ảnh sản phẩm</button>}
        {started && !cameraReady && <div className="ar-camera-wait" role="status">Đang bật camera và chờ hình ảnh…<small>Nếu màn hình vẫn đen, đóng ứng dụng khác đang dùng camera rồi thử lại.</small></div>}
        {started && <button type="button" className="ar-camera-fullscreen-button" aria-label={fullscreen ? "Thoát toàn màn hình" : "Phóng camera toàn màn hình"} onClick={() => void toggleFullscreen()}>{fullscreen ? "Thu nhỏ màn hình" : "Toàn màn hình"}</button>}
        {started && cameraReady && targetState !== "tracking" && <div className={`ar-target-overlay${targetState === "held" ? " is-held" : ""}`} role="status">
          {targetState === "held" ? "Ảnh khuất · mô hình giữ vị trí cuối" : "Hướng camera vào một ảnh mục tiêu"}
        </div>}
        {started && cameraReady && targetState === "tracking" && <div className="ar-target-overlay" aria-hidden="true">Kéo trên mô hình để xoay</div>}
        {started && cameraReady && <>
          <div className="ar-camera-controls">
            <label className="ar-model-scale">
              <span>Phóng mô hình <output>{modelZoom.toFixed(1)}×</output></span>
              <input aria-label="Phóng to hoặc thu nhỏ mô hình AR" type="range" min={MIN_MODEL_ZOOM} max={MAX_MODEL_ZOOM} step="0.1" value={modelZoom} onChange={(event) => {
                const next = Number(event.target.value)
                setModelZoom(next)
                modelRefs.current.forEach((model, index) => model.scale.setScalar((modelScaleBasesRef.current[index] ?? 1) * next))
              }} />
            </label>
            {cameraZoom && <div className="ar-camera-zoom" aria-label="Điều chỉnh mức thu phóng camera">
              <button type="button" aria-label="Thu nhỏ camera" title="Thu nhỏ camera" disabled={cameraZoom.value <= cameraZoom.min} onClick={() => void adjustCameraZoom(-1)}>−</button>
              <output aria-live="polite">{cameraZoom.value.toFixed(1)}× <span>camera</span></output>
              <button type="button" aria-label="Phóng to camera" title="Phóng to camera" disabled={cameraZoom.value >= cameraZoom.max} onClick={() => void adjustCameraZoom(1)}>+</button>
            </div>}
          </div>
        </>}
        {started && <button type="button" className="ar-stop-button ar-stop-button-floating" onClick={stopTracking}>Dừng camera</button>}
      </div>
      <div className="ar-customer-guide">
        <strong>Cách sử dụng</strong>
        <ol><li>Bấm nút mở camera và cho phép truy cập camera.</li><li>Hướng camera vào một trong các ảnh mục tiêu bên dưới.</li><li>Khi nhận diện thành công, mô hình sẽ xuất hiện và bám theo ảnh trong khung hình.</li></ol>
        {productId === "p1" && <section className="ar-product-angle-gallery" aria-label="Ảnh các góc mô hình Tháp Rùa">
          <h2>Ảnh mục tiêu AR Tháp Rùa</h2>
          <div className="ar-product-angle-grid">
            {THAP_RUA_ANGLE_IMAGES.map((image) => <a key={image.src} href={image.src} target="_blank" rel="noreferrer" aria-label={`Mở ảnh lớn: ${image.label}`}>
              <img src={image.src} alt={image.alt} loading="lazy" />
              <span>{image.label}</span>
            </a>)}
          </div>
          <p>Cả ba ảnh đều quét được. Mở ảnh trên thiết bị khác hoặc in ra giấy, rồi hướng camera vào ảnh.</p>
        </section>}
        {TRACKING_IMAGE_BY_PRODUCT[productId] && <figure className="ar-tracking-target">
          <img src={TRACKING_IMAGE_BY_PRODUCT[productId]} alt="Ảnh dùng để nhận diện sản phẩm trong camera AR" />
          <figcaption><strong>Ảnh mục tiêu để quét AR: Phố Hàng Trống.</strong> Hướng camera vào ảnh này để kích hoạt AR.<br /><a href={TRACKING_IMAGE_BY_PRODUCT[productId]} target="_blank" rel="noreferrer">Mở ảnh mục tiêu cỡ lớn</a></figcaption>
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
