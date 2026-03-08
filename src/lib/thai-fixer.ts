/**
 * Fix garbled Thai text from PDFs.
 *
 * Handles multiple garbling patterns:
 *
 * 1. Severe garbling (Type B): government/EEC documents
 *    - Spaces between every character
 *    - Digits substituting Thai combining marks (7→็, 56→ู่)
 *    - Symbols substituting Thai chars (;→ื่, !→ู่)
 *
 * 2. PDF text extraction spacing artifacts (Type A):
 *    - Spaces inserted before Thai combining characters
 *    - Sara Am (ำ) decomposed with space: "ท า" → "ทำ"
 *    - Nikhahit (ํ) + Sara Aa (า) not combined into Sara Am (ำ)
 *    - Multiple spaces from line-break joins
 *    - Spaces around hyphens: "C - 17" → "C-17"
 *
 * 3. Lost/misplaced Sara Am (ำ ↔ า):
 *    - Uses Intl.Segmenter + dictionary fallback for smart detection
 *
 * 4. TIS-620 / Windows-874 encoding misread as Latin-1 (mojibake)
 */

// ── Thai character class regexes ──

const THAI_COMBINING_RE = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/
const THAI_CONSONANT_RE = /[\u0E01-\u0E2E]/
const THAI_ABOVE_BELOW_VOWEL_RE = /[\u0E34-\u0E39]/
const THAI_TONE_MARK_RE = /[\u0E48-\u0E4B]/
const THAI_CHAR_RE = /[\u0E00-\u0E7F]/

// ── Type B: Severe garbling detection & fixes ──

/**
 * Detect whether text has severe (Type B) garbling.
 * Type B = spaces between individual characters (not between words).
 * Heuristic: count how many Thai chars appear in single-char runs (isolated by spaces).
 */
