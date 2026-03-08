import { useState, useRef, useCallback, useEffect } from 'react'
import Head from 'next/head'
import { fixGarbledThai } from '@/lib/thai-fixer'
import { extractTextFromPDF } from '@/lib/pdf-extractor'
import { speak, stop as stopSpeech, hasThaiVoice } from '@/lib/speech'
import { downloadAsTxt, copyToClipboard } from '@/lib/file-utils'
import { downloadAsDocx } from '@/lib/docx-generator'

type AppPhase = 'idle' | 'processing' | 'done' | 'error'

function playSFX(name: string): HTMLAudioElement {
  const audio = new Audio(`/sounds/${name}.mp3`)
  audio.play().catch(() => {})
  return audio
}

function speakText(text: string, onEnd?: () => void): void {
  speak(text, onEnd)
}

const btnBase = [
  'w-full p-6 text-2xl font-bold',
  'bg-white text-stone-900',
  'border-4 border-stone-900',
  'shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]',
  'hover:shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]',
  'hover:translate-x-1 hover:translate-y-1',
  'active:shadow-none active:translate-x-2 active:translate-y-2',
  'transition-all duration-100',
  'focus:outline-none focus:ring-8 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-stone-50',
  'disabled:opacity-50 disabled:cursor-not-allowed'
].join(' ')

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('idle')
  const [outputText, setOutputText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [thaiVoiceAvailable, setThaiVoiceAvailable] = useState(true)
  const [fileName, setFileName] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const processingAudioRef = useRef<HTMLAudioElement | null>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const checkVoices = () => {
      setThaiVoiceAvailable(hasThaiVoice())
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.addEventListener('voiceschanged', checkVoices)
      checkVoices()
      return () => speechSynthesis.removeEventListener('voiceschanged', checkVoices)
    }
  }, [])

  const announce = useCallback((message: string) => {
    setStatusMessage('')
    requestAnimationFrame(() => {
      setStatusMessage(message)
    })
  }, [])

  const stopProcessingSound = useCallback(() => {
    if (processingAudioRef.current) {
      processingAudioRef.current.pause()
      processingAudioRef.current.currentTime = 0
      processingAudioRef.current = null
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.toLowerCase().split('.').pop()
    if (ext !== 'pdf' && ext !== 'txt') {
      setPhase('error')
      setErrorMessage('รองรับเฉพาะไฟล์ PDF หรือ TXT เท่านั้น')
      playSFX('error')
      speakText('ไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์ PDF หรือ TXT เท่านั้น')
      announce('ไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์ PDF หรือ TXT เท่านั้น')
      return
    }

    setFileName(file.name)
    setPhase('processing')
    setOutputText('')
    setErrorMessage('')

    // Step 1: Upload SFX + TTS
    playSFX('upload')
    speakText('รับไฟล์แล้ว กำลังเริ่มแก้ไขข้อความ โปรดรอสักครู่')
    announce('รับไฟล์แล้ว กำลังเริ่มแก้ไขข้อความ โปรดรอสักครู่')

    // Step 2: Start looping processing sound
    const procAudio = playSFX('processing')
    procAudio.loop = true
    processingAudioRef.current = procAudio

    try {
      // Step 3: Extract text
      let rawText: string
      if (ext === 'pdf') {
        rawText = await extractTextFromPDF(file, (current, total) => {
          announce(`กำลังอ่านหน้า ${current} จาก ${total}`)
        })
      } else {
        rawText = await file.text()
      }

      if (!rawText.trim()) {
        throw new Error('ไม่พบข้อความในไฟล์')
      }

      // Step 4: Fix text
      const fixedText = await new Promise<string>(resolve => {
        setTimeout(() => resolve(fixGarbledThai(rawText)), 50)
      })

      // Step 5: Success
      stopProcessingSound()
      playSFX('success')
      setOutputText(fixedText)
      setPhase('done')
      speakText('แก้ไขสำเร็จแล้ว ผลลัพธ์พร้อมใช้งาน')
      announce('แก้ไขสำเร็จแล้ว ผลลัพธ์พร้อมใช้งาน')

      requestAnimationFrame(() => {
        resultHeadingRef.current?.focus()
      })
    } catch (err) {
      stopProcessingSound()
      playSFX('error')
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      setErrorMessage(msg)
      setPhase('error')
      speakText(msg)
      announce(msg)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSpeak = () => {
    if (!outputText.trim()) return

    if (speaking) {
      stopSpeech()
      setSpeaking(false)
      announce('หยุดอ่านเสียงแล้ว')
    } else {
      setSpeaking(true)
      announce('กำลังเล่นเสียงข้อความ')
      speakText(outputText, () => {
        setSpeaking(false)
        announce('อ่านเสียงข้อความจบแล้ว')
      })
    }
  }

  const handleCopy = async () => {
    if (!outputText.trim()) return
    const success = await copyToClipboard(outputText)
    if (success) {
      playSFX('success')
      announce('คัดลอกข้อความไปยังคลิปบอร์ดแล้ว')
      speakText('คัดลอกข้อความแล้ว')
    } else {
      playSFX('error')
      announce('ไม่สามารถคัดลอกข้อความได้ กรุณาลองใหม่')
      speakText('ไม่สามารถคัดลอกข้อความได้')
    }
  }

  const handleDownloadTxt = () => {
    if (!outputText.trim()) return
    downloadAsTxt(outputText)
    playSFX('success')
    announce('กำลังดาวน์โหลดไฟล์ข้อความ')
    speakText('กำลังดาวน์โหลดไฟล์ข้อความ')
  }

  const handleDownloadDocx = async () => {
    if (!outputText.trim()) return
    try {
      await downloadAsDocx(outputText)
      playSFX('success')
      announce('กำลังดาวน์โหลดไฟล์เอกสาร')
      speakText('กำลังดาวน์โหลดไฟล์เอกสาร')
    } catch {
      playSFX('error')
      announce('เกิดข้อผิดพลาดในการสร้างไฟล์เอกสาร')
      speakText('เกิดข้อผิดพลาดในการสร้างไฟล์เอกสาร')
    }
  }

  const handleStartOver = () => {
    stopSpeech()
    setSpeaking(false)
    stopProcessingSound()
    setPhase('idle')
    setOutputText('')
    setErrorMessage('')
    setFileName('')
    announce('พร้อมเริ่มใหม่ กรุณาอัปโหลดไฟล์')
    speakText('พร้อมเริ่มใหม่')
  }

  return (
    <>
      <Head>
        <title>แก้ไทย PDF - เครื่องมือแก้ไขข้อความภาษาไทยสำหรับคนตาบอด</title>
      </Head>

      <a href="#main-content" className="skip-link">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <main id="main-content" className="mx-auto max-w-2xl min-h-screen p-8">
        <h1 className="text-4xl font-bold text-stone-900">แก้ไทย PDF</h1>
        <p className="mt-2 text-xl text-stone-600">เครื่องมือแก้ไขสระและวรรณยุกต์ภาษาไทยที่ผิดเพี้ยนจากการคัดลอกไฟล์ PDF สำหรับผู้ใช้งานโปรแกรมอ่านหน้าจอ</p>

        <div className="mt-12">
          {/* Idle Phase: Upload */}
          {phase === 'idle' && (
            <section aria-labelledby="upload-heading">
              <h2 id="upload-heading" className="mb-6 text-3xl font-bold text-stone-900">
                อัปโหลดไฟล์ PDF หรือ TXT
              </h2>
              <label
                htmlFor="file-upload"
                className={`${btnBase} block cursor-pointer text-center`}
              >
                เลือกไฟล์จากเครื่อง
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="sr-only"
                  aria-describedby="upload-help"
                />
              </label>
              <p id="upload-help" className="mt-4 text-lg text-stone-500">
                รองรับไฟล์ PDF และ TXT ที่มีข้อความภาษาไทยที่ต้องการแก้ไข
              </p>
            </section>
          )}

          {/* Processing Phase */}
          {phase === 'processing' && (
            <section aria-labelledby="processing-heading" aria-busy="true">
              <h2 id="processing-heading" className="mb-6 text-3xl font-bold text-stone-900">
                กำลังแก้ไขข้อความ
              </h2>
              <div className="flex flex-col items-center border-4 border-stone-900 bg-white p-12">
                <div className="mb-6 h-16 w-16 animate-spin rounded-full border-8 border-stone-200 border-t-stone-900" />
                <p className="text-2xl font-bold text-stone-900">กำลังประมวลผล...</p>
                <p className="mt-2 text-lg text-stone-500">ไฟล์: {fileName}</p>
              </div>
            </section>
          )}

          {/* Done Phase: Results */}
          {phase === 'done' && (
            <section aria-labelledby="result-heading">
              <h2
                ref={resultHeadingRef}
                id="result-heading"
                tabIndex={-1}
                className="mb-6 text-3xl font-bold text-stone-900 focus:outline-none focus:ring-8 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-stone-50"
              >
                ผลลัพธ์ที่แก้ไขแล้ว
              </h2>

              <label htmlFor="output-text" className="mb-3 block text-xl font-bold text-stone-700">
                ข้อความภาษาไทยที่แก้ไขแล้ว ({outputText.length} ตัวอักษร)
              </label>
              <textarea
                id="output-text"
                className="w-full resize-vertical border-4 border-stone-900 bg-white p-6 text-2xl text-stone-900"
                rows={10}
                value={outputText}
                readOnly
              />

              <div className="mt-8 space-y-4">
                <button
                  onClick={handleSpeak}
                  disabled={!thaiVoiceAvailable && !speaking}
                  className={btnBase}
                  aria-label={speaking ? 'หยุดเล่นเสียง' : 'ฟังเสียงอ่านข้อความที่แก้ไขแล้ว'}
                >
                  {speaking ? 'หยุดเสียง' : 'ฟังเสียงอ่านข้อความ'}
                </button>

                {!thaiVoiceAvailable && (
                  <p className="text-lg text-red-700" role="alert">
                    ไม่พบเสียงภาษาไทยในระบบ ฟังก์ชันอ่านเสียงอาจไม่ทำงาน
                  </p>
                )}

                <button onClick={handleCopy} className={btnBase}>
                  คัดลอกข้อความ
                </button>

                <button onClick={handleDownloadTxt} className={btnBase}>
                  ดาวน์โหลดไฟล์ .txt
                </button>

                <button onClick={handleDownloadDocx} className={btnBase}>
                  ดาวน์โหลดไฟล์ .docx
                </button>
              </div>

              <div className="mt-12">
                <button onClick={handleStartOver} className={`${btnBase} bg-stone-100`}>
                  เริ่มใหม่
                </button>
              </div>
            </section>
          )}

          {/* Error Phase */}
          {phase === 'error' && (
            <section aria-labelledby="error-heading" role="alert">
              <h2 id="error-heading" className="mb-6 text-3xl font-bold text-red-800">
                เกิดข้อผิดพลาด
              </h2>
              <div className="border-4 border-red-800 bg-red-50 p-8">
                <p className="text-2xl text-red-900">{errorMessage}</p>
              </div>
              <div className="mt-8">
                <button onClick={handleStartOver} className={btnBase}>
                  ลองใหม่
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Aria-live region for screen reader announcements */}
      <div aria-live="assertive" role="status" className="sr-only">
        {statusMessage}
      </div>
    </>
  )
}
