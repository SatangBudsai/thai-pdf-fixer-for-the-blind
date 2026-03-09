import { useState, useRef, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Head from 'next/head'
import type { Update } from '@tauri-apps/plugin-updater'

// Phases: idle → extracting → preview → saving → saved → error
type AppPhase = 'idle' | 'extracting' | 'preview' | 'saving' | 'saved' | 'error'

interface Progress {
  page: number
  total: number
  message: string
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

function playSFX(name: 'upload' | 'processing' | 'success' | 'error') {
  try {
    const audio = new Audio(`/sounds/${name}.mp3`)
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch {}
}

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('idle')
  const [progress, setProgress] = useState<Progress>({ page: 0, total: 0, message: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [isFileLockedError, setIsFileLockedError] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [inputPath, setInputPath] = useState('')
  const [fileName, setFileName] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [tauriReady, setTauriReady] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null)
  const [updating, setUpdating] = useState(false)

  const tauriDialogRef = useRef<typeof import('@tauri-apps/plugin-dialog') | null>(null)
  const tauriShellRef = useRef<typeof import('@tauri-apps/plugin-shell') | null>(null)

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

    // Check for updates
    import('@tauri-apps/plugin-updater')
      .then(({ check }) => check())
      .then(update => {
        if (update) setUpdateAvailable(update)
      })
      .catch(err => console.error('Update check failed:', err))
  }, [])

  // Screen reader announcement via aria-live region
  const announce = useCallback((msg: string) => {
    setStatusMessage(msg)
  }, [])

  // Handle update install
  const handleUpdate = useCallback(async () => {
    if (!updateAvailable) return
    setUpdating(true)
    announce('กำลังดาวน์โหลดและติดตั้งอัปเดต กรุณารอสักครู่')
    try {
      await updateAvailable.downloadAndInstall()
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    } catch (err) {
      console.error('Update failed:', err)
      setUpdating(false)
    }
  }, [updateAvailable, announce])

  // Auto-focus and screen reader announcements when phase changes
  useEffect(() => {
    const timer = setTimeout(() => {
      switch (phase) {
        case 'idle':
          selectBtnRef.current?.focus()
          break
        case 'preview':
          saveBtnRef.current?.focus()
          playSFX('success')
          announce(`อ่านไฟล์สำเร็จ พบข้อความทั้งหมด ${progress.total} หน้า`)
          break
        case 'saved':
          newFileBtnRef.current?.focus()
          playSFX('success')
          announce(`บันทึกไฟล์ Word สำเร็จแล้ว ${progress.total} หน้า`)
          break
        case 'error':
          retryBtnRef.current?.focus()
          playSFX('error')
          if (isFileLockedError) {
            announce('ไม่สามารถบันทึกได้เพราะไฟล์ถูกเปิดอยู่ กรุณาปิดไฟล์ Word แล้วกดปุ่มบันทึกอีกครั้ง')
          } else {
            announce(`เกิดข้อผิดพลาด ${errorMessage}`)
          }
          break
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [phase, errorMessage, progress.total, isFileLockedError, announce])

  // Helper: set error state with file-locked detection
  const setError = useCallback((message: string, code?: string) => {
    const fileLocked = code === 'file_locked' || message.includes('ปิดไฟล์') || message.includes('Permission denied')
    setIsFileLockedError(fileLocked)
    setErrorMessage(message)
    setPhase('error')
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

      const pdfPath = selected
      const name = pdfPath.split(/[/\\]/).pop() || pdfPath
      setInputPath(pdfPath)
      setFileName(name)
      setPreviewText('')
      setOutputPath('')
      setIsFileLockedError(false)

      setPhase('extracting')
      setProgress({ page: 0, total: 0, message: 'กำลังอ่านไฟล์...' })
      playSFX('upload')
      announce(`กำลังอ่านไฟล์ ${name}`)

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
            setPreviewText(collectedText.trim())
            setProgress(prev => ({ ...prev, message: '' }))
            setPhase('preview')
          } else if (msg.type === 'error') {
            setError(msg.message, msg.code)
          }
        } catch {
          // ignore non-JSON
        }
      })

      const stderrLines: string[] = []

      command.stderr.on('data', (line: string) => {
        console.error('Sidecar stderr:', line)
        stderrLines.push(line)
      })

      command.on('error', (err: string) => {
        setError(`ไม่สามารถเรียกใช้ตัวแปลงได้: ${err}`)
      })

      command.on('close', (data: { code: number | null }) => {
        if (data.code !== null && data.code !== 0) {
          setPhase(prev => {
            if (prev === 'extracting') {
              const detail = stderrLines.length > 0 ? '\n' + stderrLines.slice(-5).join('\n') : ''
              setError(`ตัวแปลงหยุดทำงานด้วยรหัส ${data.code}${detail}`)
              return 'error'
            }
            return prev
          })
        }
      })

      await command.spawn()
    } catch (err: any) {
      const msg = err?.message || err?.toString?.() || JSON.stringify(err) || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      setError(msg)
    }
  }, [announce, setError])

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
      setIsFileLockedError(false)
      setProgress({ page: 0, total: 0, message: 'กำลังสร้างไฟล์ Word...' })
      playSFX('processing')
      announce('กำลังแปลงไฟล์เป็น Word')

      const command = shell.Command.sidecar('binaries/converter', ['convert', inputPath, savePath])

      command.stdout.on('data', (line: string) => {
        try {
          const msg = JSON.parse(line)
          if (msg.type === 'progress') {
            setProgress({ page: msg.page, total: msg.total, message: msg.message })
          } else if (msg.type === 'done') {
            setPhase('saved')
          } else if (msg.type === 'error') {
            setError(msg.message, msg.code)
          }
        } catch {
          // ignore
        }
      })

      const stderrLines2: string[] = []

      command.stderr.on('data', (line: string) => {
        console.error('Sidecar stderr:', line)
        stderrLines2.push(line)
      })

      command.on('error', (err: string) => {
        setError(`ไม่สามารถบันทึกได้: ${err}`)
      })

      command.on('close', (data: { code: number | null }) => {
        if (data.code !== null && data.code !== 0) {
          setPhase(prev => {
            if (prev === 'saving') {
              const detail = stderrLines2.length > 0 ? '\n' + stderrLines2.slice(-5).join('\n') : ''
              setError(`ตัวแปลงหยุดทำงานด้วยรหัส ${data.code}${detail}`)
              return 'error'
            }
            return prev
          })
        }
      })

      await command.spawn()
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถบันทึกไฟล์ได้')
    }
  }, [inputPath, announce, setError])

  // ── Reset ───────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPhase('idle')
    setProgress({ page: 0, total: 0, message: '' })
    setErrorMessage('')
    setIsFileLockedError(false)
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
        {/* ── Update banner ──────────────────────────────────── */}
        {updateAvailable && (
          <div className='border-b-4 border-blue-900 bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-white' role='alert'>
            <div className='mx-auto flex max-w-2xl items-center justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <Icon icon='mdi:download-circle' className='text-2xl' aria-hidden='true' />
                <span className='text-lg font-bold'>มีเวอร์ชันใหม่ {updateAvailable.version} พร้อมอัปเดต!</span>
              </div>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className='rounded-lg border-2 border-white bg-white/20 px-5 py-2 text-lg font-bold text-white hover:bg-white/30 focus:outline-none focus:ring-4 focus:ring-white/50 disabled:opacity-50'
                aria-label={updating ? 'กำลังอัปเดต' : 'อัปเดตเลย'}>
                {updating ? (
                  <>
                    <Icon icon='mdi:loading' className='mr-2 inline animate-spin' aria-hidden='true' />
                    กำลังอัปเดต...
                  </>
                ) : (
                  'อัปเดตเลย'
                )}
              </button>
            </div>
          </div>
        )}

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
              <button
                ref={selectBtnRef}
                onClick={handleSelectFile}
                disabled={!tauriReady}
                className={btnPrimary}
                aria-label='เลือกไฟล์ PDF เพื่อแปลง'>
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
                  <li>3. ดูตัวอย่างข้อความ</li>
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
              {/* Success card — read complete */}
              <div className='rounded-xl border-4 border-stone-900 bg-white p-8 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]'>
                <div className='mb-4 flex justify-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
                    <Icon icon='mdi:check-circle' className='text-5xl text-emerald-500' aria-hidden='true' />
                  </div>
                </div>
                <p className='text-center text-2xl font-black text-stone-900'>อ่านไฟล์สำเร็จ!</p>
                <p className='mt-1 text-center text-base text-stone-400'>พร้อมบันทึกเป็นไฟล์ Word</p>
                <div className='mt-4 flex items-center justify-center'>
                  <div className='flex items-center gap-2 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-2'>
                    <Icon icon='mdi:file-document-outline' className='text-xl text-emerald-600' aria-hidden='true' />
                    <span className='text-lg font-bold text-emerald-700'>{progress.total} หน้า</span>
                  </div>
                </div>
                <p className='mt-3 break-all text-center text-sm text-stone-400'>{fileName}</p>
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

              <button onClick={handleReset} className={btnSecondary} aria-label='เลือกไฟล์ใหม่'>
                <Icon icon='mdi:arrow-left' className='text-2xl' aria-hidden='true' />
                เลือกไฟล์ใหม่
              </button>
            </section>
          )}

          {/* ── SAVING: Converting to DOCX ───────────────────── */}
          {phase === 'saving' && (
            <section className='w-full max-w-md' aria-label='กำลังแปลงเป็นไฟล์ Word' role='status'>
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
              <div className='rounded-xl border-4 border-stone-900 bg-white p-8 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]'>
                <div className='mb-4 flex justify-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
                    <Icon icon='mdi:file-check' className='text-5xl text-emerald-500' aria-hidden='true' />
                  </div>
                </div>
                <p className='text-center text-2xl font-black text-stone-900'>บันทึกสำเร็จ!</p>
                <p className='mt-1 text-center text-base text-stone-400'>ไฟล์ Word พร้อมใช้งานแล้ว</p>
                <div className='mt-4 flex items-center justify-center'>
                  <div className='flex items-center gap-2 rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-2'>
                    <Icon icon='mdi:file-word' className='text-xl text-emerald-600' aria-hidden='true' />
                    <span className='text-lg font-bold text-emerald-700'>{progress.total} หน้า</span>
                  </div>
                </div>
                {outputPath && <p className='mt-3 break-all text-center text-sm text-stone-400'>บันทึกที่: {outputPath}</p>}
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
              <div className='rounded-xl border-4 border-stone-900 bg-white p-8 shadow-[5px_5px_0px_0px_rgba(28,25,23,1)]'>
                <div className='mb-4 flex justify-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
                    <Icon icon='mdi:alert-circle' className='text-5xl text-red-500' aria-hidden='true' />
                  </div>
                </div>
                <p className='text-center text-2xl font-black text-stone-900'>เกิดข้อผิดพลาด</p>
                <p className='mt-3 text-center text-lg text-red-600'>{errorMessage}</p>
              </div>

              {isFileLockedError ? (
                <>
                  <button ref={retryBtnRef} onClick={handleSaveAsWord} className={btnSuccess} aria-label='บันทึกอีกครั้ง'>
                    <Icon icon='mdi:content-save' className='text-2xl' aria-hidden='true' />
                    บันทึกอีกครั้ง
                  </button>
                  <button onClick={handleReset} className={btnSecondary} aria-label='เลือกไฟล์ใหม่'>
                    <Icon icon='mdi:arrow-left' className='text-2xl' aria-hidden='true' />
                    เลือกไฟล์ใหม่
                  </button>
                </>
              ) : (
                <button ref={retryBtnRef} onClick={handleReset} className={btnDanger} aria-label='ลองใหม่'>
                  <Icon icon='mdi:refresh' className='text-2xl' aria-hidden='true' />
                  ลองใหม่
                </button>
              )}
            </section>
          )}

          <p className='mt-12 text-center text-sm text-stone-400'>Thai PDF Fixer v1.1.6 — สำหรับผู้พิการทางสายตา</p>
        </main>
      </div>
    </>
  )
}
