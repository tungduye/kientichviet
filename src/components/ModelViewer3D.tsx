import { useEffect, useRef, useState, useCallback } from "react"

import {
  RotateCcw,
  Play,
  Pause,
  AlertCircle,
  Smartphone,
  HelpCircle,
  RefreshCw,
  Box,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react"

interface ModelViewer3DProps {
  src: string

  iosSrc?: string

  poster?: string

  alt: string

  title?: string

  onClose?: () => void
}

export default function ModelViewer3D({
  src,

  iosSrc,

  poster,

  alt,

  title = "Mô hình 3D tương tác",

  onClose,
}: ModelViewer3DProps) {
  const viewerRef = useRef<any>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const [isLoading, setIsLoading] = useState(true)

  const [loadProgress, setLoadProgress] = useState(0)

  const [hasError, setHasError] = useState(false)

  // Disable autoRotate by default on mobile devices to preserve frame rate and battery

  const [autoRotate, setAutoRotate] = useState(() => {
    if (typeof window !== "undefined") {
      const isMobile =
        window.matchMedia("(max-width: 768px)").matches ||
        "ontouchstart" in window

      return !isMobile
    }

    return false
  })

  const [isArSupported, setIsArSupported] = useState(false)

  const [showArModal, setShowArModal] = useState(false)

  const [showControlsHint, setShowControlsHint] = useState(true)

  const [loadKey, setLoadKey] = useState(0)

  const [isMobileDevice, setIsMobileDevice] = useState(false)

  const [isIOS, setIsIOS] = useState(false)

  const [isAndroid, setIsAndroid] = useState(false)

  // Detect mobile device & OS platform

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || ""

      const ios =
        /iPhone|iPad|iPod/i.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

      const android = /Android/i.test(ua)

      const mobile =
        ios ||
        android ||
        window.matchMedia("(max-width: 768px)").matches ||
        "ontouchstart" in window

      setIsIOS(ios)

      setIsAndroid(android)

      setIsMobileDevice(mobile)
    }
  }, [])

  const checkArSupport = useCallback(() => {
    const el = viewerRef.current

    if (el) {
      if (typeof el.canActivateAR === "boolean") {
        setIsArSupported(el.canActivateAR)
      } else {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

        setIsArSupported(isMobile)
      }
    }
  }, [])

  // Dynamically load @google/model-viewer runtime bundle

  useEffect(() => {
    let mounted = true

    const loadModelViewer = async () => {
      if (typeof window === "undefined") return

      if (customElements.get("model-viewer")) {
        if (mounted) checkArSupport()

        return
      }

      const existingScript = document.querySelector(
        'script[data-model-viewer="true"]',
      )

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (mounted) checkArSupport()
        })

        return
      }

      // Try dynamic import (Vite code-splits if available) or fallback to official Google CDN

      try {
        await import("@google/model-viewer")

        if (mounted) checkArSupport()
      } catch {
        const script = document.createElement("script")

        script.type = "module"

        script.src =
          "https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js"

        script.setAttribute("data-model-viewer", "true")

        script.onload = () => {
          if (mounted) checkArSupport()
        }

        script.onerror = (err) => {
          console.error("Lỗi nạp thư viện model-viewer:", err)

          if (mounted) {
            setHasError(true)

            setIsLoading(false)
          }
        }

        document.head.appendChild(script)
      }
    }

    loadModelViewer()

    return () => {
      mounted = false
    }
  }, [checkArSupport])

  // Bind model-viewer custom events and lifecycle cleanup

  useEffect(() => {
    const el = viewerRef.current

    if (!el) return

    setIsLoading(true)

    setHasError(false)

    setLoadProgress(0)

    const handleLoad = () => {
      setIsLoading(false)

      setHasError(false)

      checkArSupport()
    }

    const handleProgress = (event: any) => {
      const progress = event?.detail?.totalProgress ?? 0

      setLoadProgress(Math.min(100, Math.round(progress * 100)))
    }

    const handleError = (error: any) => {
      console.error("Lỗi khi tải tệp GLB:", error)

      setIsLoading(false)

      setHasError(true)
    }

    const handleArStatus = (event: any) => {
      if (event?.detail?.status === "failed") {
        setShowArModal(true)
      }
    }

    el.addEventListener("load", handleLoad)

    el.addEventListener("progress", handleProgress)

    el.addEventListener("error", handleError)

    el.addEventListener("ar-status", handleArStatus)

    // Re-check AR support once model element upgrades

    if (typeof el.canActivateAR === "boolean") {
      setIsArSupported(el.canActivateAR)
    }

    return () => {
      el.removeEventListener("load", handleLoad)

      el.removeEventListener("progress", handleProgress)

      el.removeEventListener("error", handleError)

      el.removeEventListener("ar-status", handleArStatus)
    }
  }, [src, loadKey, checkArSupport])

  // Instant recovery hook for iOS Cancel / Quick Look exit

  useEffect(() => {
    const handleViewerRecovery = () => {
      // Remove any stuck focus or active state from button/link

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }

      // Invalidate layout to force Safari WebKit to repaint canvas

      window.dispatchEvent(new Event("resize"))

      const el = viewerRef.current

      if (el) {
        if (typeof el.dismissPoster === "function") {
          el.dismissPoster()
        }

        if (typeof el.jumpCameraToGoal === "function") {
          el.jumpCameraToGoal()
        }
      }
    }

    window.addEventListener("focus", handleViewerRecovery)

    window.addEventListener("pageshow", handleViewerRecovery)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleViewerRecovery()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleViewerRecovery)

      window.removeEventListener("pageshow", handleViewerRecovery)

      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Hide the initial controls hint after 5 seconds

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControlsHint(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleResetCamera = useCallback(() => {
    const el = viewerRef.current

    if (el) {
      el.cameraOrbit = "40deg 75deg 105%"

      el.cameraTarget = "auto auto auto"

      if (typeof el.jumpCameraToGoal === "function") {
        el.jumpCameraToGoal()
      }
    }
  }, [])

  const handleToggleAutoRotate = useCallback(() => {
    const el = viewerRef.current

    if (el) {
      const next = !autoRotate

      setAutoRotate(next)

      if (next) {
        el.setAttribute("auto-rotate", "")
      } else {
        el.removeAttribute("auto-rotate")
      }
    }
  }, [autoRotate])

  const handleArClick = useCallback(() => {
    const el = viewerRef.current

    if (el && isArSupported && typeof el.activateAR === "function") {
      try {
        el.activateAR()
      } catch (e) {
        console.warn("Không thể mở AR trực tiếp, hiển thị bảng hướng dẫn:", e)

        setShowArModal(true)
      }
    } else {
      setShowArModal(true)
    }
  }, [isArSupported])

  const handleRetry = useCallback(() => {
    setLoadKey((prev) => prev + 1)
  }, [])

  return (
    <div
      ref={containerRef}
      onPointerDown={() => setShowControlsHint(false)}
      onWheel={() => setShowControlsHint(false)}
      onTouchStart={() => setShowControlsHint(false)}
      className="model-viewer-container relative w-full h-full min-h-[340px] sm:min-h-[460px] md:min-h-[580px] lg:min-h-[640px] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #2f1015 0%, #19090c 65%, #0e0406 100%)",

        border: "1px solid rgba(255, 209, 141, 0.2)",
      }}
      role="region"
      aria-label={alt}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 209, 141, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 209, 141, 0.045) 1px, transparent 1px)",

          backgroundSize: "36px 36px",
        }}
      />
      <div
        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[65%] max-w-[520px] h-[72px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 209, 141, 0.14) 0%, rgba(143, 0, 25, 0.16) 50%, transparent 75%)",

          filter: "blur(10px)",
        }}
      />

      {/* 3D Web Component with Adaptive Resolution & High-Performance flags */}
      <model-viewer
        ref={viewerRef}
        key={loadKey}
        src={src}
        ios-src={iosSrc}
        poster={poster}
        alt={alt}
        camera-controls
        touch-action="pan-y"
        render-scale="auto"
        reveal="auto"
        power-preference="default"
        loading="eager"
        auto-rotate={autoRotate ? "" : undefined}
        auto-rotate-delay="2500"
        rotation-per-second="14deg"
        shadow-intensity="1"
        shadow-softness="0.25"
        exposure="1"
        camera-orbit="40deg 75deg 105%"
        min-camera-orbit="auto auto 45%"
        max-camera-orbit="auto auto 220%"
        field-of-view="32deg"
        ar
        ar-modes="webxr scene-viewer quick-look"
        quick-look-browsers="safari chrome"
        ar-scale="auto"
        interaction-prompt="none"
        style={{
          width: "100%",

          height: "100%",

          minHeight: "100%",

          display: hasError ? "none" : "block",

          outline: "none",
        }}
      >
        {/* Native model-viewer AR button slot (hidden, triggered via styled UI) */}
        <button
          slot="ar-button"
          id="custom-ar-slot-button"
          style={{ display: "none" }}
          aria-label="Khởi chạy AR"
        />
      </model-viewer>

      {/* Top Bar: Title & AR Launcher & Unified Close Button */}
      <div
        className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-none gap-2"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div
          className="flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur-md pointer-events-auto shrink-0 max-w-[55%] sm:max-w-none truncate shadow-lg"
          style={{
            background: "rgba(74, 8, 20, 0.92)",

            border: "1px solid rgba(255, 209, 141, 0.4)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
          <span
            className="text-xs sm:text-sm font-semibold tracking-wide text-[#fff7ec] truncate"
            style={{
              fontFamily: '"Vollkorn", serif',
            }}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto shrink-0">
          {/* Action: Open AR (Native iOS Quick Look sheet anchor vs Android Scene Viewer button) */}
          {isIOS && iosSrc ? (
            <a
              rel="ar"
              href={`${iosSrc.split("#")[0]}#allowsContentScaling=0`}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 no-underline"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 209, 141, 0.95) 0%, rgba(232, 186, 117, 0.95) 100%)",

                color: "#351b18",

                border: "1px solid rgba(255, 209, 141, 0.5)",

                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
              }}
              title="Khám phá trong không gian thực qua Apple AR Quick Look"
              aria-label="Khám phá trong không gian thực qua Apple AR"
            >
              <img
                src={poster || "/favicon.png"}
                alt=""
                className="opacity-0 absolute w-px h-px pointer-events-none"
                aria-hidden="true"
              />
              <Smartphone size={16} className="shrink-0" />
              <span className="hidden sm:inline">Xem không gian thực</span>
              <span className="sm:hidden text-[11px]">Xem AR</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={handleArClick}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 209, 141, 0.95) 0%, rgba(232, 186, 117, 0.95) 100%)",

                color: "#351b18",

                border: "1px solid rgba(255, 209, 141, 0.5)",

                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4)",
              }}
              title={
                isArSupported
                  ? "Xem trong không gian thực qua camera"
                  : isMobileDevice
                    ? "Hướng dẫn trải nghiệm AR"
                    : "AR hỗ trợ trên điện thoại di động"
              }
              aria-label={
                isArSupported
                  ? "Xem trong không gian thực qua camera"
                  : "Hướng dẫn trải nghiệm AR"
              }
            >
              <Smartphone size={16} className="shrink-0" />
              <span className="hidden sm:inline">
                {isArSupported ? "Xem không gian thực" : "Hướng dẫn AR"}
              </span>
              <span className="sm:hidden text-[11px]">
                {isArSupported ? "Xem AR" : "AR"}
              </span>
            </button>
          )}

          {/* Single prominent Close button if onClose prop is passed */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full hover:brightness-110 active:scale-95 text-[#fff7ec] backdrop-blur-md transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shrink-0"
              style={{
                background: "rgba(94, 0, 18, 0.92)",

                border: "1px solid rgba(255, 209, 141, 0.45)",
              }}
              aria-label="Đóng khung nhìn 3D"
              title="Đóng khung nhìn 3D (Esc)"
            >
              <X size={18} className="shrink-0" />
              <span className="hidden sm:inline text-xs font-semibold tracking-wider uppercase">
                Đóng
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Controls Bar (Bottom Center) - Responsive for 320px - 430px */}
      {!isLoading && !hasError && (
        <div
          className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full backdrop-blur-md shadow-2xl pointer-events-auto max-w-[95vw] sm:max-w-[90vw]"
          style={{
            background: "rgba(74, 8, 20, 0.92)",

            border: "1px solid rgba(255, 209, 141, 0.4)",

            paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))",
          }}
        >
          {/* Reset Orbit */}
          <button
            type="button"
            onClick={handleResetCamera}
            className="min-h-[44px] min-w-[44px] px-2 sm:px-2.5 py-2 rounded-full text-[var(--gold)]/90 hover:text-[var(--gold)] hover:bg-white/10 active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium"
            title="Đặt lại góc nhìn ban đầu"
            aria-label="Đặt lại góc nhìn"
          >
            <RotateCcw size={16} />
            <span className="hidden md:inline">Đặt lại góc nhìn</span>
          </button>

          {/* Toggle Auto Rotate */}
          <button
            type="button"
            onClick={handleToggleAutoRotate}
            className={`min-h-[44px] min-w-[44px] px-2 sm:px-2.5 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium ${
              autoRotate
                ? "text-[var(--gold)] bg-white/10"
                : "text-[var(--gold)]/80 hover:text-[var(--gold)] hover:bg-white/10 active:bg-white/20"
            }`}
            title={autoRotate ? "Tắt tự xoay mô hình" : "Bật tự xoay mô hình"}
            aria-label={autoRotate ? "Tắt tự xoay" : "Bật tự xoay"}
          >
            {autoRotate ? <Pause size={16} /> : <Play size={16} />}
            <span className="hidden md:inline">
              {autoRotate ? "Dừng xoay" : "Tự xoay"}
            </span>
          </button>

          <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

          {/* Help Tooltip Trigger */}
          <button
            type="button"
            onClick={() => setShowControlsHint((v) => !v)}
            className="min-h-[44px] min-w-[44px] px-2 sm:px-2.5 py-2 rounded-full text-[var(--gold)]/90 hover:text-[var(--gold)] hover:bg-white/10 active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-medium"
            title="Hướng dẫn thao tác xoay và thu phóng"
            aria-label="Hướng dẫn thao tác"
          >
            <HelpCircle size={16} />
            <span className="hidden md:inline">Hướng dẫn</span>
          </button>
        </div>
      )}

      {/* Interactive Guide Banner (Subtle, fading) */}
      {showControlsHint && !isLoading && !hasError && (
        <div className="absolute bottom-16 sm:bottom-18 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-[var(--gold)]/20 text-[10.5px] sm:text-[11.5px] text-[#fff7ec]/90 tracking-wide text-center pointer-events-none transition-opacity duration-300 max-w-[92vw] shadow-xl">
          <span>
            {isMobileDevice
              ? "1 ngón: Xoay 360° · Chụm 2 ngón: Thu phóng · 2 ngón: Di chuyển"
              : "Chuột trái: Xoay 360° · Cuộn chuột: Thu phóng · Chuột phải: Di chuyển"}
          </span>
        </div>
      )}

      {/* Non-blocking loading indicator (poster remains visible underneath) */}
      {isLoading && !hasError && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-[var(--gold)]/35 shadow-2xl pointer-events-none transition-all duration-300 animate-fade-in max-w-[90vw]">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-transparent border-t-[var(--gold)] border-r-[var(--gold)] animate-spin shrink-0" />
          <span className="text-xs text-[#fff7ec] font-medium tracking-wide truncate">
            Đang tải mô hình 3D{" "}
            {loadProgress > 0 ? `(${loadProgress}%)` : "..."}
          </span>
        </div>
      )}

      {/* Error Fallback State */}
      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#18090c] text-center">
          <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 mb-3 shadow-lg">
            <AlertCircle size={24} />
          </div>
          <h4
            className="text-base font-semibold text-[#fff7ec] mb-1.5"
            style={{ fontFamily: '"Vollkorn", serif' }}
          >
            Chưa thể hiển thị mô hình 3D
          </h4>
          <p className="text-xs text-[#fff7ec]/70 max-w-sm mb-4 leading-relaxed">
            Không thể tải tệp mô hình lúc này. Bạn có thể kiểm tra kết nối mạng
            và thử tải lại.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--gold)] text-[#351b18] hover:bg-[#e8ba75] active:scale-95 transition-all cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <RefreshCw size={14} />
            <span>Thử tải lại</span>
          </button>
        </div>
      )}

      {/* AR Device Guidance Modal / Popover */}
      {showArModal && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowArModal(false)
          }}
        >
          <div
            className="max-w-md w-full p-5 sm:p-6 rounded-2xl border text-center shadow-2xl relative my-auto"
            style={{
              background: "linear-gradient(145deg, #2a1116 0%, #17090c 100%)",

              borderColor: "rgba(255, 209, 141, 0.35)",
            }}
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[var(--red)]/40 border border-[var(--gold)]/40 flex items-center justify-center text-[var(--gold)] mx-auto mb-3">
              <Smartphone size={22} />
            </div>

            <h3
              className="text-base sm:text-lg font-bold text-[#fff7ec] mb-2"
              style={{ fontFamily: '"Vollkorn", serif' }}
            >
              Trải nghiệm Thực tế tăng cường (AR)
            </h3>

            <p className="text-xs text-[#fff7ec]/80 leading-relaxed mb-4 text-left">
              Tính năng AR cho phép bạn đặt mô hình Tháp Rùa vào không gian
              phòng hoặc mặt bàn thực tế thông qua camera điện thoại:
            </p>

            <div className="space-y-2.5 text-left mb-5 text-xs text-[#fff7ec]/85">
              <div className="flex items-start gap-2">
                <CheckCircle2
                  size={15}
                  className="text-emerald-400 shrink-0 mt-0.5"
                />
                <span>
                  <strong>Android:</strong> Hỗ trợ Google Scene Viewer và WebXR
                  qua trình duyệt Chrome (tệp <code>.glb</code>).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2
                  size={15}
                  className="text-emerald-400 shrink-0 mt-0.5"
                />
                <span>
                  <strong>iOS (iPhone / iPad):</strong> Đã tích hợp định dạng
                  chuẩn <code>.usdz</code> tương thích trực tiếp với Apple AR
                  Quick Look trên Safari.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2
                  size={15}
                  className="text-amber-400 shrink-0 mt-0.5"
                />
                <span>
                  <strong>Máy tính (PC/Mac):</strong> Thiết bị máy tính không có
                  camera AR không gian. Bạn có thể tự do xoay 360°, thu phóng và
                  khám phá kiến trúc trực tiếp trên màn hình 3D.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowArModal(false)}
              className="min-h-[44px] w-full py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--gold)] text-[#351b18] hover:bg-[#e8ba75] active:scale-98 transition-all cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Đã hiểu, quay lại mô hình
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
