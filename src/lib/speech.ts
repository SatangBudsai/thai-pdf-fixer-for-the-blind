let currentUtterance: SpeechSynthesisUtterance | null = null
let cachedVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false
let voicesPromise: Promise<void> | null = null

function findThaiFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) return null

  // Find Thai voices by lang code
  const thaiVoices = voices.filter(v => v.lang.startsWith('th'))

  // Also check by name (some systems report lang differently)
  const thaiByName = voices.filter(
    v => v.name.toLowerCase().includes('thai') || v.name.toLowerCase().includes('kanya')
  )

  const allThai = [...new Set([...thaiVoices, ...thaiByName])]

  if (allThai.length === 0) {
    console.warn('[TTS] ไม่พบเสียงภาษาไทย — voices available:', voices.map(v => `${v.name} (${v.lang})`))
    return null
  }

  console.log('[TTS] Thai voices found:', allThai.map(v => `${v.name} (${v.lang})`))

  // Prefer female voices
  const femaleKeywords = ['kanya', 'premwadee', 'female', 'woman', 'หญิง']
  const female = allThai.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)))

  const selected = female || allThai[0]
  console.log('[TTS] Selected voice:', selected.name, selected.lang)
  return selected
}

// Ensure voices are loaded before speaking
function ensureVoices(): Promise<void> {
  if (voicesLoaded && cachedVoice) return Promise.resolve()

  if (voicesPromise) return voicesPromise

  voicesPromise = new Promise<void>(resolve => {
    const tryLoad = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        voicesLoaded = true
        cachedVoice = findThaiFemaleVoice()
        resolve()
        return true
      }
      return false
    }

    // Try immediately
    if (tryLoad()) return

    // Listen for voices changed event
    speechSynthesis.onvoiceschanged = () => {
      if (tryLoad()) {
        speechSynthesis.onvoiceschanged = null
      }
    }

    // Fallback: poll every 200ms for up to 5 seconds
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (tryLoad() || attempts >= 25) {
        clearInterval(interval)
        if (!voicesLoaded) {
          voicesLoaded = true
          cachedVoice = findThaiFemaleVoice()
          resolve()
        }
      }
    }, 200)
  })

  return voicesPromise
}

// Start loading voices immediately on module import
if (globalThis.window !== undefined) {
  ensureVoices()
}

export function speak(text: string, onEnd?: () => void): void {
  stop()

  // Re-check voice cache in case voices loaded after initial attempt
  if (!cachedVoice) {
    cachedVoice = findThaiFemaleVoice()
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'th-TH'
  utterance.rate = 0.9

  if (cachedVoice) {
    utterance.voice = cachedVoice
  }

  utterance.onend = () => {
    currentUtterance = null
    onEnd?.()
  }
  utterance.onerror = (e) => {
    // Don't treat 'interrupted' as error (happens when stop() is called)
    if (e.error === 'interrupted') return
    currentUtterance = null
    onEnd?.()
  }
  currentUtterance = utterance
  speechSynthesis.speak(utterance)
}

export async function speakAsync(text: string): Promise<void> {
  // Always wait for voices before speaking
  await ensureVoices()
  return new Promise(resolve => {
    speak(text, resolve)
  })
}

export { ensureVoices as waitForVoices }

export function stop(): void {
  speechSynthesis.cancel()
  currentUtterance = null
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking
}

export function hasThaiVoice(): boolean {
  return cachedVoice !== null
}
