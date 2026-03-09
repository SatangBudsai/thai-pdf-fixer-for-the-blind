import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Head from 'next/head'
import { speak, speakAsync, stop as stopSpeech } from '@/lib/speech'

// Phases: idle → extracting → preview → saving → saved → error
type AppPhase = 'idle' | 'extracting' | 'preview' | 'saving' | 'saved' | 'error'

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
    'disabled:opacity-50 disabled:cursor-not-allowed'
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
  const [fileName, setFileName] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [tauriReady, setTauriReady] = useState(false)

  const tauriDialogRef = useRef<typeof import('@tauri-apps/plugin-dialog') | null>(null)
  const tauriShellRef = useRef<typeof import('@tauri-apps/plugin-shell') | null>(null)
  const processingAudioRef = useRef<HTMLAudioElement | null>(null)

  // Refs for auto-focus
  const selectBtnRef = useRef<HTMLButtonElement>(null)
  const saveBtnRef = useRef<HTMLButtonElement>(null)
  const retryBtnRef = useRef<HTMLButtonElement>(null)
  const newFileBtnRef = useRef<HTMLButtonElement>(null)

  // Load Tauri APIs on mount
  useEffect(() => {
    if (globalThis.window === undefined) return
    Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-shell')])
      .then(([dialog, shell]) => {
        tauriDialogRef.current = dialog
        tauriShellRef.current = shell
        setTauriReady(true)
      })
      .catch(err => console.error('Failed to load Tauri APIs:', err))
  }, [])

  // Auto-focus and TTS announcements when phase changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      stopSpeech()
      switch (phase) {
        case 'idle':
          selectBtnRef.current?.focus()
          break
        case 'preview':
          saveBtnRef.current?.focus()
          await speakAsync(`อ่านไฟล์สำเร็จ พบข้อความทั้งหมด ${progress.total} หน้า คุณสามารถกดปุ่มบันทึกเป็น Word หรือกดปุ่มฟังข้อความด้วยเสียงได้`)
          break
        case 'saved':
          newFileBtnRef.current?.focus()
          await speakAsync('บันทึกไฟล์ Word สำเร็จแล้ว คุณสามารถกดปุ่มแปลงไฟล์ใหม่เพื่อเลือกไฟล์อื่นได้')
          break
        case 'error':
          retryBtnRef.current?.focus()
          await speakAsync(`เกิดข้อผิดพลาด ${errorMessage} กดปุ่มลองใหม่เพื่อเริ่มต้นใหม่`)
          break
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [phase, errorMessage, progress.total])

  // Announce to screen reader on mount
  useEffect(() => {
    if (tauriReady) {
      speakAsync('ยินดีต้อนรับสู่ Thai PDF Fixer กดปุ่มเพื่อเลือกไฟล์ PDF')
    }
  }, [tauriReady])

  const announce = useCallback((msg: string) => {
    setStatusMessage(msg)
  }, [])

  // ── Step 1: Select PDF → Extract text (preview mode) ────────
  const handleSelectFile = useCallback(async () => {
    const dialog = tauriDialogRef.current
    const shell = tauriShellRef.current
    if (!dialog || !shell) return

    try {
      const selected = await dialog.open({
        multiple: false,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (!selected) return

      const pdfPath = selected as string
      const name = pdfPath.split(/[/\\]/).pop() || pdfPath
      setInputPath(pdfPath)
      setFileName(name)
      setPreviewText('')
      setOutputPath('')

      // Play upload sound + TTS announcement, wait for speech to finish
      playSFX('upload')
      stopSpeech()

      // Start extracting text (preview mode — no DOCX yet)
      setPhase('extracting')
      setProgress({ page: 0, total: 0, message: 'กำลังอ่านไฟล์...' })
      announce(`กำลังอ่านไฟล์ ${name}`)
      await speakAsync(`เลือกไฟล์แล้ว ${name} กำลังอ่านและแกะข้อความจากไฟล์ PDF กรุณารอสักครู่`)

      // Start processing sound after speech finishes
      processingAudioRef.current = playSFX('processing')

      let collectedText = ''

      const command = shell.Command.sidecar('binaries/converter', ['preview', pdfPath])

      command.stdout.on('data', (line: string) => {
        try {
          const msg = JSON.parse(line)
          if (msg.type === 'progress') {
            setProgress({ page: msg.page, total: msg.total, message: msg.message })
            announce(msg.message)
          } else if (msg.type === 'text') {
            collectedText += msg.content + '\n'
          } else if (msg.type === 'preview_done') {
            processingAudioRef.current?.pause()
            setPreviewText(collectedText.trim())
            setProgress(prev => ({ ...prev, message: '' }))
            setPhase('preview')
            playSFX('success')
            announce(`อ่านเสร็จแล้ว ${msg.pages} หน้า`)
          } else if (msg.type === 'error') {
            processingAudioRef.current?.pause()
            setPhase('error')
            setErrorMessage(msg.message)
            playSFX('error')
          }
        } catch {
          // ignore non-JSON
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
          setPhase(prev => {
            if (prev === 'extracting') {
              processingAudioRef.current?.pause()
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
      const msg = err?.message || err?.toString?.() || JSON.stringify(err) || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      setErrorMessage(msg)
      playSFX('error')
    }
  }, [announce])

  // ── Step 2: Save as Word (.docx) ────────────────────────────
  const handleSaveAsWord = useCallback(async () => {
    const dialog = tauriDialogRef.current
    const shell = tauriShellRef.current
    if (!dialog || !shell || !inputPath) return

    try {
      const suggestedOutput = inputPath.replace(/\.pdf$/i, '_fixed.docx')
      const savePath = await dialog.save({
        defaultPath: suggestedOutput,
        filters: [{ name: 'Word Document', extensions: ['docx'] }]
      })
      if (!savePath) return

      setOutputPath(savePath)
      setPhase('saving')
      setProgress({ page: 0, total: 0, message: 'กำลังสร้างไฟล์ Word...' })
      announce('กำลังบันทึกเป็นไฟล์ Word')
      stopSpeech()
      await speakAsync('กำลังแปลงไฟล์เป็น Word พร้อมข้อความ ตาราง และรูปภาพ กรุณารอสักครู่')
      processingAudioRef.current = playSFX('processing')

      const command = shell.Command.sidecar('binaries/converter', ['convert', inputPath, savePath])

      command.stdout.on('data', (line: string) => {
        try {
          const msg = JSON.parse(line)
          if (msg.type === 'progress') {
            setProgress({ page: msg.page, total: msg.total, message: msg.message })
          } else if (msg.type === 'done') {
            processingAudioRef.current?.pause()
            setPhase('saved')
            playSFX('success')
            announce(`บันทึกสำเร็จ ${msg.pages} หน้า`)
          } else if (msg.type === 'error') {
            processingAudioRef.current?.pause()
            setPhase('error')
            setErrorMessage(msg.message)
            playSFX('error')
          }
        } catch {
          // ignore
        }
      })

      command.stderr.on('data', (line: string) => {
        console.error('Sidecar stderr:', line)
      })

      command.on('error', (err: string) => {
        processingAudioRef.current?.pause()
        setPhase('error')
        setErrorMessage(`ไม่สามารถบันทึกได้: ${err}`)
        playSFX('error')
      })

      command.on('close', (data: { code: number | null }) => {
        if (data.code !== null && data.code !== 0) {
          setPhase(prev => {
            if (prev === 'saving') {
              processingAudioRef.current?.pause()
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
      setErrorMessage(err?.message || 'ไม่สามารถบันทึกไฟล์ได้')
      playSFX('error')
    }
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
    setFileName('')
    setOutputPath('')
    setPreviewText('')
    setStatusMessage('')
  }, [])

  const progressPercent = progress.total > 0 ? Math.round((progress.page / progress.total) * 100) : 0

  return (
    <>
      <Head>
        <title>Thai PDF Fixer - แปลง PDF ภาษาไทยเป็น Word</title>
      </Head>

      <a href='#main-content' className='skip-link'>
        ข้ามไปยังเนื้อหาหลัก
      </a>

      <div aria-live='assertive' aria-atomic='true' className='sr-only' role='status'>
        {statusMessage}
      </div>

      <div className='min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50'>
        <main id='main-content' className='mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12'>
          {/* ── Logo & Header ─────────────────────────────────── */}
          <div className='mb-10 text-center'>
            <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-stone-900 bg-gradient-to-br from-amber-400 to-yellow-300 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]'>
              <img src='/logo.png' alt='' aria-hidden='true' className='h-16 w-16' />
            </div>
            <h1 className='mb-1 text-4xl font-black tracking-tight text-stone-900'>Thai PDF Fixer</h1>
            <p className='text-xl text-stone-600'>แปลง PDF ภาษาไทยเป็น Word</p>
            <p className='mt-1 text-base text-stone-400'>ดึงข้อความ ตาราง รูปภาพ พร้อมแก้ตัวอักษรเพี้ยน</p>
          </div>

          {/* ── IDLE: Select file ─────────────────────────────── */}
          {phase === 'idle' && (
            <section className='w-full max-w-md space-y-6' aria-label='เลือกไฟล์'>
              <button ref={selectBtnRef} onClick={handleSelectFile} disabled={!tauriReady} className={btnPrimary} aria-label='เลือกไฟล์ PDF เพื่อแปลง'>
                <Icon icon='mdi:file-pdf-box' className='text-3xl' aria-hidden='true' />
                {tauriReady ? 'เลือกไฟล์ PDF' : 'กำลังโหลด...'}
              </button>

              <div className='rounded-xl border-2 border-stone-200 bg-white/60 p-5 text-center'>
                <div className='mb-2 flex items-center justify-center gap-2 text-stone-500'>
                  <Icon icon='mdi:information-outline' className='text-xl' aria-hidden='true' />
                  <span className='font-semibold'>วิธีใช้งาน</span>
                </div>
                <ol className='space-y-1 text-left text-base text-stone-500'>
                  <li>1. กดปุ่มด้านบนเพื่อเลือกไฟล์ PDF</li>
                  <li>2. รอระบบอ่านและแกะข้อความ</li>
                  <li>3. ดูตัวอย่างข้อความ หรือฟังด้วยเสียง</li>
                  <li>4. กดบันทึกเป็นไฟล์ Word เมื่อพร้อม</li>
                </ol>
              </div>
            </section>
          )}

          {/* ── EXTRACTING: Reading PDF ──────────────────────── */}
          {phase === 'extracting' && (
            <section className='w-full max-w-md' aria-label='กำลังอ่านไฟล์' role='status'>
              <div className='rounded-xl border-4 border-stone-900 bg-white p-8 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]'>
                <div className='mb-6 flex justify-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-amber-100'>
                    <Icon icon='mdi:loading' className='animate-spin text-5xl text-amber-500' aria-hidden='true' />
                  </div>
                </div>

                <p className='mb-1 text-center text-2xl font-bold'>กำลังอ่านไฟล์...</p>
                {fileName && <p className='mb-4 break-all text-center text-base text-stone-400'>{fileName}</p>}

                {progress.total > 0 && (
                  <div className='mb-2'>
                    <div
                      className='h-5 overflow-hidden rounded-full border-2 border-stone-300 bg-stone-100'
                      role='progressbar'
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`ความคืบหน้า ${progressPercent} เปอร์เซ็นต์`}>
                      <div
                        className='h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300'
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className='mt-2 text-center text-base text-stone-500'>
                      {progress.message} ({progressPercent}%)
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── PREVIEW: Show extracted text ──────────────────── */}
          {phase === 'preview' && (
            <section className='w-full max-w-md space-y-5' aria-label='ผลลัพธ์'>
              {/* File info */}
              <div className='overflow-hidden rounded-xl border-4 border-stone-900 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]'>
                <div className='bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-5 text-center'>
                  <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm'>
                    <Icon icon='mdi:check-bold' className='text-3xl text-white' aria-hidden='true' />
                  </div>
                  <p className='text-2xl font-black text-white'>อ่านไฟล์สำเร็จ!</p>
                </div>
                <div className='bg-gradient-to-b from-emerald-50 to-white px-6 py-4'>
                  <div className='flex items-center justify-center gap-3'>
                    <div className='flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5'>
                      <Icon icon='mdi:file-document-outline' className='text-lg text-emerald-600' aria-hidden='true' />
                      <span className='text-base font-semibold text-emerald-700'>{progress.total} หน้า</span>
                    </div>
                  </div>
                  <p className='mt-2 break-all text-center text-sm text-stone-400'>{fileName}</p>
                </div>
              </div>

              {/* Text preview */}
              {previewText && (
                <div className='rounded-xl border-2 border-stone-200 bg-white'>
                  <div className='border-b border-stone-200 px-4 py-2'>
                    <span className='text-base font-semibold text-stone-500'>ตัวอย่างข้อความที่แกะได้</span>
                  </div>
                  <div
                    className='max-h-60 overflow-y-auto p-4 text-base leading-relaxed text-stone-700'
                    role='region'
                    aria-label='ข้อความที่แกะจาก PDF'>
                    {previewText.split('\n').map((line, idx) => (
                      <p key={`line-${idx}`} className={line.trim() ? '' : 'h-4'}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {!previewText && (
                <div className='rounded-xl border-2 border-stone-200 bg-white p-4 text-center text-stone-400'>ไม่พบข้อความในไฟล์ PDF นี้</div>
              )}

              {/* Action buttons */}
              <button ref={saveBtnRef} onClick={handleSaveAsWord} className={btnSuccess} aria-label='บันทึกเป็นไฟล์ Word'>
                <Icon icon='mdi:content-save' className='text-2xl' aria-hidden='true' />
                บันทึกเป็น Word
              </button>

              {previewText && (
                <button onClick={handleSpeak} className={btnSecondary} aria-label={speaking ? 'หยุดอ่าน' : 'ฟังข้อความด้วยเสียง'}>
                  <Icon icon={speaking ? 'mdi:stop-circle' : 'mdi:volume-high'} className='text-2xl' aria-hidden='true' />
                  {speaking ? 'หยุดอ่าน' : 'ฟังข้อความด้วยเสียง'}
                </button>
              )}

              <button onClick={handleReset} className={btnSecondary} aria-label='เลือกไฟล์ใหม่'>
                <Icon icon='mdi:arrow-left' className='text-2xl' aria-hidden='true' />
                เลือกไฟล์ใหม่
              </button>
            </section>
          )}

          {/* ── SAVING: Converting to DOCX ───────────────────── */}
          {phase === 'saving' && (
            <section className='w-full max-w-md' aria-label='กำลังบันทึก' role='status'>
              <div className='rounded-xl border-4 border-stone-900 bg-white p-8 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]'>
                <div className='mb-6 flex justify-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
                    <Icon icon='mdi:loading' className='animate-spin text-5xl text-emerald-500' aria-hidden='true' />
                  </div>
                </div>
                <p className='mb-4 text-center text-2xl font-bold'>กำลังแปลงเป็น Word...</p>

                {progress.total > 0 && (
                  <div className='mb-2'>
                    <div
                      className='h-5 overflow-hidden rounded-full border-2 border-stone-300 bg-stone-100'
                      role='progressbar'
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`ความคืบหน้า ${progressPercent} เปอร์เซ็นต์`}>
                      <div
                        className='h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-300 transition-all duration-300'
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className='mt-2 text-center text-base text-stone-500'>
                      {progress.message} ({progressPercent}%)
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── SAVED: Success ────────────────────────────────── */}
          {phase === 'saved' && (
            <section className='w-full max-w-md space-y-5' aria-label='บันทึกสำเร็จ'>
              <div className='overflow-hidden rounded-xl border-4 border-stone-900 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]'>
                <div className='bg-gradient-to-r from-emerald-500 to-green-400 px-6 py-5 text-center'>
                  <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm'>
                    <Icon icon='mdi:check-bold' className='text-3xl text-white' aria-hidden='true' />
                  </div>
                  <p className='text-2xl font-black text-white'>บันทึกสำเร็จ!</p>
                </div>
                <div className='bg-gradient-to-b from-emerald-50 to-white px-6 py-4'>
                  <div className='flex items-center justify-center gap-3'>
                    <div className='flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5'>
                      <Icon icon='mdi:file-word-outline' className='text-lg text-emerald-600' aria-hidden='true' />
                      <span className='text-base font-semibold text-emerald-700'>{progress.total} หน้า</span>
                    </div>
                  </div>
                  {outputPath && <p className='mt-2 break-all text-center text-sm text-stone-400'>{outputPath}</p>}
                </div>
              </div>

              <button ref={newFileBtnRef} onClick={handleReset} className={btnPrimary} aria-label='แปลงไฟล์ใหม่'>
                <Icon icon='mdi:file-plus' className='text-2xl' aria-hidden='true' />
                แปลงไฟล์ใหม่
              </button>
            </section>
          )}

          {/* ── ERROR ─────────────────────────────────────────── */}
          {phase === 'error' && (
            <section className='w-full max-w-md space-y-5' aria-label='เกิดข้อผิดพลาด'>
              <div className='rounded-xl border-4 border-stone-900 bg-gradient-to-r from-red-100 to-rose-50 p-6 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]'>
                <div className='mb-3 flex justify-center'>
                  <div className='flex h-14 w-14 items-center justify-center rounded-full bg-red-200'>
                    <Icon icon='mdi:alert' className='text-3xl text-red-700' aria-hidden='true' />
                  </div>
                </div>
                <p className='text-center text-2xl font-bold text-red-800'>เกิดข้อผิดพลาด</p>
                <p className='mt-3 text-center text-lg text-red-600'>{errorMessage}</p>
              </div>

              <button ref={retryBtnRef} onClick={handleReset} className={btnDanger} aria-label='ลองใหม่'>
                <Icon icon='mdi:refresh' className='text-2xl' aria-hidden='true' />
                ลองใหม่
              </button>
            </section>
          )}

          <p className='mt-12 text-center text-sm text-stone-400'>Thai PDF Fixer v2.0 — สำหรับผู้พิการทางสายตา</p>
        </main>
      </div>
    </>
  )
}
