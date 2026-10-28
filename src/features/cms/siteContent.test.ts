import { describe, expect, it } from "vitest"

import {
  buildContentSnapshot,
  sanitizeContentValue,
  type ContentEntry,
  type ContentFieldDefinition,
} from "./siteContent"

const definitions: ContentFieldDefinition[] = [
  {
    key: "home.hero.title",
    page: "Trang chủ",
    group: "Hero",
    label: "Tiêu đề",
    type: "text",
    defaultValue: "Dựng hình di sản",
  },
  {
    key: "footer.email",
    page: "Toàn trang",
    group: "Footer",
    label: "Email",
    type: "text",
    defaultValue: "hello@example.com",
  },
]

const entries: ContentEntry[] = [
  {
    contentKey: "home.hero.title",
    draftValue: "Bản nháp chưa đăng",
    publishedValue: "Dựng hình ký ức",
    revision: 3,
    isVisible: true,
  },
  {
    contentKey: "footer.email",
    draftValue: "draft@example.com",
    publishedValue: "published@example.com",
    revision: 2,
    isVisible: false,
  },
]

describe("site content snapshots", () => {
  it("shows only published values to customers", () => {
    const snapshot = buildContentSnapshot(definitions, entries, "published")

    expect(snapshot["home.hero.title"].value).toBe("Dựng hình ký ức")
    expect(snapshot["home.hero.title"].value).not.toContain("Bản nháp")
  })

  it("shows drafts and hidden fields to administrators", () => {
    const snapshot = buildContentSnapshot(definitions, entries, "draft")

    expect(snapshot["home.hero.title"].value).toBe("Bản nháp chưa đăng")
    expect(snapshot["footer.email"].isVisible).toBe(false)
  })

  it("fails back to registered defaults when a row is missing", () => {
    const snapshot = buildContentSnapshot(definitions, [], "published")

    expect(snapshot["home.hero.title"].value).toBe("Dựng hình di sản")
  })

  it("rejects javascript URLs and bounds long text", () => {
    expect(sanitizeContentValue("url", "javascript:alert(1)")).toEqual({
      ok: false,
      error: expect.stringContaining("http"),
    })
    expect(sanitizeContentValue("text", "x".repeat(5001))).toMatchObject({
      ok: false,
    })
  })

  it("accepts internal paths and HTTPS URLs", () => {
    expect(sanitizeContentValue("url", "/products")).toEqual({
      ok: true,
      value: "/products",
    })
    expect(sanitizeContentValue("url", "https://example.com/path")).toEqual({
      ok: true,
      value: "https://example.com/path",
    })
  })
})
