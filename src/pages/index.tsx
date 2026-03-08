import { useState, useRef, useCallback, useEffect } from 'react'
import Head from 'next/head'
import { fixGarbledThai } from '@/lib/thai-fixer'
import { extractTextFromPDF } from '@/lib/pdf-extractor'
import { speak, stop as stopSpeech, hasThaiVoice } from '@/lib/speech'
import { downloadAsTxt, copyToClipboard } from '@/lib/file-utils'
import { downloadAsDocx } from '@/lib/docx-generator'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [thaiVoiceAvailable, setThaiVoiceAvailable] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for Thai voice availability
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      announce('กรุณาเลือกไฟล์ PDF เท่านั้น')
      return
    }

    announce(`กำลังอ่านไฟล์ ${file.name} กรุณารอสักครู่`)
    setIsProcessing(true)

    try {
      const text = await extractTextFromPDF(file, (current, total) => {
        announce(`กำลังอ่านหน้า ${current} จาก ${total}`)
      })
      setInputText(text)
      announce(`อ่านไฟล์ ${file.name} สำเร็จ ได้ข้อความ ${text.length} ตัวอักษร พร้อมแก้ไข`)
    } catch {
      announce('เกิดข้อผิดพลาดในการอ่านไฟล์ PDF กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFix = () => {
    if (!inputText.trim()) {
      announce('กรุณาวางข้อความหรืออัปโหลดไฟล์ PDF ก่อน')
      return
    }

    announce('กำลังแก้ไขข้อความ กรุณารอสักครู่')
    setIsProcessing(true)

    setTimeout(() => {
      const fixed = fixGarbledThai(inputText)
      setOutputText(fixed)
      setIsProcessing(false)
      announce('แก้ไขข้อความสำเร็จ ข้อความพร้อมให้อ่าน คัดลอก หรือดาวน์โหลด')
    }, 100)
  }

  const handleSpeak = () => {
    if (!outputText.trim()) {
      announce('ไม่มีข้อความให้อ่าน กรุณาแก้ไขข้อความก่อน')
      return
    }

    if (speaking) {
      stopSpeech()
      setSpeaking(false)
      announce('หยุดอ่านเสียงแล้ว')
    } else {
      setSpeaking(true)
      announce('กำลังเล่นเสียงข้อความ')
      speak(outputText, () => {
        setSpeaking(false)
        announce('อ่านเสียงข้อความจบแล้ว')
      })
    }
  }

  const handleCopy = async () => {
    if (!outputText.trim()) {
      announce('ไม่มีข้อความให้คัดลอก')
      return
    }
    const success = await copyToClipboard(outputText)
    announce(success ? 'คัดลอกข้อความไปยังคลิปบอร์ดแล้ว' : 'ไม่สามารถคัดลอกข้อความได้ กรุณาลองใหม่')
  }

  const handleDownloadTxt = () => {
    if (!outputText.trim()) {
      announce('ไม่มีข้อความให้ดาวน์โหลด')
      return
    }
    downloadAsTxt(outputText)
    announce('กำลังดาวน์โหลดไฟล์ .txt')
  }

  const handleDownloadDocx = async () => {
    if (!outputText.trim()) {
      announce('ไม่มีข้อความให้ดาวน์โหลด')
      return
    }
    try {
      await downloadAsDocx(outputText)
      announce('กำลังดาวน์โหลดไฟล์ .docx')
    } catch {
      announce('เกิดข้อผิดพลาดในการสร้างไฟล์ .docx')
    }
  }

  const btnClass =
    'w-full p-6 text-2xl font-bold bg-white text-black border-4 border-white hover:bg-yellow-400 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed'
  const inputClass = 'w-full p-6 text-2xl bg-black text-white border-4 border-white resize-vertical'

  return (
    <>
      <Head>
        <title>เครื่องมือแก้ไขข้อความภาษาไทยจาก PDF - สำหรับผู้พิการทางสายตา</title>
      </Head>

      {/* Skip Link */}
      <a href='#main-content' className='skip-link'>
        ข้ามไปยังเนื้อหาหลัก
      </a>

      {/* Header */}
      <header className='border-b-4 border-yellow-400 p-6'>
        <h1 className='text-4xl font-bold text-yellow-400'>เครื่องมือแก้ไขข้อความภาษาไทยจาก PDF</h1>
        <p className='mt-2 text-xl text-white'>สำหรับผู้พิการทางสายตา - ใช้งานผ่าน Screen Reader ได้เต็มรูปแบบ</p>
      </header>

      <main id='main-content' className='mx-auto max-w-4xl space-y-12 p-6'>
        {/* Section 1: Input */}
        <section aria-labelledby='input-heading'>
          <h2 id='input-heading' className='mb-6 text-3xl font-bold text-yellow-400'>
            ขั้นตอนที่ 1: ใส่ข้อความ
          </h2>

          <div className='mb-8'>
            <label htmlFor='input-text' className='mb-3 block text-2xl font-bold text-yellow-400'>
              วางข้อความภาษาไทยที่อ่านไม่ออกที่นี่
            </label>
            <textarea
              id='input-text'
              className={inputClass}
              rows={8}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder='วางข้อความที่ต้องการแก้ไขที่นี่...'
              aria-describedby='input-help'
            />
            <p id='input-help' className='mt-2 text-lg text-gray-300'>
              คัดลอกข้อความภาษาไทยที่เป็นตัวอักษรแปลกๆ จาก PDF แล้ววางที่นี่
            </p>
          </div>

          <div>
            <label htmlFor='pdf-upload' className='mb-3 block text-2xl font-bold text-yellow-400'>
              หรือ อัปโหลดไฟล์ PDF
            </label>
            <input
              ref={fileInputRef}
              id='pdf-upload'
              type='file'
              accept='.pdf'
              onChange={handleFileChange}
              className='w-full border-4 border-white bg-black p-6 text-2xl text-white file:mr-4 file:border-0 file:bg-yellow-400 file:px-6 file:py-3 file:text-xl file:font-bold file:text-black'
              aria-describedby='upload-help'
            />
            <p id='upload-help' className='mt-2 text-lg text-gray-300'>
              เลือกไฟล์ PDF ที่ต้องการสกัดข้อความภาษาไทย
            </p>
          </div>
        </section>

        {/* Section 2: Action */}
        <section aria-labelledby='action-heading'>
          <h2 id='action-heading' className='mb-6 text-3xl font-bold text-yellow-400'>
            ขั้นตอนที่ 2: แก้ไขข้อความ
          </h2>
          <button onClick={handleFix} disabled={isProcessing || !inputText.trim()} className={btnClass} aria-busy={isProcessing}>
            {isProcessing ? 'กำลังประมวลผล...' : 'แก้ไขข้อความภาษาไทย'}
          </button>
        </section>

        {/* Section 3: Output */}
        <section aria-labelledby='output-heading'>
          <h2 id='output-heading' className='mb-6 text-3xl font-bold text-yellow-400'>
            ผลลัพธ์
          </h2>

          <label htmlFor='output-text' className='mb-3 block text-2xl font-bold text-yellow-400'>
            ข้อความภาษาไทยที่แก้ไขแล้ว
          </label>
          <textarea id='output-text' className={inputClass} rows={8} value={outputText} readOnly aria-describedby='output-help' />
          <p id='output-help' className='mt-2 text-lg text-gray-300'>
            {outputText ? `ข้อความ ${outputText.length} ตัวอักษร พร้อมใช้งาน` : 'ยังไม่มีผลลัพธ์ กรุณาใส่ข้อความและกดแก้ไขก่อน'}
          </p>
        </section>

        {/* Section 4: Tools */}
        <section aria-labelledby='tools-heading'>
          <h2 id='tools-heading' className='mb-6 text-3xl font-bold text-yellow-400'>
            เครื่องมือ
          </h2>

          <div className='space-y-4'>
            <button
              onClick={handleSpeak}
              disabled={!outputText.trim() || (!thaiVoiceAvailable && !speaking)}
              className={btnClass}
              aria-label={speaking ? 'หยุดเล่นเสียง' : 'เล่นเสียงข้อความที่แก้ไขแล้ว'}>
              {speaking ? 'หยุดเสียง' : 'เล่นเสียงข้อความ'}
            </button>

            {!thaiVoiceAvailable && (
              <p className='text-lg text-red-400' role='alert'>
                ไม่พบเสียงภาษาไทยในระบบ ฟังก์ชันเล่นเสียงอาจไม่ทำงาน
              </p>
            )}

            <button onClick={handleCopy} disabled={!outputText.trim()} className={btnClass}>
              คัดลอกข้อความ
            </button>

            <button onClick={handleDownloadTxt} disabled={!outputText.trim()} className={btnClass}>
              ดาวน์โหลดไฟล์ .txt
            </button>

            <button onClick={handleDownloadDocx} disabled={!outputText.trim()} className={btnClass}>
              ดาวน์โหลดไฟล์ .docx
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='mt-12 border-t-4 border-yellow-400 p-6 text-center'>
        <p className='text-lg text-gray-300'>เครื่องมือนี้ออกแบบมาเพื่อผู้พิการทางสายตาโดยเฉพาะ รองรับ Screen Reader ทุกชนิด</p>
      </footer>

      {/* Aria-live announcements for screen readers */}
      <div aria-live='assertive' role='status' className='sr-only'>
        {statusMessage}
      </div>
    </>
  )
}
