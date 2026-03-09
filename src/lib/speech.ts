let currentUtterance: SpeechSynthesisUtterance | null = null
let cachedVoice: SpeechSynthesisVoice | null = null
let voicesReady = false

function getThaiFemaleVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice

  const voices = speechSynthesis.getVoices()
  const thaiVoices = voices.filter(v => v.lang.startsWith('th'))

  // Windows Thai voices: "Microsoft Kanya Online (Natural) - Thai (Thailand)"
  const femaleKeywords = ['kanya', 'premwadee', 'female', 'woman', 'หญิง']
  const female = thaiVoices.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)))

  cachedVoice = female || thaiVoices[0] || null
  return cachedVoice
}

// Wait for voices to load (WebView2 loads them asynchronously)
export function waitForVoices(): Promise<void> {
  return new Promise(resolve => {
    if (voicesReady) {
      resolve()
      return
    }
    const voices = speechSynthesis.getVoices()
    if (voices.length > 0) {
      voicesReady = true
      getThaiFemaleVoice()
      resolve()
      return
    }
    const handler = () => {
      voicesReady = true
      cachedVoice = null
      getThaiFemaleVoice()
      resolve()
    }
    speechSynthesis.onvoiceschanged = handler
    // Fallback timeout — some environments never fire onvoiceschanged
    setTimeout(() => {
      if (!voicesReady) {
        voicesReady = true
        getThaiFemaleVoice()
        resolve()
      }
    }, 2000)
  })
}

// Pre-load voices (some browsers load asynchronously)
if (globalThis.window !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    voicesReady = true
    getThaiFemaleVoice()
  }
}

export function speak(text: string, onEnd?: () => void): void {
  stop()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'th-TH'
  utterance.rate = 0.9

  const voice = getThaiFemaleVoice()
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
