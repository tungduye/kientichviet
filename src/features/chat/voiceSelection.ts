export interface VoiceDescriptor {
  name: string
  lang: string
  localService?: boolean
}

export interface VoiceProvider<TVoice extends VoiceDescriptor> {
  getVoices: () => TVoice[]
  addEventListener?: (
    event: "voiceschanged",
    listener: () => void,
  ) => void
  removeEventListener?: (
    event: "voiceschanged",
    listener: () => void,
  ) => void
}

function normalizeVoiceName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function vietnameseVoiceScore(voice: VoiceDescriptor): number {
  if (!voice.lang.toLowerCase().startsWith("vi")) {
    return Number.NEGATIVE_INFINITY
  }

  const name = normalizeVoiceName(voice.name)
  let score = 100

  if (name.includes("hoaimy") || name.includes("hoai my")) score += 1000
  else if (name.includes("namminh") || name.includes("nam minh")) score += 900
  else if (name.includes("google") && name.includes("tieng viet")) score += 800
  else if (name.includes("google")) score += 700
  else if (name.includes("microsoft")) score += 600

  if (name.includes("natural") || name.includes("online")) score += 200
  if (voice.lang.toLowerCase() === "vi-vn") score += 50
  if (voice.localService) score += 10

  return score
}

export function selectVietnameseVoice<TVoice extends VoiceDescriptor>(
  voices: readonly TVoice[],
): TVoice | undefined {
  return [...voices]
    .filter((voice) => voice.lang.toLowerCase().startsWith("vi"))
    .sort((left, right) =>
      vietnameseVoiceScore(right) - vietnameseVoiceScore(left),
    )[0]
}

export function waitForVietnameseVoice<TVoice extends VoiceDescriptor>(
  provider: VoiceProvider<TVoice>,
  timeoutMs = 1200,
): Promise<TVoice | undefined> {
  const availableVoice = selectVietnameseVoice(provider.getVoices())
  if (availableVoice || !provider.addEventListener) {
    return Promise.resolve(availableVoice)
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      provider.removeEventListener?.("voiceschanged", finish)
      resolve(selectVietnameseVoice(provider.getVoices()))
    }
    const timeout = setTimeout(finish, timeoutMs)
    provider.addEventListener?.("voiceschanged", finish)
  })
}
