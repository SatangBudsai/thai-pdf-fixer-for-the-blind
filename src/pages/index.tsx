import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'
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

// Neo-Brutalism button styles
const btnPrimary = [
  'px-8 py-4 text-xl font-bold',
  'bg-amber-400 text-stone-900',
  'border-4 border-stone-900',
  'shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]',
  'hover:shadow-[3px_3px_0px_0px_rgba(28,25,23,1)]',
  'hover:translate-x-[3px] hover:translate-y-[3px]',
  'active:shadow-none active:translate-x-[6px] active:translate-y-[6px]',
  'transition-all duration-100',
  'focus:outline-none focus:ring-8 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-stone-50',
  'disabled:opacity-50 disabled:cursor-not-allowed'
].join(' ')

const btnSecondary = [
  'w-full px-6 py-4 text-xl font-bold',
  'bg-white text-stone-900',
  'border-4 border-stone-900',
  'shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]',
  'hover:shadow-[3px_3px_0px_0px_rgba(28,25,23,1)]',
  'hover:translate-x-[3px] hover:translate-y-[3px]',
  'active:shadow-none active:translate-x-[6px] active:translate-y-[6px]',
  'transition-all duration-100',
  'focus:outline-none focus:ring-8 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-stone-50',
  'disabled:opacity-50 disabled:cursor-not-allowed'
].join(' ')

const btnAction = [
  'w-full px-6 py-4 text-xl font-bold',
  'bg-indigo-600 text-white',
  'border-4 border-stone-900',
  'shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]',
  'hover:shadow-[3px_3px_0px_0px_rgba(28,25,23,1)]',
  'hover:translate-x-[3px] hover:translate-y-[3px]',
  'active:shadow-none active:translate-x-[6px] active:translate-y-[6px]',
  'transition-all duration-100',
  'focus:outline-none focus:ring-8 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-stone-50',
  'disabled:opacity-50 disabled:cursor-not-allowed'
].join(' ')

type DeviceType = 'windows' | 'android' | 'ios' | 'other'