function detectGarblingLevel(text: string): 'mild' | 'severe' {
  const collapsed = text.replace(/ {2,}/g, ' ')

  let thaiCount = 0
  let singleCharRuns = 0

  // Count Thai chars and single-char Thai runs
  for (let i = 0; i < collapsed.length; i++) {
    if (!THAI_CHAR_RE.test(collapsed[i])) continue
    thaiCount++

    // Check if this Thai char is isolated (preceded and followed by space or boundary)
    const prevIsSpace = i === 0 || collapsed[i - 1] === ' ' || !THAI_CHAR_RE.test(collapsed[i - 1])
    const nextIsSpace = i === collapsed.length - 1 || collapsed[i + 1] === ' ' || !THAI_CHAR_RE.test(collapsed[i + 1])
    if (prevIsSpace && nextIsSpace) singleCharRuns++
  }

  if (thaiCount < 10) return 'mild'

  // If more than 30% of Thai chars are single-char runs, it's severe
  if (singleCharRuns / thaiCount > 0.3) return 'severe'

  // Also check for digits/symbols in combining-mark positions
  const digitAfterThai = /[\u0E01-\u0E2E] *\d/.test(text)
  const symbolAfterThai = /[\u0E01-\u0E2E] *[;\\!@#]/.test(text)
  if (digitAfterThai || symbolAfterThai) return 'severe'

  return 'mild'
}

function fixDigitSubstitutions(text: string): string {
  let result = text

  const multiDigitMap: Record<string, string> = {
    '56': '\u0E39\u0E48',  // ู่
    '5@': '\u0E39',        // ู
    '34': '\u0E36\u0E49',  // ึ้
  }

  for (const [digits, replacement] of Object.entries(multiDigitMap)) {
    const re = new RegExp(
      `(${THAI_CONSONANT_RE.source}(?:${THAI_COMBINING_RE.source})*)${escapeRegex(digits)}(?= ?${THAI_CHAR_RE.source}|\\s|$)`,
      'g'
    )
    result = result.replace(re, `$1${replacement}`)
  }

  const singleDigitMap: Record<string, string> = {
    '7': '\u0E47',   // ็
    '5': '\u0E39',   // ู
    '6': '\u0E48',   // ่
    '3': '\u0E36',   // ึ
    '0': '\u0E30',   // ะ
  }

  for (const [digit, replacement] of Object.entries(singleDigitMap)) {
    const re = new RegExp(
      `(${THAI_CONSONANT_RE.source}(?:${THAI_COMBINING_RE.source})*)${escapeRegex(digit)}(?= ?${THAI_CHAR_RE.source}|\\s|$)`,
      'g'
    )
    result = result.replace(re, `$1${replacement}`)
  }

  return result
}

function fixSymbolSubstitutions(text: string): string {
  let result = text

  const symbolMap: [RegExp, string][] = [
    [new RegExp(`(${THAI_CONSONANT_RE.source}); ?`, 'g'), '$1\u0E37\u0E48'],
    [new RegExp(`(${THAI_CONSONANT_RE.source})! ?`, 'g'), '$1\u0E39\u0E48'],
    [new RegExp(`(${THAI_CHAR_RE.source})\\\\ ?(${THAI_CHAR_RE.source})`, 'g'), '$1$2'],
    [new RegExp(`(${THAI_CHAR_RE.source})@ ?(${THAI_CHAR_RE.source})`, 'g'), '$1$2'],
    [new RegExp(`(${THAI_CHAR_RE.source})# ?(${THAI_CHAR_RE.source})`, 'g'), '$1$2'],
    [new RegExp(`(${THAI_CONSONANT_RE.source})' ?(${THAI_CHAR_RE.source})`, 'g'), '$1\u0E4C$2'],
    [new RegExp(`(${THAI_CONSONANT_RE.source})\\+ ?(${THAI_CHAR_RE.source})`, 'g'), '$1\u0E47$2'],
  ]

  for (const [pattern, replacement] of symbolMap) {
    result = result.replace(pattern, replacement)
  }

  return result
}

function stripInterCharSpaces(text: string): string {
  return text.split('\n').map(line => {
    let working = line.replace(/ {2,}/g, ' ')
    let prev = ''
    while (prev !== working) {
      prev = working
      working = working.replace(/([\u0E00-\u0E7F]) ([\u0E00-\u0E7F])/g, '$1$2')
    }
    return working
  }).join('\n')
}

// ── Type A: PDF spacing fixes ──

function fixPdfSpacing(text: string): string {
  let result = text

  result = result.replace(
    new RegExp(`(.) +(${THAI_COMBINING_RE.source})`, 'g'),
    '$1$2'
  )

  result = result.replace(
    new RegExp(
      `(${THAI_CONSONANT_RE.source})(${THAI_COMBINING_RE.source}*) +\u0E32`,
      'g'
    ),
    (match, consonant: string, combiningMarks: string) => {
      if (THAI_ABOVE_BELOW_VOWEL_RE.test(combiningMarks)) return match
      return consonant + combiningMarks + '\u0E33'
    }
  )

  result = result.replace(/\u0E4D\u0E32/g, '\u0E33')

  return result
}

function fixSpacingArtifacts(text: string): string {
  let result = text
  result = result.replace(/ {2,}/g, ' ')
  result = result.replace(/([A-Za-z0-9]) +- +([A-Za-z0-9])/g, '$1-$2')
  return result
}

// ── Sara Am (ำ ↔ า) fixes ──

function countWordSegments(text: string): number {
  if (typeof Intl?.Segmenter !== 'function') return 0
  const segmenter = new Intl.Segmenter('th', { granularity: 'word' })
  let count = 0
  for (const seg of segmenter.segment(text)) {
    if (seg.isWordLike) count++
  }
  return count
}

/**
 * Fix misplaced Sara Am (ำ→า).
 * Some PDFs garble า into ำ in wrong positions.
 */
function fixMisplacedSaraAm(text: string): string {
  const SARA_AA = '\u0E32'
  const SARA_AM = '\u0E33'

  // Rule 1: ำ after a tone mark is always invalid → replace with า
  let result = text.replace(
    new RegExp(`(${THAI_TONE_MARK_RE.source})${SARA_AM}`, 'g'),
    `$1${SARA_AA}`
  )

  if (typeof Intl?.Segmenter !== 'function') return result

  const pattern = new RegExp(
    `(${THAI_CONSONANT_RE.source})(${THAI_COMBINING_RE.source}*)${SARA_AM}`,
    'g'
  )

  const matches: { index: number; length: number; consonant: string; marks: string }[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(result)) !== null) {
    if (THAI_ABOVE_BELOW_VOWEL_RE.test(m[2])) continue
    matches.push({ index: m.index, length: m[0].length, consonant: m[1], marks: m[2] })
  }

  if (matches.length === 0) return result

  const chars = result.split('')
  for (const match of matches) {
    const contextStart = Math.max(0, match.index - 20)
    const contextEnd = Math.min(result.length, match.index + match.length + 20)

    const originalChunk = result.slice(contextStart, contextEnd)
    const modifiedChunk =
      result.slice(contextStart, match.index) +
      match.consonant + match.marks + SARA_AA +
      result.slice(match.index + match.length, contextEnd)

    const originalSegments = countWordSegments(originalChunk)
    const modifiedSegments = countWordSegments(modifiedChunk)

    const saraAmPos = match.index + match.consonant.length + match.marks.length

    // Replace if า produces fewer or equal segments (be aggressive ำ→า)
    if (modifiedSegments <= originalSegments) {
      chars[saraAmPos] = SARA_AA
    }
  }

  return chars.join('')
}

