import { describe, expect, it } from "vitest"

import { products } from "./products"

describe("customer product presentation", () => {
  it("uses the approved product order, numbering and status labels", () => {
    expect(
      products.map(({ id, number, accent }) => ({ id, number, accent })),
    ).toEqual([
      { id: "p3", number: "01", accent: "Bán chạy" },
      { id: "p1", number: "02", accent: "Mới" },
      { id: "p2", number: "03", accent: "COMING SOON" },
    ])
  })
})
