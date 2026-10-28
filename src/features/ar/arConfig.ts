export interface ArExperienceConfig {
  productId: string
  enabled: boolean
  targetUrl: string | null
  modelUrl: string | null
  scale: number
  offsetX: number
  offsetY: number
  offsetZ: number
  rotationX: number
  rotationY: number
  rotationZ: number
}

export type ArReadiness =
  | {
      ready: true
      mode: "image-tracking" | "plane-placement"
      message: string
    }
  | {
      ready: false
      mode: "disabled" | "unconfigured"
      message: string
    }

export function getArReadiness(config: ArExperienceConfig): ArReadiness {
  if (!config.enabled) {
    return {
      ready: false,
      mode: "disabled",
      message: "Trải nghiệm AR đang tạm ẩn.",
    }
  }

  if (!config.modelUrl) {
    return {
      ready: false,
      mode: "unconfigured",
      message: "Sản phẩm chưa có mô hình 3D cho AR.",
    }
  }

  if (config.targetUrl) {
    return {
      ready: true,
      mode: "image-tracking",
      message: "Sẵn sàng quét hình mục tiêu.",
    }
  }

  return {
    ready: true,
    mode: "plane-placement",
    message: "Thiết bị sẽ đặt mô hình trên mặt phẳng.",
  }
}
