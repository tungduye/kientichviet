import { describe, expect, it } from "vitest"

import {
  selectVietnameseVoice,
  vietnameseVoiceScore,
  waitForVietnameseVoice,
} from "./voiceSelection"

interface TestVoice {
  name: string
  lang: string
  localService?: boolean
}

describe("Vietnamese speech voice selection", () => {
  it("prefers a natural Microsoft Vietnamese voice", () => {
    const voices: TestVoice[] = [
      { name: "Vietnamese", lang: "vi-VN" },
      { name: "Google Tiếng Việt", lang: "vi-VN" },
      { name: "Microsoft HoaiMy Online (Natural)", lang: "vi-VN" },
    ]

    expect(selectVietnameseVoice(voices)?.name).toContain("HoaiMy")
  })

  it("uses Google Vietnamese before an unspecified Vietnamese voice", () => {
    const voices: TestVoice[] = [
      { name: "Vietnamese", lang: "vi-VN" },
      { name: "Google Tiếng Việt", lang: "vi-VN" },
    ]

    expect(selectVietnameseVoice(voices)?.name).toBe("Google Tiếng Việt")
  })

  it("never chooses a non-Vietnamese voice", () => {
    expect(
      selectVietnameseVoice([
        { name: "Microsoft Natural", lang: "en-US" },
        { name: "Google UK English", lang: "en-GB" },
      ]),
    ).toBeUndefined()
  })

  it("ranks common Vietnamese voices consistently", () => {
    expect(vietnameseVoiceScore({ name: "Microsoft NamMinh", lang: "vi-VN" }))
      .toBeGreaterThan(
        vietnameseVoiceScore({ name: "Google Tiếng Việt", lang: "vi-VN" }),
      )
  })

  it("waits for browsers that load their voice list asynchronously", async () => {
    let voices: TestVoice[] = []
    let onVoicesChanged: (() => void) | undefined
    const provider = {
      getVoices: () => voices,
      addEventListener: (_event: "voiceschanged", listener: () => void) => {
        onVoicesChanged = listener
      },
      removeEventListener: () => undefined,
    }

    const pendingVoice = waitForVietnameseVoice(provider, 100)
    voices = [{ name: "Microsoft HoaiMy Natural", lang: "vi-VN" }]
    onVoicesChanged?.()

    await expect(pendingVoice).resolves.toMatchObject({ lang: "vi-VN" })
  })
})
