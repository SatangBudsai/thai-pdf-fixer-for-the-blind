import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Head from 'next/head'
import Image from 'next/image'
import { fixGarbledThai } from '@/lib/thai-fixer'
import { extractTextFromPDF } from '@/lib/pdf-extractor'
import { speak, stop as stopSpeech, hasThaiVoice } from '@/lib/speech'
import { downloadAsTxt, copyToClipboard } from '@/lib/file-utils'
import { downloadAsDocx } from '@/lib/docx-generator'
import { segmentThai } from '@/lib/segment-api'

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
  if (globalThis.window === undefined) return false
  return (
    globalThis.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    localStorage.getItem('pwa-installed') === 'true'
  )
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
  const [installCheckDone, setInstallCheckDone] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const installPromptFired = useRef(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const processingAudioRef = useRef<HTMLAudioElement | null>(null)
  const readBtnRef = useRef<HTMLButtonElement>(null)
  const retryBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setDeviceType(detectDevice())
    setIsInstalled(isStandalone())
    setInstallCheckDone(true)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      installPromptFired.current = true
    }
    globalThis.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      localStorage.setItem('pwa-installed', 'true')
      setIsInstalled(true)
    }
    globalThis.addEventListener('appinstalled', installedHandler)

    // If no beforeinstallprompt fires within 3s and not standalone,
    // the app is likely already installed (browser won't fire the event)
    const timeout = setTimeout(() => {
      if (!installPromptFired.current && !isStandalone()) {
        setIsInstalled(true)
      }
    }, 3000)

    return () => {
      globalThis.removeEventListener('beforeinstallprompt', handler)
      globalThis.removeEventListener('appinstalled', installedHandler)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    const checkVoices = () => {
      setThaiVoiceAvailable(hasThaiVoice())
    }
    if (globalThis.window !== undefined && globalThis.speechSynthesis) {
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
        localStorage.setItem('pwa-installed', 'true')
        setIsInstalled(true)
        announce('ติดตั้งแอปพลิเคชันสำเร็จแล้ว')
        speakText('ติดตั้งแอปพลิเคชันสำเร็จแล้ว')
      }
      setDeferredPrompt(null)
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

      announce('แก้ไขคำเสร็จแล้ว กำลังตัดคำภาษาไทย...')
      const segmentedText = await segmentThai(fixedText)

      stopProcessingSound()
      playSFX('success')
      setOutputText(segmentedText)
      setPhase('done')

      const doneMsg = 'แก้ไขสำเร็จแล้ว กดปุ่มฟังเสียงอ่านเพื่อฟังข้อความ'
      speakText(doneMsg)
      announce(doneMsg)

      requestAnimationFrame(() => {
        readBtnRef.current?.focus()
      })
    } catch (err) {
      stopProcessingSound()
      playSFX('error')
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      setErrorMessage(msg)
      setPhase('error')
      speakText(msg)
      announce(msg)
      requestAnimationFrame(() => {
        retryBtnRef.current?.focus()
      })
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSpeak = () => {
    if (speaking) {
      stopSpeech()
      setSpeaking(false)
      announce('หยุดอ่านเสียงแล้ว')
    } else {
      setSpeaking(true)
      announce('กำลังอ่านข้อความ')
      speakText(outputText, () => {
        setSpeaking(false)
        announce('อ่านจบแล้ว')
      })
    }
  }

  const handleCopy = async () => {
    if (!outputText.trim()) return
    const success = await copyToClipboard(outputText)
    if (success) {
      playSFX('success')
      announce('คัดลอกข้อความทั้งหมดแล้ว')
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
          <div className='flex items-center gap-4'>
            <Image
              src='/icons/icon_x96.png'
              alt=''
              width={80}
              height={80}
              className='border-4 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]'
            />
            <h1 className='text-6xl font-black tracking-tight text-stone-900 sm:text-7xl'>Thai PDF Fixer</h1>
          </div>
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
            <h2 id='result-heading' className='mb-6 text-3xl font-bold text-indigo-600'>
              ผลลัพธ์ที่แก้ไขแล้ว
            </h2>

            {/* Read aloud button */}
            <button
              ref={readBtnRef}
              onClick={handleSpeak}
              disabled={!thaiVoiceAvailable && !speaking}
              className={`${btnPrimary} mb-6 w-full ${speaking ? '!bg-red-400' : '!bg-indigo-500 !text-white'}`}
              aria-label={speaking ? 'หยุดอ่านเสียง' : 'ฟังเสียงอ่านข้อความทั้งหมด'}>
              <Icon icon={speaking ? 'mdi:stop' : 'mdi:volume-high'} className='mr-2 inline-block align-middle text-2xl' />
              {speaking ? 'หยุดอ่าน' : 'ฟังเสียงอ่าน'}
            </button>

            {!thaiVoiceAvailable && (
              <p className='mb-4 text-lg font-bold text-red-700' role='alert'>
                ไม่พบเสียงภาษาไทยในระบบ ฟังก์ชันอ่านเสียงอาจไม่ทำงาน
              </p>
            )}

            {/* Full text display */}
            <div className='mb-6 border-4 border-stone-900 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]'>
              <label htmlFor='output-text' className='mb-2 block text-lg font-bold text-stone-700'>
                ข้อความที่แก้ไขแล้ว ({outputText.length.toLocaleString()} ตัวอักษร)
              </label>
              <textarea
                id='output-text'
                className='resize-vertical w-full border-4 border-stone-300 bg-stone-50 p-4 text-xl leading-relaxed text-stone-900'
                rows={12}
                value={outputText}
                readOnly
                aria-label='ข้อความทั้งหมดที่แก้ไขแล้ว'
              />
            </div>

            {/* Action buttons — responsive grid */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <button onClick={handleCopy} className={btnSecondary}>
                <Icon icon='mdi:clipboard-outline' className='mr-2 inline-block align-middle text-2xl' />
                คัดลอกข้อความ
              </button>

              <button onClick={handleDownloadTxt} className={btnSecondary}>
                <Icon icon='mdi:file-document-outline' className='mr-2 inline-block align-middle text-2xl' />
                ดาวน์โหลด .txt
              </button>

              <button onClick={handleDownloadDocx} className={btnSecondary}>
                <Icon icon='mdi:file-word-outline' className='mr-2 inline-block align-middle text-2xl' />
                ดาวน์โหลด .docx
              </button>

              <button onClick={handleStartOver} className={`${btnPrimary} w-full`}>
                <Icon icon='mdi:refresh' className='mr-2 inline-block align-middle text-2xl' />
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
              <button ref={retryBtnRef} onClick={handleStartOver} className={`${btnPrimary} w-full`}>
                ลองใหม่
              </button>
            </div>
          </section>
        )}

        {/* ===== Install App Section ===== */}
        {!installCheckDone ? null : isInstalled ? (
          <section aria-labelledby='installed-heading' className='mt-16 border-t-4 border-stone-300 pt-10'>
            <div className='flex items-center gap-4 border-4 border-green-700 bg-green-50 p-6 shadow-[6px_6px_0px_0px_rgba(21,128,61,1)]'>
              <Icon icon='mdi:check-circle' className='text-4xl text-green-700' />
              <div>
                <h2 id='installed-heading' className='text-2xl font-bold text-green-900'>
                  ติดตั้งแอปแล้ว
                </h2>
                <p className='mt-1 text-lg text-green-800'>คุณสามารถเปิดแอปจากหน้าจอหลักหรือเดสก์ท็อปได้เลย</p>
              </div>
            </div>
          </section>
        ) : (
          <section aria-labelledby='install-heading' className='mt-16 border-t-4 border-stone-300 pt-10'>
            <h2 id='install-heading' className='mb-4 text-2xl font-bold text-stone-900'>
              <Icon icon='mdi:download' className='mr-2 inline-block align-middle text-3xl' />
              ติดตั้งแอปลงเครื่อง
            </h2>
            <p className='mb-6 text-lg text-stone-600'>ติดตั้งเป็นแอปเพื่อใช้งานได้สะดวกขึ้น เปิดได้จากหน้าจอหลักโดยไม่ต้องเปิดเบราว์เซอร์</p>

            {/* Windows / Android */}
            {(deviceType === 'windows' || deviceType === 'android') && deferredPrompt && (
              <button onClick={handleInstallClick} className={`${btnPrimary} w-full`}>
                <Icon icon='mdi:cellphone-arrow-down' className='mr-2 inline-block align-middle text-2xl' />
                {deviceType === 'windows' ? 'ติดตั้งแอปบน Windows' : 'ติดตั้งแอปบน Android'}
              </button>
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