/**
 * Fix lost Sara Am using Intl.Segmenter.
 * CONSERVATIVE: only replace า→ำ when there's strong evidence.
 */
function fixLostSaraAm(text: string): string {
  if (typeof Intl?.Segmenter !== 'function') return text

  const SARA_AA = '\u0E32'
  const SARA_AM = '\u0E33'

  const pattern = new RegExp(
    `(${THAI_CONSONANT_RE.source})(${THAI_COMBINING_RE.source}*)${SARA_AA}`,
    'g'
  )

  const matches: { index: number; length: number; consonant: string; marks: string }[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    if (THAI_ABOVE_BELOW_VOWEL_RE.test(m[2])) continue
    matches.push({ index: m.index, length: m[0].length, consonant: m[1], marks: m[2] })
  }

  if (matches.length === 0) return text

  const result = text.split('')
  for (const match of matches) {
    // Skip if this า is part of a known NOT-Sara-Am word
    const consonant = match.consonant
    const saraAaPos = match.index + consonant.length + match.marks.length
    const afterChars = text.slice(saraAaPos + 1, saraAaPos + 4)
    const beforeAndMatch = text.slice(Math.max(0, match.index - 2), saraAaPos + 1)

    // Check if consonant+า+next chars form a NOT_SARA_AM word
    let isProtected = false
    for (const word of NOT_SARA_AM_WORDS) {
      if (beforeAndMatch.includes(word) || (consonant + 'า' + afterChars).startsWith(word.slice(word.indexOf('า') > 0 ? word.indexOf('า') - 1 : 0))) {
        // More robust check: does the surrounding text contain a protected word?
        const windowStart = Math.max(0, match.index - 5)
        const windowEnd = Math.min(text.length, saraAaPos + 6)
        const window = text.slice(windowStart, windowEnd)
        if (window.includes(word)) {
          isProtected = true
          break
        }
      }
    }
    if (isProtected) continue

    const contextStart = Math.max(0, match.index - 20)
    const contextEnd = Math.min(text.length, match.index + match.length + 20)

    const originalChunk = text.slice(contextStart, contextEnd)
    const modifiedChunk =
      text.slice(contextStart, match.index) +
      match.consonant + match.marks + SARA_AM +
      text.slice(match.index + match.length, contextEnd)

    const originalSegments = countWordSegments(originalChunk)
    const modifiedSegments = countWordSegments(modifiedChunk)

    // STRICT: only replace when ำ produces CLEARLY fewer segments (at least 2 fewer)
    // This prevents false positives from noisy context
    if (modifiedSegments < originalSegments - 1) {
      result[saraAaPos] = SARA_AM
    }
    // If exactly 1 fewer, also require dictionary confirmation
    else if (modifiedSegments === originalSegments - 1) {
      if (isDictionarySaraAm(consonant)) {
        result[saraAaPos] = SARA_AM
      }
    }
    // NO tiebreaker — if equal, keep original า
  }

  return result.join('')
}

// ── Sara Am Dictionaries ──

/**
 * Consonants that commonly form ำ syllables.
 * Used as additional confirmation for fixLostSaraAm.
 */
function isDictionarySaraAm(consonant: string): boolean {
  // These consonants very commonly pair with ำ
  const commonSaraAmConsonants = new Set([
    'ก', // กำ
    'ค', // คำ
    'จ', // จำ
    'ช', // ชำ
    'ด', // ดำ
    'ต', // ตำ
    'ท', // ทำ
    'น', // นำ
    'บ', // บำ
    'ล', // ลำ
    'ส', // สำ
    'อ', // อำ
    'ร', // รำ
  ])
  return commonSaraAmConsonants.has(consonant)
}

/**
 * Common Thai words/syllables containing ำ.
 * Used for dictionary-based Sara Am fallback.
 */
