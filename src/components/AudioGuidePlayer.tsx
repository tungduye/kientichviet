import { useState, useRef, useEffect, useCallback } from "react"

import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
} from "lucide-react"

interface AudioGuidePlayerProps {
  audioUrl: string

  title?: string

  subtitle?: string

  heritageName?: string

  coverImage?: string

  caption?: string

  className?: string
}

export default function AudioGuidePlayer({
  audioUrl,

  title = "Chuyện về đóa sen gỗ của ngàn năm văn hiến",

  subtitle = "Thuyết minh Di sản · Kiến Tích Việt",

  heritageName = "Chùa Một Cột",

  coverImage = "/images/one-pillar-pagoda.jpg",

  caption = "Âm vang sen ngọc",

  className = "",
}: AudioGuidePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Web Audio API refs

  const audioContextRef = useRef<AudioContext | null>(null)

  const analyserRef = useRef<AnalyserNode | null>(null)

  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)

  const animFrameIdRef = useRef<number | null>(null)

  const smoothVolumeRef = useRef<number>(0)

  const phaseRef = useRef<number>(0)

  // Player UI states

  const [isPlaying, setIsPlaying] = useState(false)

  const [currentTime, setCurrentTime] = useState(0)

  const [duration, setDuration] = useState(0)

  const [volume, setVolume] = useState(1)

  const [isMuted, setIsMuted] = useState(false)

  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  const [isReady, setIsReady] = useState(false)

  // Format time mm:ss

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00"

    const m = Math.floor(seconds / 60)

    const s = Math.floor(seconds % 60)

    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  // Initialize Web Audio Context on first user interaction

  const initAudioContext = async () => {
    if (!audioRef.current) return

    if (!audioContextRef.current) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext

        const ctx = new AudioContextClass()

        const analyser = ctx.createAnalyser()

        analyser.fftSize = 256

        analyser.smoothingTimeConstant = 0.82

        const source = ctx.createMediaElementSource(audioRef.current)

        source.connect(analyser)

        analyser.connect(ctx.destination)

        audioContextRef.current = ctx

        analyserRef.current = analyser

        sourceNodeRef.current = source
      } catch (err) {
        console.warn("Web Audio API could not initialize:", err)
      }
    }

    if (
      audioContextRef.current &&
      audioContextRef.current.state === "suspended"
    ) {
      try {
        await audioContextRef.current.resume()
      } catch (e) {
        console.warn("AudioContext resume failed:", e)
      }
    }
  }

  // Play / Pause toggle

  const togglePlay = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()

      setIsPlaying(false)
    } else {
      await initAudioContext()

      try {
        await audioRef.current.play()

        setIsPlaying(true)
      } catch (err) {
        console.error("Audio playback error:", err)
      }
    }
  }

  // Seek handler

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)

    if (audioRef.current) {
      audioRef.current.currentTime = newTime

      setCurrentTime(newTime)
    }
  }

  // Skip back/forward

  const skip = (delta: number) => {
    if (!audioRef.current) return

    const newTime = Math.min(
      Math.max(audioRef.current.currentTime + delta, 0),
      duration || 0,
    )

    audioRef.current.currentTime = newTime

    setCurrentTime(newTime)
  }

  // Volume change

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)

    setVolume(val)

    if (audioRef.current) {
      audioRef.current.volume = val

      audioRef.current.muted = val === 0

      setIsMuted(val === 0)
    }
  }

  // Mute toggle

  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.muted = false

      audioRef.current.volume = volume || 0.8

      setIsMuted(false)
    } else {
      audioRef.current.muted = true

      setIsMuted(true)
    }
  }

  // Speed toggle

  const cyclePlaybackSpeed = () => {
    const speeds = [1, 1.25, 1.5]

    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length

    const nextSpeed = speeds[nextIdx]

    setPlaybackSpeed(nextSpeed)

    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed
    }
  }

  // Canvas visualizer loop: Option B - Fluid Sine Wave (Mặt nước hồ sen dao động theo âm thanh)

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext("2d")

    if (!ctx) return

    const rect = canvas.getBoundingClientRect()

    const dpr = window.devicePixelRatio || 1

    const targetW = Math.max(10, Math.floor(rect.width * dpr))

    const targetH = Math.max(10, Math.floor(rect.height * dpr))

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW

      canvas.height = targetH
    }

    const width = rect.width

    const height = rect.height

    let targetEnergy = 0

    if (analyserRef.current && isPlaying) {
      const bufferLength = analyserRef.current.frequencyBinCount

      const dataArray = new Uint8Array(bufferLength)

      analyserRef.current.getByteFrequencyData(dataArray)

      // Calculate instant voice frequency energy (bins 2-45 correspond to human voice 100Hz - 3kHz)

      let sum = 0

      const startBin = 2

      const endBin = Math.min(45, bufferLength)

      for (let i = startBin; i < endBin; i++) {
        sum += dataArray[i]
      }

      const avg = sum / (endBin - startBin)

      targetEnergy = avg / 255 // normalized 0 to 1
    }

    // Smooth volume interpolation (spring/easing)

    smoothVolumeRef.current += (targetEnergy - smoothVolumeRef.current) * 0.18

    const volumeLevel = smoothVolumeRef.current

    // Phase progression

    const speed = isPlaying ? 0.035 + volumeLevel * 0.075 : 0.015

    phaseRef.current += speed

    ctx.save()

    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const centerY = height * 0.52

    // Dynamic wave amplitudes based on audio energy

    const baseAmp = isPlaying ? 8 + volumeLevel * 48 : 4

    const phase = phaseRef.current

    // Helper: Bell-curve envelope to smoothly fade wave edges to 0 at left/right margins

    const getEnvelope = (x: number) => {
      const normalized = x / width

      return Math.sin(normalized * Math.PI)
    }

    // LAYER 1: Deep glowing ambient water fill under the wave

    ctx.save()

    ctx.beginPath()

    ctx.moveTo(0, height)

    for (let x = 0; x <= width; x += 3) {
      const env = getEnvelope(x)

      const wave = Math.sin(x * 0.012 + phase) * (baseAmp * 0.9) * env

      ctx.lineTo(x, centerY + wave)
    }

    ctx.lineTo(width, height)

    ctx.closePath()

    const bgGradient = ctx.createLinearGradient(0, centerY - 20, 0, height)

    bgGradient.addColorStop(
      0,

      isPlaying
        ? `rgba(255, 209, 141, ${0.12 + volumeLevel * 0.22})`
        : "rgba(255, 209, 141, 0.04)",
    )

    bgGradient.addColorStop(
      0.5,

      isPlaying
        ? `rgba(143, 0, 25, ${0.15 + volumeLevel * 0.25})`
        : "rgba(143, 0, 25, 0.03)",
    )

    bgGradient.addColorStop(1, "rgba(10, 5, 5, 0)")

    ctx.fillStyle = bgGradient

    ctx.fill()

    ctx.restore()

    // LAYER 2: Secondary harmonic wave (Hổ phách / Ánh chu sa - Amber / Red glow)

    ctx.save()

    ctx.beginPath()

    for (let x = 0; x <= width; x += 2) {
      const env = getEnvelope(x)

      const wave =
        Math.sin(x * 0.018 - phase * 1.3) * (baseAmp * 0.65) * env +
        Math.cos(x * 0.009 + phase * 0.7) * (baseAmp * 0.35) * env

      const y = centerY + wave

      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.strokeStyle = isPlaying
      ? `rgba(245, 158, 11, ${0.45 + volumeLevel * 0.45})`
      : "rgba(245, 158, 11, 0.18)"

    ctx.lineWidth = isPlaying ? 1.5 + volumeLevel * 2 : 1.2

    ctx.shadowColor = "rgba(245, 158, 11, 0.6)"

    ctx.shadowBlur = isPlaying ? 8 + volumeLevel * 12 : 3

    ctx.stroke()

    ctx.restore()

    // LAYER 3: Tertiary soft wave (Lụa sen trắng kem - Cream White)

    ctx.save()

    ctx.beginPath()

    for (let x = 0; x <= width; x += 2) {
      const env = getEnvelope(x)

      const wave =
        Math.sin(x * 0.014 + phase * 0.9 + Math.PI / 3) * (baseAmp * 0.5) * env

      const y = centerY + wave

      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.strokeStyle = isPlaying
      ? `rgba(255, 235, 209, ${0.4 + volumeLevel * 0.4})`
      : "rgba(255, 235, 209, 0.15)"

    ctx.lineWidth = 1

    ctx.stroke()

    ctx.restore()

    // LAYER 4: Primary Golden Wave (Dải sóng chính Hoàng Kim - Rich Gold)

    ctx.save()

    ctx.beginPath()

    for (let x = 0; x <= width; x += 2) {
      const env = getEnvelope(x)

      const wave =
        Math.sin(x * 0.013 + phase) * (baseAmp * 1.1) * env +
        Math.sin(x * 0.026 - phase * 0.5) * (baseAmp * 0.25) * env

      const y = centerY + wave

      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.strokeStyle = isPlaying
      ? `rgba(255, 209, 141, ${0.85 + volumeLevel * 0.15})`
      : "rgba(255, 209, 141, 0.4)"

    ctx.lineWidth = isPlaying ? 2.5 + volumeLevel * 2.5 : 1.8

    ctx.shadowColor = "#ffd18d"

    ctx.shadowBlur = isPlaying ? 12 + volumeLevel * 20 : 6

    ctx.stroke()

    ctx.restore()

    // Center Baseline subtle axis

    ctx.save()

    ctx.beginPath()

    ctx.moveTo(0, centerY)

    ctx.lineTo(width, centerY)

    ctx.strokeStyle = "rgba(255, 209, 141, 0.08)"

    ctx.lineWidth = 1

    ctx.setLineDash([4, 8])

    ctx.stroke()

    ctx.restore()

    ctx.restore()

    animFrameIdRef.current = requestAnimationFrame(drawVisualizer)
  }, [isPlaying])

  // Start / Stop animation loop

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(drawVisualizer)

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [drawVisualizer])

  // Cleanup Web Audio API on unmount

  useEffect(() => {
    return () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        try {
          audioContextRef.current.close()
        } catch (e) {
          console.warn("AudioContext close error:", e)
        }
      }
    }
  }, [])

  // Reset state when audioUrl changes

  useEffect(() => {
    setIsPlaying(false)

    setCurrentTime(0)

    setIsReady(false)

    if (audioRef.current) {
      audioRef.current.pause()

      audioRef.current.currentTime = 0
    }
  }, [audioUrl])

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background:
          "linear-gradient(145deg, #2a1114 0%, #1c0c0f 50%, #14080a 100%)",

        border: "1px solid rgba(255, 209, 141, 0.18)",

        boxShadow:
          "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(143, 0, 25, 0.15)",
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)

            setIsReady(true)
          }
        }}
        onCanPlay={() => {
          if (audioRef.current && (!duration || isNaN(duration))) {
            setDuration(audioRef.current.duration)
          }

          setIsReady(true)
        }}
        onError={(e) => {
          console.warn("Audio element error:", e)
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onEnded={() => {
          setIsPlaying(false)

          setCurrentTime(0)
        }}
      />

      {/* Top Banner: Tag & Live broadcast indicator */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: "rgba(255, 209, 141, 0.1)",

          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-7 h-7 rounded-full"
            style={{
              background: "rgba(143, 0, 25, 0.6)",

              border: "1px solid rgba(255, 209, 141, 0.3)",

              color: "var(--gold)",
            }}
          >
            <Radio size={14} className={isPlaying ? "animate-pulse" : ""} />
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--gold)", letterSpacing: "0.15em" }}
          >
            THUYẾT MINH DI SẢN · AUDIO GUIDE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? "bg-emerald-400 animate-ping" : "bg-amber-400/50"
            }`}
          />
          <span className="text-xs font-medium text-white/60">
            {isPlaying
              ? "Đang truyền tải thời gian thực"
              : isReady
                ? "Sẵn sàng lắng nghe"
                : "Đang tải audio..."}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 md:p-8">
        {/* Header Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {coverImage && (
              <div
                className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-lg"
                style={{ border: "1px solid rgba(255, 209, 141, 0.3)" }}
              >
                <img
                  src={coverImage}
                  alt={heritageName}
                  className="w-full h-full object-cover"
                />
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <Sparkles
                      size={18}
                      className="text-amber-300 animate-spin"
                      style={{ animationDuration: "8s" }}
                    />
                  </div>
                )}
              </div>
            )}
            <div>
              <p className="text-xs text-amber-200/70 uppercase tracking-wider mb-1">
                {heritageName}
              </p>
              <h4
                className="text-xl md:text-2xl font-serif font-semibold text-white leading-snug"
                style={{ fontFamily: '"Vollkorn", serif' }}
              >
                {title}
              </h4>
              <p className="text-xs text-white/50 mt-1">{subtitle}</p>
            </div>
          </div>

          {/* Speed control pill */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={cyclePlaybackSpeed}
              className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-colors cursor-pointer"
              style={{
                background: "rgba(255, 255, 255, 0.06)",

                border: "1px solid rgba(255, 209, 141, 0.2)",

                color: "var(--gold)",
              }}
              title="Tốc độ phát"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>

        {/* Option B: Realtime Fluid Waveform Canvas */}
        <div
          className="relative w-full h-32 md:h-36 rounded-xl overflow-hidden mb-6 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(180deg, rgba(18, 8, 10, 0.95) 0%, rgba(26, 11, 14, 0.95) 100%)",

            border: "1px solid rgba(255, 209, 141, 0.14)",
          }}
        >
          {/* Subtle poetic caption */}
          <div
            className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none px-2.5 py-0.5 rounded-full"
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 209, 141, 0.22)",
              backdropFilter: "blur(6px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ boxShadow: "0 0 6px #fbbf24" }}
            />
            <span
              className="text-[12px] font-medium tracking-wide text-amber-200"
              style={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}
            >
              {caption}
            </span>
          </div>

          {/* Realtime Waveform Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-pointer"
            onClick={togglePlay}
            title={isPlaying ? "Bấm để tạm dừng" : "Bấm để phát"}
          />

          {!isPlaying && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] hover:bg-black/20 transition-all cursor-pointer group"
            >
              <div
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-xl transition-transform group-hover:scale-105"
                style={{
                  background:
                    "linear-gradient(135deg, #8f0019 0%, #5e0012 100%)",

                  border: "1px solid rgba(255, 209, 141, 0.5)",

                  color: "#fff",
                }}
              >
                <Play
                  size={18}
                  fill="currentColor"
                  style={{ color: "var(--gold)" }}
                />
                <span className="text-sm font-semibold tracking-wider text-amber-100">
                  Lắng nghe câu chuyện di sản
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar / Scrubber */}
        <div className="mb-5">
          <div className="relative group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-amber-400 transition-all focus:outline-none"
              style={{
                background: `linear-gradient(to right, var(--gold) ${
                  duration ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.12) ${
                  duration ? (currentTime / duration) * 100 : 0
                }%)`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-amber-100/60 mt-2 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Bar: Focus on Big Play button and storytelling */}
        <div className="audio-primary-controls flex flex-col items-center justify-center gap-4 pt-1">
          {/* Main playback buttons */}
          <div className="flex items-center justify-center gap-5 w-full">
            {/* Skip back 10s */}
            <button
              onClick={() => skip(-10)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-amber-100/70 hover:text-amber-200 hover:bg-white/5 transition-colors cursor-pointer"
              title="Lùi 10 giây"
            >
              <RotateCcw size={18} />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 md:w-[68px] md:h-[68px] rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #a6122d 0%, #680014 100%)",

                border: "2px solid rgba(255, 209, 141, 0.7)",

                boxShadow: isPlaying
                  ? "0 0 28px rgba(255, 209, 141, 0.45), 0 0 45px rgba(143, 0, 25, 0.7)"
                  : "0 0 20px rgba(143, 0, 25, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3)",

                color: "var(--gold)",
              }}
              title={isPlaying ? "Tạm dừng" : "Phát âm thanh"}
            >
              {isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" />
              )}
            </button>

            {/* Skip forward 10s */}
            <button
              onClick={() => skip(10)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-amber-100/70 hover:text-amber-200 hover:bg-white/5 transition-colors cursor-pointer"
              title="Tua tới 10 giây"
            >
              <RotateCw size={18} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-amber-200/10 self-center">
            <button
              onClick={toggleMute}
              className="text-amber-100/70 hover:text-amber-200 transition-colors cursor-pointer"
              title={isMuted ? "Bật âm" : "Tắt tiếng"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 md:w-24 h-1.5 rounded-lg appearance-none cursor-pointer bg-white/20 accent-amber-400"
              style={{
                background: `linear-gradient(to right, var(--gold) ${
                  (isMuted ? 0 : volume) * 100
                }%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
