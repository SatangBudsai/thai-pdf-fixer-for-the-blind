let currentUtterance: SpeechSynthesisUtterance | null = null
let cachedVoice: SpeechSynthesisVoice | null = null

function getThaiFemalVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice

  const voices = speechSynthesis.getVoices()
  const thaiVoices = voices.filter(v => v.lang.startsWith('th'))

  // Prefer female voices (common names: Kanya, Premwadee, Microsoft Kanya)
  const femaleKeywords = ['kanya', 'premwadee', 'female', 'woman', 'หญิง']
  const female = thaiVoices.find(v =>
    femaleKeywords.some(k => v.name.toLowerCase().includes(k))
  )

  // Fallback: any Thai voice
  cachedVoice = female || thaiVoices[0] || null
  return cachedVoice
}

// Pre-load voices (some browsers load asynchronously)
if (typeof window !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    getThaiFemalVoice()
  }
}

export function speak(text: string, onEnd?: () => void): void {
  stop()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'th-TH'
  utterance.rate = 0.9

  const voice = getThaiFemalVoice()
  if (voice) utterance.voice = voice

  utterance.onend = () => {
    currentUtterance = null
    onEnd?.()
  }
  utterance.onerror = () => {
    currentUtterance = null
    onEnd?.()
  }
  currentUtterance = utterance
  speechSynthesis.speak(utterance)
}

export function speakAsync(text: string): Promise<void> {
  return new Promise(resolve => {
    speak(text, resolve)
  })
}

export function stop(): void {
  speechSynthesis.cancel()
  currentUtterance = null
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking
}

export function hasThaiVoice(): boolean {
  const voices = speechSynthesis.getVoices()
  return voices.some(v => v.lang.startsWith('th'))
}
