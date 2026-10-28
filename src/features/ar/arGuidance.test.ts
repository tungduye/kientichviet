import { describe, expect, it } from "vitest"

import {
  AR_PARAMETER_GUIDE,
  degreesToRadians,
  getArParameterGuide,
} from "./arGuidance"

describe("AR configuration guidance", () => {
  it("explains every editable numeric parameter", () => {
    const keys = AR_PARAMETER_GUIDE.map((item) => item.key)

    expect(keys).toEqual([
      "scale",
      "offset_x",
      "offset_y",
      "offset_z",
      "rotation_x",
      "rotation_y",
      "rotation_z",
    ])
  })

  it("returns a Vietnamese label and practical example", () => {
    expect(getArParameterGuide("offset_y")).toMatchObject({
      label: "Vị trí dọc (Y)",
      example: "0.1",
    })
  })

  it("converts familiar degrees to radians", () => {
    expect(degreesToRadians(90)).toBeCloseTo(1.57, 2)
    expect(degreesToRadians(180)).toBeCloseTo(3.14, 2)
  })
})
