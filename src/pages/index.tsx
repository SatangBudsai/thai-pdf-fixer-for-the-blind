import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Head from 'next/head'
import { speak, stop as stopSpeech } from '@/lib/speech'

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

// ── Button styles (Neo-Brutalism + accessible) ────────────────
const btn = (bg: string) =>
  [
    'flex items-center justify-center gap-3',
    'w-full px-6 py-4 text-xl font-bold rounded-xl',
    bg,
    'border-4 border-stone-900',
    'shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]',
    'hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]',
    'hover:translate-x-[3px] hover:translate-y-[3px]',
    'active:shadow-none active:translate-x-[5px] active:translate-y-[5px]',
    'transition-all duration-100',
    'focus:outline-none focus:ring-8 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-stone-50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ')

const btnPrimary = btn('bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-900')
const btnSuccess = btn('bg-gradient-to-r from-emerald-400 to-green-300 text-stone-900')
const btnSecondary = btn('bg-white text-stone-900')
const btnDanger = btn('bg-gradient-to-r from-red-400 to-rose-300 text-stone-900')

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('idle')
  const [progress, setProgress] = useState<Progress>({ page: 0, total: 0, message: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [inputPath, setInputPath] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [tauriReady, setTauriReady] = useState(false)

  // Tauri modules stored in refs so they persist across re-renders
  const tauriDialogRef = useRef<typeof import('@tauri-apps/plugin-dialog') | null>(null)
  const tauriShellRef = useRef<typeof import('@tauri-apps/plugin-shell') | null>(null)
  const processingAudioRef = useRef<HTMLAudioElement | null>(null)

  // Load Tauri APIs on mount (dynamic import avoids SSR errors)
  useEffect(() => {
    if (globalThis.window === undefined) return
    Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-shell'),
    ])
      .then(([dialog, shell]) => {
        tauriDialogRef.current = dialog
        tauriShellRef.current = shell
        setTauriReady(true)
      })
      .catch((err) => {
        console.error('Failed to load Tauri APIs:', err)
      })
  }, [])

  const announce = useCallback((msg: string) => {
    setStatusMessage(msg)
  }, [])

  // ── Select PDF and convert ──────────────────────────────────
  const handleSelectAndConvert = useCallback(async () => {
    const dialog = tauriDialogRef.current
    const shell = tauriShellRef.current
    if (!dialog || !shell) return

    try {
      const selected = await dialog.open({
        multiple: false,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      })
      if (!selected) return

      const pdfPath = selected as string
      setInputPath(pdfPath)
      const fileName = pdfPath.split(/[/\\]/).pop() || pdfPath

      const suggestedOutput = pdfPath.replace(/\.pdf$/i, '_fixed.docx')
      const savePath = await dialog.save({
        defaultPath: suggestedOutput,
        filters: [{ name: 'Word Document', extensions: ['docx'] }],
      })
      if (!savePath) return
      setOutputPath(savePath)

      // Start conversion
      setPhase('processing')
      setPreviewText('')
      setProgress({ page: 0, total: 0, message: 'กำลังเริ่มต้น...' })
      announce(`กำลังแปลงไฟล์ ${fileName}`)
      processingAudioRef.current = playSFX('processing')

      const command = shell.Command.sidecar('binaries/converter', [
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
      processingAudioRef.current?.pause()
      setPhase('error')
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ')
      playSFX('error')
    }
  }, [announce])

  // ── Load text preview from sidecar ──────────────────────────
  const handleLoadPreview = useCallback(async () => {
    const shell = tauriShellRef.current
    if (!shell || !inputPath) return

    setLoadingPreview(true)
    announce('กำลังอ่านข้อความจาก PDF...')
    let collectedText = ''

    const command = shell.Command.sidecar('binaries/converter', ['preview', inputPath])

    command.stdout.on('data', (line: string) => {
      try {
        const msg = JSON.parse(line)
        if (msg.type === 'text') {
          collectedText += msg.content + '\n'
        } else if (msg.type === 'preview_done') {
          setPreviewText(collectedText.trim())
          setLoadingPreview(false)
          announce('โหลดข้อความเสร็จแล้ว')
        }
      } catch {
        // ignore
      }
    })

    command.on('error', () => {
      setLoadingPreview(false)
    })

    await command.spawn()
  }, [inputPath, announce])

  // ── TTS ─────────────────────────────────────────────────────
  const handleSpeak = useCallback(() => {
    if (speaking) {
      stopSpeech()
      setSpeaking(false)
      return
    }
    if (!previewText) return
    setSpeaking(true)
    speak(previewText, () => setSpeaking(false))
  }, [speaking, previewText])

  // ── Reset ───────────────────────────────────────────────────
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
    setLoadingPreview(false)
  }, [])

  const progressPercent =
    progress.total > 0 ? Math.round((progress.page / progress.total) * 100) : 0

  return (
    <>
      <Head>
        <title>Thai PDF Fixer - แปลง PDF ภาษาไทยเป็น Word</title>
      </Head>

      <a href="#main-content" className="skip-link">
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="status">
        {statusMessage}
      </div>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50">
        <main
          id="main-content"
          className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12"
        >
          {/* ── Logo & Header ─────────────────────────────────── */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-stone-900 bg-gradient-to-br from-amber-400 to-yellow-300 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
              <Icon
                icon="mdi:file-document-edit"
                className="text-4xl text-stone-900"
                aria-hidden="true"
              />
            </div>
            <h1 className="mb-1 text-4xl font-black tracking-tight text-stone-900">
              Thai PDF Fixer
            </h1>
            <p className="text-xl text-stone-600">แปลง PDF ภาษาไทยเป็น Word</p>
            <p className="mt-1 text-base text-stone-400">
              ดึงข้อความ ตาราง รูปภาพ พร้อมแก้ตัวอักษรเพี้ยน
            </p>
          </div>

          {/* ── IDLE ──────────────────────────────────────────── */}
          {phase === 'idle' && (
            <section className="w-full max-w-md space-y-6" aria-label="เลือกไฟล์">
              <button
                onClick={handleSelectAndConvert}
                disabled={!tauriReady}
                className={btnPrimary}
                aria-label="เลือกไฟล์ PDF เพื่อแปลงเป็น Word"
              >
                <Icon icon="mdi:file-pdf-box" className="text-3xl" aria-hidden="true" />
                {tauriReady ? 'เลือกไฟล์ PDF' : 'กำลังโหลด...'}
              </button>

              <div className="rounded-xl border-2 border-stone-200 bg-white/60 p-5 text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-stone-500">
                  <Icon icon="mdi:information-outline" className="text-xl" aria-hidden="true" />
                  <span className="font-semibold">วิธีใช้งาน</span>
                </div>
                <ol className="space-y-1 text-left text-base text-stone-500">
                  <li>1. กดปุ่มด้านบนเพื่อเลือกไฟล์ PDF</li>
                  <li>2. เลือกตำแหน่งบันทึกไฟล์ Word</li>
                  <li>3. รอระบบแปลงไฟล์ให้เสร็จ</li>
                  <li>4. ดูตัวอย่างข้อความ หรือฟังด้วยเสียง</li>
                </ol>
              </div>
            </section>
          )}

          {/* ── PROCESSING ────────────────────────────────────── */}
          {phase === 'processing' && (
            <section className="w-full max-w-md" aria-label="กำลังประมวลผล" role="status">
              <div className="rounded-xl border-4 border-stone-900 bg-white p-8 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                    <Icon
                      icon="mdi:loading"
                      className="animate-spin text-5xl text-amber-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <p className="mb-4 text-center text-2xl font-bold">กำลังแปลงไฟล์...</p>

                {progress.total > 0 && (
                  <div className="mb-2">
                    <div
                      className="h-5 overflow-hidden rounded-full border-2 border-stone-300 bg-stone-100"
                      role="progressbar"
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`ความคืบหน้า ${progressPercent} เปอร์เซ็นต์`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-center text-base text-stone-500">
                      {progress.message} ({progressPercent}%)
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── DONE ──────────────────────────────────────────── */}
          {phase === 'done' && (
            <section className="w-full max-w-md space-y-5" aria-label="แปลงสำเร็จ">
              {/* Success banner */}
              <div className="rounded-xl border-4 border-stone-900 bg-gradient-to-r from-emerald-100 to-green-50 p-6 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-200">
                    <Icon
                      icon="mdi:check-bold"
                      className="text-3xl text-emerald-700"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <p className="text-center text-2xl font-bold text-emerald-800">แปลงสำเร็จ!</p>
                <p className="mt-1 text-center text-lg text-emerald-600">
                  {progress.total} หน้า
                </p>
                {outputPath && (
                  <p className="mt-2 break-all text-center text-sm text-stone-400">
                    {outputPath}
                  </p>
                )}
              </div>

              {/* Text preview area */}
              {!previewText && !loadingPreview && (
                <button
                  onClick={handleLoadPreview}
                  className={btnSecondary}
                  aria-label="ดูตัวอย่างข้อความที่แกะได้"
                >
                  <Icon icon="mdi:text-box-search" className="text-2xl" aria-hidden="true" />
                  ดูตัวอย่างข้อความ
                </button>
              )}

              {loadingPreview && (
                <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-stone-200 bg-white p-4 text-stone-500">
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin text-2xl"
                    aria-hidden="true"
                  />
                  กำลังอ่านข้อความ...
                </div>
              )}

              {previewText && (
                <div className="rounded-xl border-2 border-stone-200 bg-white">
                  <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2">
                    <span className="text-base font-semibold text-stone-500">
                      ตัวอย่างข้อความ
                    </span>
                  </div>
                  <div
                    className="max-h-64 overflow-y-auto p-4 text-base leading-relaxed text-stone-700"
                    tabIndex={0}
                    role="region"
                    aria-label="ข้อความที่แกะจาก PDF"
                  >
                    {previewText.split('\n').map((line, i) => (
                      <p key={i} className={line.trim() ? '' : 'h-4'}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* TTS button (shown after preview loaded) */}
              {previewText && (
                <button
                  onClick={handleSpeak}
                  className={btnSuccess}
                  aria-label={speaking ? 'หยุดอ่าน' : 'ฟังข้อความด้วยเสียง'}
                >
                  <Icon
                    icon={speaking ? 'mdi:stop-circle' : 'mdi:volume-high'}
                    className="text-2xl"
                    aria-hidden="true"
                  />
                  {speaking ? 'หยุดอ่าน' : 'ฟังข้อความด้วยเสียง'}
                </button>
              )}

              {/* Convert another file */}
              <button onClick={handleReset} className={btnPrimary} aria-label="แปลงไฟล์ใหม่">
                <Icon icon="mdi:file-plus" className="text-2xl" aria-hidden="true" />
                แปลงไฟล์ใหม่
              </button>
            </section>
          )}

          {/* ── ERROR ─────────────────────────────────────────── */}
          {phase === 'error' && (
            <section className="w-full max-w-md space-y-5" aria-label="เกิดข้อผิดพลาด">
              <div className="rounded-xl border-4 border-stone-900 bg-gradient-to-r from-red-100 to-rose-50 p-6 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-200">
                    <Icon icon="mdi:alert" className="text-3xl text-red-700" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-center text-2xl font-bold text-red-800">เกิดข้อผิดพลาด</p>
                <p className="mt-3 text-center text-lg text-red-600">{errorMessage}</p>
              </div>

              <button onClick={handleReset} className={btnDanger} aria-label="ลองใหม่">
                <Icon icon="mdi:refresh" className="text-2xl" aria-hidden="true" />
                ลองใหม่
              </button>
            </section>
          )}

          {/* Footer */}
          <p className="mt-12 text-center text-sm text-stone-400">
            Thai PDF Fixer v2.0 — สำหรับผู้พิการทางสายตา
          </p>
        </main>
      </div>
    </>
  )
}
