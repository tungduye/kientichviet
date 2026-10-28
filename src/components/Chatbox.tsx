import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

import { Icon } from "./Shared"
import {
  ChatMessage,
  buildScopedChatPrompt,
  createChatMessage,
  loadChatHistory,
  saveChatHistory,
  stripMarkdownForSpeech,
} from "../features/chat/chatSession"
import { supabase } from "../integrations/supabase/client"

const MASCOT_IMAGE = "/images/linh-vat-kien-tich.png"
const STARTER_QUESTIONS = [
  "Tháp Rùa có những phiên bản nào?",
  "Hướng dẫn tôi bắt đầu lắp ghép mô hình.",
  "NFC trên sản phẩm dùng như thế nào?",
  "Tôi có thể trải nghiệm AR ra sao?",
  "Kể tôi nghe câu chuyện Phố Hàng Trống.",
]

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null
  const voiceWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return (
    voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition ?? null
  )
}

export default function Chatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    typeof window === "undefined" ? [] : loadChatHistory(window.localStorage),
  )
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceNotice, setVoiceNotice] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const conversationGenerationRef = useRef(0)
  const supportsVoiceInput = Boolean(getSpeechRecognitionConstructor())
  const supportsVoiceOutput =
    typeof window !== "undefined" && "speechSynthesis" in window

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (typeof window !== "undefined")
      saveChatHistory(window.localStorage, messages)
  }, [messages])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    if (!supportsVoiceOutput) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [supportsVoiceOutput])

  const speakReply = useCallback(
    (reply: string) => {
      if (!supportsVoiceOutput) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(
        stripMarkdownForSpeech(reply),
      )
      utterance.lang = "vi-VN"
      utterance.rate = 0.96
      const voice = window.speechSynthesis
        .getVoices()
        .find((item) => item.lang.toLowerCase().startsWith("vi"))
      if (voice) utterance.voice = voice
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    },
    [supportsVoiceOutput],
  )

  const handleSend = useCallback(
    async (text: string) => {
      const cleanedText = text.trim()
      if (!cleanedText || isTyping) return
      const conversationGeneration = conversationGenerationRef.current
      const userMessage = createChatMessage("user", cleanedText)
      setMessages((previous) => [...previous, userMessage].slice(-30))
      setInputValue("")
      setVoiceNotice("")
      setIsTyping(true)
      recognitionRef.current?.stop()

      try {
        const scopedPrompt = buildScopedChatPrompt(messages, userMessage.text)
        const { data, error } = await supabase.functions.invoke(
          "heritage-chat",
          {
            body: {
              messages: [{ sender: "user", text: scopedPrompt }],
            },
          },
        )
        let reply = data?.reply as string | undefined
        if (!reply) {
          let message = data?.error as string | undefined
          if (!message && error && "context" in error) {
            try {
              message = (await (error as { context: Response }).context.json())
                .error
            } catch {
              // Use the friendly fallback below when the response is not JSON.
            }
          }
          reply = message || "Trợ lý tạm thời không phản hồi. Vui lòng thử lại."
        }
        const assistantMessage = createChatMessage(
          "assistant",
          reply,
          Date.now() + 1,
        )
        if (conversationGenerationRef.current !== conversationGeneration) return
        setMessages((previous) => [...previous, assistantMessage].slice(-30))
        speakReply(reply)
      } catch {
        if (conversationGenerationRef.current !== conversationGeneration) return
        const fallback = "Không kết nối được trợ lý. Vui lòng thử lại."
        setMessages((previous) => [
          ...previous,
          createChatMessage("assistant", fallback, Date.now() + 1),
        ])
        speakReply(fallback)
      } finally {
        if (conversationGenerationRef.current === conversationGeneration) {
          setIsTyping(false)
        }
      }
    },
    [isTyping, messages, speakReply],
  )

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    const Recognition = getSpeechRecognitionConstructor()
    if (!Recognition) {
      setVoiceNotice("Trình duyệt này chưa hỗ trợ nhập câu hỏi bằng giọng nói.")
      return
    }
    stopSpeaking()
    const recognition = new Recognition()
    recognition.lang = "vi-VN"
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onstart = () => {
      setIsListening(true)
      setVoiceNotice("Đang nghe… Hãy nói câu hỏi của bạn.")
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = ({ error }) => {
      setIsListening(false)
      if (error !== "aborted") {
        setVoiceNotice(
          error === "not-allowed"
            ? "Bạn cần cho phép dùng microphone để hỏi bằng giọng nói."
            : "Chưa nghe rõ. Bạn vui lòng thử lại.",
        )
      }
    }
    recognition.onresult = (event) => {
      let interimText = ""
      let finalText = ""
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index]
        if (result.isFinal) finalText += result[0].transcript
        else interimText += result[0].transcript
      }
      setInputValue(finalText || interimText)
      if (finalText.trim()) void handleSend(finalText)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const clearConversation = () => {
    conversationGenerationRef.current += 1
    recognitionRef.current?.abort()
    stopSpeaking()
    setMessages([])
    setInputValue("")
    setIsListening(false)
    setIsTyping(false)
    setVoiceNotice("Đã xóa lịch sử trò chuyện trên thiết bị này.")
  }

  const closeChat = () => {
    conversationGenerationRef.current += 1
    recognitionRef.current?.abort()
    stopSpeaking()
    setIsListening(false)
    setIsTyping(false)
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="chat-floating-trigger"
        style={{ display: isOpen ? "none" : "flex" }}
        aria-label="Mở Trợ lý Kiến Tích AI"
      >
        <span className="chat-trigger-icon chat-mascot-frame">
          <img src={MASCOT_IMAGE} alt="" />
        </span>
        <span className="chat-trigger-text">Hỏi Trợ lý AI</span>
      </button>

      {isOpen && (
        <section
          className="chat-panel-container"
          aria-label="Trợ lý Kiến Tích Việt"
        >
          <header className="chat-panel-header">
            <div className="chat-panel-title">
              <span className="chat-mascot-frame chat-mascot-header">
                <img src={MASCOT_IMAGE} alt="Linh vật Kiến Tích Việt" />
              </span>
              <div>
                <h3>Trợ lý Kiến Tích Việt</h3>
                <small>Hỏi bằng chữ hoặc giọng nói</small>
              </div>
            </div>
            <div className="chat-header-actions">
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  aria-label="Xóa lịch sử trò chuyện"
                >
                  <Icon name="trash" size={19} />
                </button>
              )}
              <button onClick={closeChat} aria-label="Đóng chat">
                <Icon name="close" size={22} />
              </button>
            </div>
          </header>

          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <span className="chat-mascot-frame chat-mascot-welcome">
                  <img src={MASCOT_IMAGE} alt="" />
                </span>
                <h4>Xin chào! Tôi là trợ lý di sản.</h4>
                <p>
                  Tôi có thể kể hai câu chuyện Tháp Rùa và Phố Hàng Trống, hướng
                  dẫn lắp ghép, NFC và trải nghiệm AR.
                </p>
                <div className="chat-starter-list">
                  {STARTER_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => void handleSend(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message-row chat-message-${message.sender}`}
                >
                  {message.sender === "assistant" && (
                    <span className="chat-mascot-frame chat-message-avatar">
                      <img src={MASCOT_IMAGE} alt="" />
                    </span>
                  )}
                  <div
                    className={`chat-message-bubble ${
                      message.sender === "assistant" ? "markdown-body" : ""
                    }`}
                  >
                    {message.sender === "assistant" ? (
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="chat-message-row chat-message-assistant">
                <span className="chat-mascot-frame chat-message-avatar">
                  <img src={MASCOT_IMAGE} alt="" />
                </span>
                <div className="chat-typing" aria-label="Trợ lý đang trả lời">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {(voiceNotice || isSpeaking) && (
            <div className="chat-voice-status" role="status">
              <span>
                {isSpeaking ? "Linh vật đang đọc câu trả lời…" : voiceNotice}
              </span>
              {isSpeaking && <button onClick={stopSpeaking}>Dừng đọc</button>}
            </div>
          )}

          <div className="chat-input-wrap">
            <button
              className={`chat-voice-button ${
                isListening ? "is-listening" : ""
              }`}
              type="button"
              onClick={toggleListening}
              disabled={isTyping}
              aria-label={isListening ? "Dừng nghe" : "Hỏi bằng giọng nói"}
              title={
                supportsVoiceInput
                  ? "Hỏi bằng giọng nói"
                  : "Voice chưa được hỗ trợ"
              }
            >
              <Icon name={isListening ? "close" : "microphone"} size={21} />
            </button>
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void handleSend(inputValue)
                }
              }}
              placeholder={isListening ? "Đang nghe…" : "Nhập câu hỏi của bạn…"}
              maxLength={2000}
              rows={1}
            />
            <button
              className="chat-send-button"
              onClick={() => void handleSend(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Gửi tin nhắn"
            >
              <Icon name="arrow" size={23} />
            </button>
          </div>
          <small className="chat-voice-privacy">
            Khi bật micro, trình duyệt có thể gửi âm thanh tới nhà cung cấp dịch
            vụ nhận dạng giọng nói trực tuyến.
          </small>
        </section>
      )}
    </>
  )
}