function detectDevice(): DeviceType {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  if (/windows/.test(ua)) return 'windows'
  return 'other'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('idle')
  const [outputText, setOutputText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [thaiVoiceAvailable, setThaiVoiceAvailable] = useState(true)
  const [fileName, setFileName] = useState('')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [deviceType, setDeviceType] = useState<DeviceType>('other')
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const processingAudioRef = useRef<HTMLAudioElement | null>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    setDeviceType(detectDevice())
    setIsInstalled(isStandalone())
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => setIsInstalled(true)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setIsInstalled(true)
        announce('กำลังติดตั้งแอปพลิเคชัน')
        speakText('กำลังติดตั้งแอปพลิเคชัน')
      }
      setDeferredPrompt(null)
    } else if (deviceType === 'ios') {
      setShowInstallGuide(prev => !prev)
    } else {
      setShowInstallGuide(prev => !prev)
    }
  }

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

    playSFX('upload')
    speakText('รับไฟล์แล้ว กำลังเริ่มแก้ไขข้อความ โปรดรอสักครู่')
    announce('รับไฟล์แล้ว กำลังเริ่มแก้ไขข้อความ โปรดรอสักครู่')

    const procAudio = playSFX('processing')
    procAudio.loop = true
    processingAudioRef.current = procAudio

    try {
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

      const fixedText = await new Promise<string>(resolve => {
        setTimeout(() => resolve(fixGarbledThai(rawText)), 50)
      })

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
        <title>Thai PDF Fixer - แก้ไขข้อความภาษาไทยจาก PDF</title>
      </Head>

      <a href='#main-content' className='skip-link'>
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <main id='main-content' className='mx-auto min-h-screen max-w-3xl px-6 py-12 sm:px-8'>
        {/* ===== Header ===== */}
        <header className='mb-12'>
          <h1 className='text-6xl font-black tracking-tight text-stone-900 sm:text-7xl'>Thai PDF Fixer</h1>
          <p className='mt-2 text-2xl font-bold text-indigo-600 sm:text-3xl'>สำหรับผู้ใช้งานโปรแกรมอ่านหน้าจอ</p>
          <div className='mt-4 border-l-[6px] border-amber-400 pl-5'>
            <p className='text-lg text-stone-600'>เครื่องมือแก้ไขสระและวรรณยุกต์ภาษาไทยที่ผิดเพี้ยนจากการคัดลอกไฟล์ PDF</p>
          </div>
        </header>

        {/* ===== Idle Phase ===== */}
        {phase === 'idle' && (
          <section aria-labelledby='upload-heading'>
            <h2 id='upload-heading' className='mb-6 text-2xl font-bold text-stone-900'>
              อัปโหลดไฟล์ PDF หรือ TXT
            </h2>
            <div className='border-4 border-stone-900 bg-white p-8 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]'>
              <div className='flex flex-col items-center gap-6 border-4 border-dashed border-stone-400 p-10'>
                <label htmlFor='file-upload' className={`${btnPrimary} cursor-pointer text-center`}>
                  เลือกไฟล์จากเครื่อง
                  <input
                    ref={fileInputRef}
                    id='file-upload'
                    type='file'
                    accept='.pdf,.txt'
                    onChange={handleFileUpload}
                    className='sr-only'
                    aria-describedby='upload-help'
                  />
                </label>
                <p id='upload-help' className='text-base text-stone-500'>
                  รองรับไฟล์ PDF และ TXT ที่มีข้อความภาษาไทยที่ต้องการแก้ไข
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===== Processing Phase ===== */}
        {phase === 'processing' && (
          <section aria-labelledby='processing-heading' aria-busy='true'>
            <h2 id='processing-heading' className='mb-6 text-3xl font-bold text-stone-900'>
              กำลังแก้ไขข้อความ
            </h2>
            <div className='flex flex-col items-center border-4 border-stone-900 bg-white p-12 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]'>
              <div className='mb-6 h-16 w-16 animate-spin rounded-full border-8 border-amber-200 border-t-amber-500' />
              <p className='text-2xl font-bold text-stone-900'>กำลังประมวลผล...</p>
              <p className='mt-2 text-lg text-stone-500'>{fileName}</p>
            </div>
          </section>
        )}

        {/* ===== Done Phase ===== */}
        {phase === 'done' && (
          <section aria-labelledby='result-heading'>
            <h2
              ref={resultHeadingRef}
              id='result-heading'
              tabIndex={-1}
              className='mb-6 text-3xl font-bold text-indigo-600 focus:outline-none focus:ring-8 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-stone-50'>
              ผลลัพธ์ที่แก้ไขแล้ว
            </h2>

            <div className='border-4 border-stone-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]'>
              <label htmlFor='output-text' className='mb-3 block text-lg font-bold text-stone-700'>
                ข้อความภาษาไทยที่แก้ไขแล้ว ({outputText.length} ตัวอักษร)
              </label>
              <textarea
                id='output-text'
                className='resize-vertical w-full border-4 border-stone-900 bg-stone-50 p-4 text-xl text-stone-900'
                rows={10}
                value={outputText}
                readOnly
              />
            </div>

            <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <button
                onClick={handleSpeak}
                disabled={!thaiVoiceAvailable && !speaking}
                className={btnAction}
                aria-label={speaking ? 'หยุดเล่นเสียง' : 'ฟังเสียงอ่านข้อความที่แก้ไขแล้ว'}>
                {speaking ? (
                  <>
                    <Icon icon='mdi:stop' className='mr-2 inline-block align-middle text-2xl' /> หยุดเสียง
                  </>
                ) : (
                  <>
                    <Icon icon='mdi:volume-high' className='mr-2 inline-block align-middle text-2xl' /> ฟังเสียงอ่าน
                  </>
                )}
              </button>

              <button onClick={handleCopy} className={btnSecondary}>
                <Icon icon='mdi:clipboard-outline' className='mr-2 inline-block align-middle text-2xl' /> คัดลอกข้อความ
              </button>

              <button onClick={handleDownloadTxt} className={btnSecondary}>
                <Icon icon='mdi:file-document-outline' className='mr-2 inline-block align-middle text-2xl' /> ดาวน์โหลด .txt
              </button>

              <button onClick={handleDownloadDocx} className={btnSecondary}>
                <Icon icon='mdi:file-word-outline' className='mr-2 inline-block align-middle text-2xl' /> ดาวน์โหลด .docx
              </button>
            </div>

            {!thaiVoiceAvailable && (
              <p className='mt-4 text-lg font-bold text-red-700' role='alert'>
                ไม่พบเสียงภาษาไทยในระบบ ฟังก์ชันอ่านเสียงอาจไม่ทำงาน
              </p>
            )}

            <div className='mt-10'>
              <button onClick={handleStartOver} className={`${btnPrimary} w-full`}>
                เริ่มใหม่
              </button>
            </div>
          </section>
        )}

        {/* ===== Error Phase ===== */}
        {phase === 'error' && (
          <section aria-labelledby='error-heading' role='alert'>
            <h2 id='error-heading' className='mb-6 text-3xl font-bold text-red-700'>
              เกิดข้อผิดพลาด
            </h2>
            <div className='border-4 border-red-700 bg-red-50 p-8 shadow-[6px_6px_0px_0px_rgba(185,28,28,1)]'>
              <p className='text-2xl font-bold text-red-900'>{errorMessage}</p>
            </div>
            <div className='mt-8'>
              <button onClick={handleStartOver} className={`${btnPrimary} w-full`}>
                ลองใหม่
              </button>
            </div>
          </section>
        )}

        {/* ===== Install App Section ===== */}
        {!isInstalled && (
          <section aria-labelledby='install-heading' className='mt-16 border-t-4 border-stone-300 pt-10'>
            <h2 id='install-heading' className='mb-4 text-2xl font-bold text-stone-900'>
              <Icon icon='mdi:download' className='mr-2 inline-block align-middle text-3xl' />
              ติดตั้งแอปลงเครื่อง
            </h2>
            <p className='mb-6 text-lg text-stone-600'>ติดตั้งเป็นแอปเพื่อใช้งานได้สะดวกขึ้น เปิดได้จากหน้าจอหลักโดยไม่ต้องเปิดเบราว์เซอร์</p>

            {/* Windows / Android - direct install */}
            {(deviceType === 'windows' || deviceType === 'android') && deferredPrompt && (
              <button onClick={handleInstallClick} className={`${btnPrimary} w-full`}>
                <Icon icon='mdi:cellphone-arrow-down' className='mr-2 inline-block align-middle text-2xl' />
                {deviceType === 'windows' ? 'ติดตั้งแอปบน Windows' : 'ติดตั้งแอปบน Android'}
              </button>
            )}

            {/* Windows / Android - no prompt available (already installed or unsupported browser) */}
            {(deviceType === 'windows' || deviceType === 'android') && !deferredPrompt && (
              <div className='border-4 border-stone-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]'>
                <button
                  onClick={() => setShowInstallGuide(prev => !prev)}
                  className={`${btnSecondary} flex items-center justify-center`}
                  aria-expanded={showInstallGuide}
                  aria-controls='install-guide'>
                  <Icon icon='mdi:information-outline' className='mr-2 inline-block text-2xl' />
                  {showInstallGuide ? 'ซ่อนวิธีติดตั้ง' : 'ดูวิธีติดตั้งด้วยตัวเอง'}
                </button>
                {showInstallGuide && (
                  <div id='install-guide' className='mt-6 space-y-3 text-lg text-stone-700'>
                    {deviceType === 'windows' ? (
                      <ol className='list-inside list-decimal space-y-3'>
                        <li>
                          เปิดเว็บไซต์นี้ด้วย <strong>Google Chrome</strong> หรือ <strong>Microsoft Edge</strong>
                        </li>
                        <li>
                          กดที่ <strong>เมนู 3 จุด</strong> (มุมขวาบน) หรือกด <strong>Alt + F</strong>
                        </li>
                        <li>
                          เลือก <strong>&quot;ติดตั้งแอป&quot;</strong> หรือ <strong>&quot;Install app&quot;</strong>
                        </li>
                        <li>
                          กด <strong>&quot;ติดตั้ง&quot;</strong> เพื่อยืนยัน
                        </li>
                        <li>
                          แอปจะปรากฏบน <strong>เดสก์ท็อป</strong> และ <strong>Start Menu</strong>
                        </li>
                      </ol>
                    ) : (
                      <ol className='list-inside list-decimal space-y-3'>
                        <li>
                          เปิดเว็บไซต์นี้ด้วย <strong>Google Chrome</strong>
                        </li>
                        <li>
                          กดที่ <strong>เมนู 3 จุด</strong> (มุมขวาบน)
                        </li>
                        <li>
                          เลือก <strong>&quot;ติดตั้งแอป&quot;</strong> หรือ <strong>&quot;Install app&quot;</strong>
                        </li>
                        <li>
                          กด <strong>&quot;ติดตั้ง&quot;</strong> เพื่อยืนยัน
                        </li>
                        <li>
                          แอปจะปรากฏบน <strong>หน้าจอหลัก</strong>
                        </li>
                      </ol>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* iOS */}
            {deviceType === 'ios' && (
              <div className='border-4 border-stone-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]'>
                <button
                  onClick={() => setShowInstallGuide(prev => !prev)}
                  className={`${btnSecondary} flex items-center justify-center`}
                  aria-expanded={showInstallGuide}
                  aria-controls='install-guide-ios'>
                  <Icon icon='mdi:apple' className='mr-2 inline-block text-2xl' />
                  {showInstallGuide ? 'ซ่อนวิธีติดตั้ง' : 'วิธีติดตั้งบน iPhone / iPad'}
                </button>
                {showInstallGuide && (
                  <div id='install-guide-ios' className='mt-6 space-y-3 text-lg text-stone-700'>
                    <p className='font-bold text-amber-700'>
                      <Icon icon='mdi:alert-outline' className='mr-1 inline-block align-middle text-xl' />
                      ต้องใช้ Safari เท่านั้น (ไม่สามารถใช้ Chrome บน iOS ได้)
                    </p>
                    <ol className='list-inside list-decimal space-y-3'>
                      <li>
                        เปิดเว็บไซต์นี้ด้วย <strong>Safari</strong>
                      </li>
                      <li>
                        กดปุ่ม <strong>แชร์</strong> (ไอคอนสี่เหลี่ยมมีลูกศรชี้ขึ้น) ที่แถบด้านล่าง
                      </li>
                      <li>
                        เลื่อนลงแล้วเลือก <strong>&quot;เพิ่มไปยังหน้าจอหลัก&quot;</strong> หรือ <strong>&quot;Add to Home Screen&quot;</strong>
                      </li>
                      <li>
                        กด <strong>&quot;เพิ่ม&quot;</strong> เพื่อยืนยัน
                      </li>
                      <li>
                        แอปจะปรากฏบน <strong>หน้าจอหลัก</strong> เหมือนแอปทั่วไป
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Other devices */}
            {deviceType === 'other' && (
              <div className='border-4 border-stone-900 bg-white p-6 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]'>
                <p className='text-lg text-stone-700'>
                  เปิดเว็บไซต์นี้ด้วย Google Chrome หรือ Safari แล้วเลือก &quot;ติดตั้งแอป&quot; หรือ &quot;Add to Home Screen&quot;
                  จากเมนูของเบราว์เซอร์
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Aria-live region for screen reader announcements */}
      <div aria-live='assertive' role='status' className='sr-only'>
        {statusMessage}
      </div>
    </>
  )
}
