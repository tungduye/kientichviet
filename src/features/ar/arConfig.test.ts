import { describe, expect, it } from "vitest"

import { getArReadiness, type ArExperienceConfig } from "./arConfig"

const configured: ArExperienceConfig = {
  productId: "p1",
  enabled: true,
  targetUrl: "https://cdn.example/thap-rua.mind",
  modelUrl: "https://cdn.example/thap-rua.glb",
  scale: 0.4,
  offsetX: 0,
  offsetY: 0.1,
  offsetZ: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
}

describe("AR experience readiness", () => {
  it("starts image tracking only when target and model are configured", () => {
    expect(getArReadiness(configured)).toEqual({
      ready: true,
      mode: "image-tracking",
      message: "Sẵn sàng quét hình mục tiêu.",
    })
  })

  it("falls back to plane placement when no image target exists", () => {
    expect(getArReadiness({ ...configured, targetUrl: null })).toEqual({
      ready: true,
      mode: "plane-placement",
      message: "Thiết bị sẽ đặt mô hình trên mặt phẳng.",
    })
  })

  it("does not request camera when AR is disabled or model is missing", () => {
    expect(getArReadiness({ ...configured, enabled: false })).toMatchObject({
      ready: false,
    })
    expect(getArReadiness({ ...configured, modelUrl: null })).toMatchObject({
      ready: false,
    })
  })
})
