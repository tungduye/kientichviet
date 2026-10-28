import { describe, expect, it } from "vitest"

import { assertPublicSupabaseKey } from "./apiKeyValidation"

describe("Supabase browser key validation", () => {
  it("accepts public publishable and legacy anon keys", () => {
    expect(assertPublicSupabaseKey("sb_publishable_example")).toBe(
      "sb_publishable_example",
    )
    const anonJwt = createJwt({ role: "anon" })
    expect(assertPublicSupabaseKey(anonJwt)).toBe(anonJwt)
  })

  it("rejects keys that must never enter the browser bundle", () => {
    expect(() => assertPublicSupabaseKey("sb_secret_example")).toThrow(
      /public publishable\/anon key/,
    )
    expect(() => assertPublicSupabaseKey(createJwt({ role: "service_role" }))).toThrow(
      /never a secret or service-role key/,
    )
    expect(() => assertPublicSupabaseKey("not-a-real-public-key")).toThrow(
      /public publishable\/anon key/,
    )
  })
})

function createJwt(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`
}