const SARA_AM_WORDS = new Set([
  'กำลัง', 'กำหนด', 'กำไร', 'กำเนิด', 'กำจัด', 'กำกับ', 'กำแพง', 'กำนัน',
  'คำสั่ง', 'คำถาม', 'คำตอบ', 'คำพูด', 'คำศัพท์', 'คำนวณ', 'คำร้อง',
  'จำเป็น', 'จำนวน', 'จำกัด', 'จำได้', 'จำหน่าย', 'จำลอง', 'จำแนก',
  'ชำนาญ', 'ชำระ', 'ชำรุด', 'ชำแหละ',
  'ดำเนิน', 'ดำรง', 'ดำริ', 'ดำน้ำ',
  'ตำแหน่ง', 'ตำรวจ', 'ตำรา', 'ตำบล', 'ตำนาน', 'ตำหนิ',
  'ทำให้', 'ทำงาน', 'ทำได้', 'ทำลาย', 'ทำการ', 'ทำนาย', 'ทำนอง', 'ทำบุญ',
  'นำไป', 'นำมา', 'นำเสนอ', 'นำทาง', 'นำเข้า', 'นำออก',
  'น้ำมัน', 'น้ำตา', 'น้ำใจ',
  'บำรุง', 'บำบัด', 'บำเพ็ญ', 'บำนาญ', 'บำเหน็จ',
  'ประจำ', 'ประจำวัน',
  'รำคาญ', 'รำพัน', 'รำลึก',
  'ลำดับ', 'ลำเลียง', 'ลำบาก', 'ลำไย', 'ลำธาร', 'ลำพัง', 'ลำต้น',
  'สำคัญ', 'สำหรับ', 'สำนัก', 'สำนักงาน', 'สำเร็จ', 'สำรวจ', 'สำรอง', 'สำเนา',
  'สำราญ', 'สำอาง', 'สำนึก', 'สำแดง',
  'อำนาจ', 'อำเภอ', 'อำนวย', 'อำพราง', 'อำมหิต',
])

/**
 * Common Thai words where า is correct — ำ would be WRONG.
 * Extensive list to prevent false positives.
 */
const NOT_SARA_AM_WORDS = new Set([
  // Very common words
  'การ', 'ความ', 'จาก', 'มาก', 'อาจ', 'ราย', 'ราช', 'บาง', 'ทาง',
  'อากาศ', 'อาหาร', 'อาการ', 'อาสา', 'อาย', 'อายุ', 'อาวุธ', 'อาชีพ',
  'อาร์', 'อาณา', 'อาณาจักร', 'อาว', 'อาศัย', 'อาจารย์', 'อารมณ์',
  'ภารกิจ', 'ภาค', 'ภาพ', 'ภาษ', 'ภาษา', 'ภาว', 'ภาวะ', 'ภาร',
  'เซาท์', 'เวลา', 'เจาะ', 'เขา', 'เรา', 'เดา', 'เสา', 'เทา', 'เก่า', 'เงา',
  'การณ์', 'กาล', 'กาย', 'การ์', 'กาศ', 'กาจ',
  'สาร', 'สาว', 'สาม', 'สาย', 'สาข', 'สาธ', 'สาก', 'สาเหตุ',
  'ราคา', 'ราก', 'ราว', 'ราง', 'ราช', 'ราศ', 'ราชการ',
  'นาม', 'นาที', 'นาย', 'นาง', 'นาค', 'นาฬ', 'นาน',
  'ทาน', 'ทาส', 'ทาย', 'ทาง', 'ทาร',
  'มาก', 'มาตร', 'มาร', 'มาส',
  'บาง', 'บาท', 'บาด', 'บาป', 'บาน', 'บาร์',
  'ชาว', 'ชาติ', 'ชาย', 'ชาญ', 'ชาง', 'ชาร์',
  'ตาก', 'ตาม', 'ตาย', 'ตาร์', 'ตาน', 'ตาง',
  'ปาก', 'ปาฏ', 'ปาน',
  'ลาย', 'ลาก', 'ลาว', 'ลาภ',
  'วาง', 'วาด', 'วาท', 'วาร', 'วาน',
  'หาก', 'หาย', 'หาร', 'หาง',
  'คาด', 'คาม', 'คาว', 'คาร์',
  'จาก', 'จาง', 'จาร',
  'ฆาต', 'ฆ่า',
  'ดาว', 'ดาร', 'ดาน', 'ดาบ',
  'พา', 'พาก', 'พาน', 'พาย', 'พาร์',
  'หน้า', 'ข้า', 'ค่า', 'ว่า', 'น่า', 'ท่า', 'พ่า', 'ผ่า', 'ฆ่า',
  'ครา', 'คราว',
  'กระจาย', 'กระดาษ',
  'ประกาศ', 'ประการ', 'ประกาย',
  'สงคราม', 'เครา',
])

