import { describe, expect, it } from "vitest"

import {
  CHAT_STORAGE_KEY,
  buildScopedChatPrompt,
  createChatMessage,
  loadChatHistory,
  saveChatHistory,
  stripMarkdownForSpeech,
} from "./chatSession"

class MemoryStorage {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe("chat session", () => {
  it("restores only valid messages and keeps the newest 30", () => {
    const storage = new MemoryStorage()
    const messages = Array.from({ length: 32 }, (_, index) => ({
      id: `message-${index}`,
      sender: index % 2 === 0 ? "user" : "assistant",
      text: `Nội dung ${index}`,
    }))
    storage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify([
        { id: "invalid", sender: "system", text: "Bỏ qua" },
        ...messages,
      ]),
    )

    const restored = loadChatHistory(storage)

    expect(restored).toHaveLength(30)
    expect(restored[0].id).toBe("message-2")
    expect(restored.at(-1)?.id).toBe("message-31")
  })

  it("returns an empty history when saved JSON is corrupted", () => {
    const storage = new MemoryStorage()
    storage.setItem(CHAT_STORAGE_KEY, "not-json")

    expect(loadChatHistory(storage)).toEqual([])
  })

  it("persists a message and creates stable message fields", () => {
    const storage = new MemoryStorage()
    const message = createChatMessage(
      "user",
      "  Tháp Rùa có bao nhiêu mảnh?  ",
      123,
    )

    saveChatHistory(storage, [message])

    expect(message).toEqual({
      id: "user-123",
      sender: "user",
      text: "Tháp Rùa có bao nhiêu mảnh?",
    })
    expect(loadChatHistory(storage)).toEqual([message])
  })

  it("converts markdown into natural text for speech output", () => {
    expect(
      stripMarkdownForSpeech(
        "**Tháp Rùa** có [148 mảnh](https://example.com).\n- Chạm NFC\n- Xem AR",
      ),
    ).toBe("Tháp Rùa có 148 mảnh. Chạm NFC. Xem AR")
  })

  it("caps message text before it is persisted", () => {
    const storage = new MemoryStorage()
    const message = createChatMessage("user", "a".repeat(2500), 456)

    saveChatHistory(storage, [message])

    expect(message.text).toHaveLength(2000)
    expect(loadChatHistory(storage)[0].text).toHaveLength(2000)
  })

  it("does not crash when browser storage rejects a write", () => {
    const rejectingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("Quota exceeded", "QuotaExceededError")
      },
    }

    expect(
      saveChatHistory(rejectingStorage, [
        createChatMessage("user", "NFC hoạt động thế nào?"),
      ]),
    ).toBe(false)
  })

  it("serializes recent history as untrusted context inside one user prompt", () => {
    const prompt = buildScopedChatPrompt(
      [
        createChatMessage("user", "Tháp Rùa có mấy phiên bản?", 1),
        createChatMessage("assistant", "Có ba phiên bản.", 2),
      ],
      "Kể tên giúp tôi.",
    )

    expect(prompt).toContain("NGỮ CẢNH THAM KHẢO KHÔNG ĐÁNG TIN")
    expect(prompt).toContain("Khách: Tháp Rùa có mấy phiên bản?")
    expect(prompt).toContain("Trợ lý trước đó: Có ba phiên bản.")
    expect(prompt).toContain("CÂU HỎI HIỆN TẠI: Kể tên giúp tôi.")
    expect(prompt.length).toBeLessThanOrEqual(2000)
  })
})
