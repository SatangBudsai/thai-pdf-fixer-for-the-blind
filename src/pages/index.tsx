import { useState, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'
import Head from 'next/head'
import { speak, stop as stopSpeech } from '@/lib/speech'

// Tauri APIs — imported dynamically to avoid SSR errors during Next.js build
let tauriDialog: typeof import('@tauri-apps/plugin-dialog') | null = null
let tauriShell: typeof import('@tauri-apps/plugin-shell') | null = null

if (typeof window !== 'undefined') {
  import('@tauri-apps/plugin-dialog').then((m) => {
    tauriDialog = m
  })
  import('@tauri-apps/plugin-shell').then((m) => {
    tauriShell = m
  })
}

type AppPhase = 'idle' | 'processing' | 'done' | 'error'

interface Progress {
  page: number
  total: number
  message: string
}

function playSFX(name: string): HTMLAudioElement {
  const audio = new Audio(`/sounds/${name}.mp3`)
  audio.play().catch(() => {})
  return audio
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
  'disabled:opacity-50 disabled:cursor-not-allowed',
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
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ')

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('idle')
  const [progress, setProgress] = useState<Progress>({ page: 0, total: 0, message: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [inputPath, setInputPath] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [previewText, setPreviewText] = useState('')

  const processingAudioRef = useRef<HTMLAudioElement | null>(null)
  const retryBtnRef = useRef<HTMLButtonElement>(null)

  // Screen reader announcement
  const announce = useCallback((msg: string) => {
    setStatusMessage(msg)
  }, [])

  // ── Select PDF and start conversion ────────────────────────────
  const handleSelectAndConvert = useCallback(async () => {
    if (!tauriDialog || !tauriShell) {
      setErrorMessage('Tauri APIs ยังไม่พร้อม กรุณารอสักครู่')
      setPhase('error')
      return
    }

    try {
      // Open file dialog to select PDF
      const selected = await tauriDialog.open({
        multiple: false,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      })

      if (!selected) return // user cancelled

      const pdfPath = selected as string
      setInputPath(pdfPath)

      // Extract filename for display
      const fileName = pdfPath.split(/[/\\]/).pop() || pdfPath

      // Open save dialog for output DOCX
      const suggestedOutput = pdfPath.replace(/\.pdf$/i, '_fixed.docx')
      const savePath = await tauriDialog.save({
        defaultPath: suggestedOutput,
        filters: [{ name: 'Word Document', extensions: ['docx'] }],
      })

      if (!savePath) return // user cancelled
      setOutputPath(savePath)

      // Start conversion
      setPhase('processing')
      setProgress({ page: 0, total: 0, message: 'กำลังเริ่มต้น...' })
      announce(`กำลังแปลงไฟล์ ${fileName}`)
      playSFX('processing')
      processingAudioRef.current = playSFX('processing')

      const command = tauriShell.Command.sidecar('binaries/converter', [
        'convert',
        pdfPath,
        savePath,
      ])

      command.stdout.on('data', (line: string) => {
        try {
          const msg = JSON.parse(line)
          if (msg.type === 'progress') {
            setProgress({ page: msg.page, total: msg.total, message: msg.message })
            announce(msg.message)
          } else if (msg.type === 'done') {
            processingAudioRef.current?.pause()
            setPhase('done')
            playSFX('success')
            announce(`แปลงสำเร็จ ${msg.pages} หน้า`)
          } else if (msg.type === 'error') {
            processingAudioRef.current?.pause()
            setPhase('error')
            setErrorMessage(msg.message)
            playSFX('error')
            announce(`เกิดข้อผิดพลาด: ${msg.message}`)
          }
        } catch {
          // Non-JSON line, ignore
        }
      })

      command.stderr.on('data', (line: string) => {
        console.error('Sidecar stderr:', line)
      })

      command.on('error', (err: string) => {
        processingAudioRef.current?.pause()
        setPhase('error')
        setErrorMessage(`ไม่สามารถเรียกใช้ตัวแปลงได้: ${err}`)
        playSFX('error')
      })

      command.on('close', (data: { code: number | null }) => {
        if (data.code !== null && data.code !== 0) {
          // Only set error if not already done
          setPhase((prev) => {
            if (prev === 'processing') {
              playSFX('error')
              setErrorMessage(`ตัวแปลงหยุดทำงานด้วยรหัส ${data.code}`)
              return 'error'
            }
            return prev
          })
        }
      })

      await command.spawn()
    } catch (err: any) {
      setPhase('error')
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ')
      playSFX('error')
    }
  }, [announce])

  // ── TTS Preview ────────────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    if (!tauriShell || !inputPath) return

    if (speaking) {
      stopSpeech()
      setSpeaking(false)
      return
    }

    // If we already have preview text, just speak it
    if (previewText) {
      setSpeaking(true)
      speak(previewText, () => setSpeaking(false))
      return
    }

    // Otherwise extract text from PDF via preview mode
    announce('กำลังอ่านข้อความจาก PDF...')
    let collectedText = ''

    const command = tauriShell.Command.sidecar('binaries/converter', [
      'preview',
      inputPath,
    ])

    command.stdout.on('data', (line: string) => {
      try {
        const msg = JSON.parse(line)
        if (msg.type === 'text') {
          collectedText += msg.content + '\n'
        } else if (msg.type === 'preview_done') {
          setPreviewText(collectedText)
          setSpeaking(true)
          speak(collectedText, () => setSpeaking(false))
          announce('กำลังอ่านข้อความ')
        }
      } catch {
        // ignore
      }
    })

    await command.spawn()
  }, [inputPath, speaking, previewText, announce])

  // ── Reset ──────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    stopSpeech()
    setSpeaking(false)
    setPhase('idle')
    setProgress({ page: 0, total: 0, message: '' })
    setErrorMessage('')
    setInputPath('')
    setOutputPath('')
    setPreviewText('')
    setStatusMessage('')
  }, [])

  // ── Progress bar percentage ────────────────────────────────────
  const progressPercent = progress.total > 0 ? Math.round((progress.page / progress.total) * 100) : 0

  return (
    <>
      <Head>
        <title>Thai PDF Fixer - แปลง PDF ภาษาไทยเป็น Word</title>
      </Head>

      <a href="#main-content" className="skip-link">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* Screen reader announcements */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="status">
        {statusMessage}
      </div>

      <main
        id="main-content"
        className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12"
      >
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-5xl font-black tracking-tight text-stone-900">
            Thai PDF Fixer
          </h1>
          <p className="text-2xl text-stone-600">
            แปลงไฟล์ PDF ภาษาไทยเป็น Word
          </p>
          <p className="mt-1 text-lg text-stone-500">
            แก้ปัญหาตัวอักษรเพี้ยน พร้อมดึงตาราง และรูปภาพ
          </p>
        </div>

        {/* ── IDLE: Select file ──────────────────────────────── */}
        {phase === 'idle' && (
          <section className="w-full max-w-md text-center" aria-label="เลือกไฟล์">
            <button
              onClick={handleSelectAndConvert}
              className={btnPrimary}
              aria-label="เลือกไฟล์ PDF เพื่อแปลงเป็น Word"
            >
              <Icon
                icon="mdi:file-pdf-box"
                className="mr-3 inline-block text-3xl"
                aria-hidden="true"
              />
              เลือกไฟล์ PDF
            </button>
            <p className="mt-6 text-lg text-stone-500">
              เลือกไฟล์ PDF แล้วระบบจะแปลงเป็นไฟล์ Word (.docx) ให้อัตโนมัติ
            </p>
          </section>
        )}

        {/* ── PROCESSING: Progress ──────────────────────────── */}
        {phase === 'processing' && (
          <section className="w-full max-w-md" aria-label="กำลังประมวลผล" role="status">
            <div
              className="border-4 border-stone-900 bg-white p-8 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]"
            >
              {/* Spinner */}
              <div className="mb-6 flex justify-center">
                <Icon
                  icon="mdi:loading"
                  className="animate-spin text-6xl text-amber-500"
                  aria-hidden="true"
                />
              </div>

              <p className="mb-4 text-center text-2xl font-bold">
                กำลังแปลงไฟล์...
              </p>

              {/* Progress bar */}
              {progress.total > 0 && (
                <div className="mb-4">
                  <div
                    className="h-6 border-4 border-stone-900 bg-stone-200"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`ความคืบหน้า ${progressPercent} เปอร์เซ็นต์`}
                  >
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-lg text-stone-600">
                    {progress.message}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── DONE: Success ─────────────────────────────────── */}
        {phase === 'done' && (
          <section className="w-full max-w-md" aria-label="แปลงสำเร็จ">
            <div
              className="mb-8 border-4 border-stone-900 bg-emerald-100 p-8 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]"
            >
              <div className="mb-4 flex justify-center">
                <Icon
                  icon="mdi:check-circle"
                  className="text-6xl text-emerald-600"
                  aria-hidden="true"
                />
              </div>
              <p className="text-center text-2xl font-bold text-emerald-800">
                แปลงสำเร็จแล้ว!
              </p>
              <p className="mt-2 text-center text-lg text-emerald-700">
                {progress.total} หน้า
              </p>
              {outputPath && (
                <p className="mt-2 break-all text-center text-sm text-stone-500">
                  บันทึกที่: {outputPath}
                </p>
              )}
            </div>

            <div className="space-y-4">
              {/* TTS Preview */}
              <button
                onClick={handlePreview}
                className={btnSecondary}
                aria-label={speaking ? 'หยุดอ่าน' : 'ฟังข้อความที่แกะได้'}
              >
                <Icon
                  icon={speaking ? 'mdi:stop-circle' : 'mdi:volume-high'}
                  className="mr-3 inline-block text-2xl"
                  aria-hidden="true"
                />
                {speaking ? 'หยุดอ่าน' : 'ฟังข้อความ'}
              </button>

              {/* Convert another file */}
              <button
                onClick={handleReset}
                className={btnSecondary}
                aria-label="แปลงไฟล์ใหม่"
              >
                <Icon
                  icon="mdi:refresh"
                  className="mr-3 inline-block text-2xl"
                  aria-hidden="true"
                />
                แปลงไฟล์ใหม่
              </button>
            </div>
          </section>
        )}

        {/* ── ERROR ─────────────────────────────────────────── */}
        {phase === 'error' && (
          <section className="w-full max-w-md" aria-label="เกิดข้อผิดพลาด">
            <div
              className="mb-8 border-4 border-stone-900 bg-red-100 p-8 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]"
            >
              <div className="mb-4 flex justify-center">
                <Icon
                  icon="mdi:alert-circle"
                  className="text-6xl text-red-600"
                  aria-hidden="true"
                />
              </div>
              <p className="text-center text-2xl font-bold text-red-800">
                เกิดข้อผิดพลาด
              </p>
              <p className="mt-4 text-center text-lg text-red-700">
                {errorMessage}
              </p>
            </div>

            <button
              ref={retryBtnRef}
              onClick={handleReset}
              className={btnPrimary + ' w-full'}
              aria-label="ลองใหม่"
            >
              <Icon
                icon="mdi:refresh"
                className="mr-3 inline-block text-2xl"
                aria-hidden="true"
              />
              ลองใหม่
            </button>
          </section>
        )}
      </main>
    </>
  )
}