/**
 * Dictionary-based Sara Am fallback.
 * Uses Intl.Segmenter word boundaries to avoid false substring matches.
 * Only replaces when a WHOLE segmented word matches a dictionary entry.
 */
function dictionarySaraAmFallback(text: string): string {
  if (typeof Intl?.Segmenter !== 'function') return text

  const segmenter = new Intl.Segmenter('th', { granularity: 'word' })
  const segments = [...segmenter.segment(text)]

  let result = ''
  for (const seg of segments) {
    if (!seg.isWordLike) {
      result += seg.segment
      continue
    }

    let word = seg.segment

    // Try า→ำ: only for SPECIFIC known Sara Am words (replace one า at a time)
    for (const dictWord of SARA_AM_WORDS) {
      // Create the า version of the dict word
      const aaVersion = dictWord.replace(/ำ/g, 'า')
      if (aaVersion !== dictWord && word === aaVersion) {
        word = dictWord
        break
      }
    }

    // Try ำ→า: check if the word with า is in NOT_SARA_AM_WORDS
    if (word.includes('ำ')) {
      const aaVersion = word.replace(/ำ/g, 'า')
      if (NOT_SARA_AM_WORDS.has(aaVersion)) {
        word = aaVersion
      }
    }

    result += word
  }

  return result
}

// ── Encoding fixes ──

function tis620ToUnicode(garbled: string): string {
  const result: string[] = []
  for (let i = 0; i < garbled.length; i++) {
    const code = garbled.charCodeAt(i)
    if (code >= 0xa1 && code <= 0xfb) {
      result.push(String.fromCharCode(code - 0xa1 + 0x0e01))
    } else {
      result.push(garbled[i])
    }
  }
  return result.join('')
}

function windows874ToUnicode(garbled: string): string {
  const win874Extras: Record<number, number> = {
    0x80: 0x20ac, 0x85: 0x2026, 0x91: 0x2018, 0x92: 0x2019,
    0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014
  }

  const result: string[] = []
  for (let i = 0; i < garbled.length; i++) {
    const code = garbled.charCodeAt(i)
    if (code >= 0xa1 && code <= 0xfb) {
      result.push(String.fromCharCode(code - 0xa1 + 0x0e01))
    } else if (win874Extras[code]) {
      result.push(String.fromCharCode(win874Extras[code]))
    } else {
      result.push(garbled[i])
    }
  }
  return result.join('')
}

function countThaiChars(text: string): number {
  let count = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x0e01 && code <= 0x0e5b) count++
  }
  return count
}

function hasLatinHighBytes(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0xa1 && code <= 0xfb) return true
  }
  return false
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Main pipeline ──

export function fixGarbledThai(input: string): string {
  if (!input.trim()) return ''

  let result = input

  // Step 0: Detect garbling severity
  const level = detectGarblingLevel(result)

  // Step 1: If severe (Type B), apply aggressive fixes first
  if (level === 'severe') {
    result = fixDigitSubstitutions(result)
    result = fixSymbolSubstitutions(result)
    result = stripInterCharSpaces(result)
  }

  // Step 2: Standard spacing fixes
  result = fixPdfSpacing(result)
  result = fixSpacingArtifacts(result)

  // Step 3: Fix misplaced Sara Am (ำ→า) — AGGRESSIVE
  result = fixMisplacedSaraAm(result)

  // Step 4: Fix lost Sara Am (า→ำ) — CONSERVATIVE
  result = fixLostSaraAm(result)

  // Step 5: Dictionary-based Sara Am fallback (exact word matches only)
  result = dictionarySaraAmFallback(result)

  // Step 6: Encoding fix (TIS-620 / Windows-874 mojibake)
  if (hasLatinHighBytes(result)) {
    const strategies = [
      { fn: tis620ToUnicode },
      { fn: windows874ToUnicode }
    ]

    let bestResult = result
    let bestScore = countThaiChars(result)

    for (const strategy of strategies) {
      const candidate = strategy.fn(result)
      const score = countThaiChars(candidate)
      if (score > bestScore) {
        bestScore = score
        bestResult = candidate
      }
    }
    result = bestResult
  }

  return result
}
