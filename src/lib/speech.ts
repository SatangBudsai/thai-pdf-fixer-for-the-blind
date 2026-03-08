let currentUtterance: SpeechSynthesisUtterance | null = null

export function speak(text: string, onEnd?: () => void): void {
  stop()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'th-TH'
  utterance.rate = 0.9
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
