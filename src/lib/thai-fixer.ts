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

/** Thai combining characters (above/below vowels, tone marks, etc.) */
const THAI_COMBINING_RE = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/

/** Thai consonants: U+0E01–U+0E2E */
const THAI_CONSONANT_RE = /[\u0E01-\u0E2E]/

/** Thai above/below vowels: ิ ี ึ ื ุ ู (U+0E34–U+0E39) */
const THAI_ABOVE_BELOW_VOWEL_RE = /[\u0E34-\u0E39]/

/** Thai tone marks: ่ ้ ๊ ๋ (U+0E48–U+0E4B) */
const THAI_TONE_MARK_RE = /[\u0E48-\u0E4B]/

/** Any Thai character (U+0E00–U+0E7F) */
const THAI_CHAR_RE = /[\u0E00-\u0E7F]/

// ── Type B: Severe garbling fixes ──

/**
 * Detect whether text has severe (Type B) garbling.
 * Heuristic: high ratio of spaces to Thai characters = spaces between every char.
 */
function detectGarblingLevel(text: string): 'mild' | 'severe' {
  // Collapse multiple spaces first for analysis
  const collapsed = text.replace(/ {2,}/g, ' ')

  let thaiCount = 0
  let spacesBetweenThai = 0

  for (const ch of collapsed) {
    if (THAI_CHAR_RE.test(ch)) thaiCount++
  }

  if (thaiCount < 10) return 'mild'

  // Count single spaces that sit between two Thai characters
  for (let i = 1; i < collapsed.length - 1; i++) {
    if (
      collapsed[i] === ' ' &&
      THAI_CHAR_RE.test(collapsed[i - 1]) &&
      THAI_CHAR_RE.test(collapsed[i + 1])
    ) {
      spacesBetweenThai++
    }
  }

  const ratio = spacesBetweenThai / thaiCount
  if (ratio > 0.25) return 'severe'

  // Also check for digits in combining-mark positions (after Thai consonant)
  const digitAfterThai = /[\u0E01-\u0E2E] *\d/.test(text)
  const symbolAfterThai = /[\u0E01-\u0E2E] *[;\\!@#]/.test(text)
  if (digitAfterThai || symbolAfterThai) return 'severe'

  return 'mild'
}

/**
 * Replace digits that substitute Thai combining marks.
 * Only applies when the digit is between Thai characters (not in "C-17" etc.)
 */
function fixDigitSubstitutions(text: string): string {
  let result = text

  // Multi-char digit sequences first (longer matches take priority)
  const multiDigitMap: Record<string, string> = {
    '56': '\u0E39\u0E48',  // ู่
    '5@': '\u0E39',        // ู
    '34': '\u0E36\u0E49',  // ึ้
  }

  for (const [digits, replacement] of Object.entries(multiDigitMap)) {
    // Digit sequence between Thai context
    const re = new RegExp(
      `(${THAI_CONSONANT_RE.source}(?:${THAI_COMBINING_RE.source})*)${escapeRegex(digits)}(?= ?${THAI_CHAR_RE.source}|\\s|$)`,
      'g'
    )
    result = result.replace(re, `$1${replacement}`)
  }

  // Single digit substitutions
  const singleDigitMap: Record<string, string> = {
    '7': '\u0E47',   // ็ (mai taikhu)
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

/**
 * Replace ASCII symbols that substitute Thai character clusters.
 * Only applies when surrounded by Thai context.
 */
function fixSymbolSubstitutions(text: string): string {
  let result = text

  // Symbol → Thai cluster mappings (between Thai chars)
  const symbolMap: [RegExp, string][] = [
    // ; → ื่ (sara uue + mai ek) — e.g. "ช; อี" → "ชื่อ"
    [
      new RegExp(`(${THAI_CONSONANT_RE.source}); ?`, 'g'),
      '$1\u0E37\u0E48'
    ],
    // ! → ู่ — e.g. "อ ย!" → "อยู่"
    [
      new RegExp(`(${THAI_CONSONANT_RE.source})! ?`, 'g'),
      '$1\u0E39\u0E48'
    ],
    // \ between Thai chars → remove (noise)
    [
      new RegExp(`(${THAI_CHAR_RE.source})\\\\ ?(${THAI_CHAR_RE.source})`, 'g'),
      '$1$2'
    ],
    // @ between Thai chars → remove (noise)
    [
      new RegExp(`(${THAI_CHAR_RE.source})@ ?(${THAI_CHAR_RE.source})`, 'g'),
      '$1$2'
    ],
    // # between Thai chars → remove (noise)
    [
      new RegExp(`(${THAI_CHAR_RE.source})# ?(${THAI_CHAR_RE.source})`, 'g'),
      '$1$2'
    ],
    // ' between Thai chars that's not an apostrophe → ์ (Thai cancel mark)
    [
      new RegExp(`(${THAI_CONSONANT_RE.source})' ?(${THAI_CHAR_RE.source})`, 'g'),
      '$1\u0E4C$2'
    ],
    // + between Thai chars → ็ (shortener)
    [
      new RegExp(`(${THAI_CONSONANT_RE.source})\\+ ?(${THAI_CHAR_RE.source})`, 'g'),
      '$1\u0E47$2'
    ],
  ]

  for (const [pattern, replacement] of symbolMap) {
    result = result.replace(pattern, replacement)
  }

  return result
}

/**
 * Strip spaces inserted between individual Thai characters in severely garbled text.
 * Matches runs of 3+ Thai characters separated by single spaces and removes the spaces.
 * Validates with Intl.Segmenter to ensure the result makes more sense.
 */
function stripInterCharSpaces(text: string): string {
  // Process line by line to preserve paragraph structure
  return text.split('\n').map(line => {
    // First collapse multiple spaces to single space
    let working = line.replace(/ {2,}/g, ' ')

    // Strip ALL spaces between Thai characters (repeated until stable)
    let prev = ''
    while (prev !== working) {
      prev = working
      working = working.replace(
        /([\u0E00-\u0E7F]) ([\u0E00-\u0E7F])/g,
        '$1$2'
      )
    }

    return working
  }).join('\n')
}

// ── Type A: PDF spacing fixes ──

/**
 * Fix spaces before combining marks and reassemble decomposed Sara Am (with spaces).
 */
function fixPdfSpacing(text: string): string {
  let result = text

  // Step 1: Remove spaces before Thai combining characters
  result = result.replace(
    new RegExp(`(.) +(${THAI_COMBINING_RE.source})`, 'g'),
    '$1$2'
  )

  // Step 2: Reassemble decomposed Sara Am with space: consonant + space + า → consonant + ำ
  result = result.replace(
    new RegExp(
      `(${THAI_CONSONANT_RE.source})(${THAI_COMBINING_RE.source}*) +\u0E32`,
      'g'
    ),
    (match, consonant: string, combiningMarks: string) => {
      if (THAI_ABOVE_BELOW_VOWEL_RE.test(combiningMarks)) {
        return match
      }
      return consonant + combiningMarks + '\u0E33'
    }
  )

  // Step 3: Combine standalone Nikhahit (ํ) + Sara Aa (า) → Sara Am (ำ)
  result = result.replace(/\u0E4D\u0E32/g, '\u0E33')

  return result
}

/**
 * Normalize multiple spaces and fix spacing artifacts from PDF line breaks.
 */
function fixSpacingArtifacts(text: string): string {
  let result = text

  // Collapse all runs of 2+ spaces to a single space
  result = result.replace(/ {2,}/g, ' ')

  // Spaces around hyphens in alphanumeric context: "C - 17" → "C-17"
  result = result.replace(/([A-Za-z0-9]) +- +([A-Za-z0-9])/g, '$1-$2')

  return result
}

// ── Sara Am (ำ ↔ า) fixes ──

/**
 * Count word-like segments using Intl.Segmenter.
 * Fewer segments generally means better word boundaries (more recognized words).
 */
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
  const SARA_AA = '\u0E32' // า
  const SARA_AM = '\u0E33' // ำ

  // Rule 1: ำ after a tone mark (่ ้ ๊ ๋) is always invalid → replace with า
  let result = text.replace(
    new RegExp(`(${THAI_TONE_MARK_RE.source})${SARA_AM}`, 'g'),
    `$1${SARA_AA}`
  )

  // Rule 2: Use Intl.Segmenter reverse check — if า produces fewer segments than ำ, use า
  if (typeof Intl?.Segmenter !== 'function') return result

  const pattern = new RegExp(
    `(${THAI_CONSONANT_RE.source})(${THAI_COMBINING_RE.source}*)${SARA_AM}`,
    'g'
  )

  const matches: { index: number; length: number; consonant: string; marks: string }[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(result)) !== null) {
    if (THAI_ABOVE_BELOW_VOWEL_RE.test(m[2])) continue
    matches.push({
      index: m.index,
      length: m[0].length,
      consonant: m[1],
      marks: m[2]
    })
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

    // If า version produces fewer segments, replace ำ→า
    if (modifiedSegments < originalSegments) {
      const saraAmPos = match.index + match.consonant.length + match.marks.length
      chars[saraAmPos] = SARA_AA
    }
    // Tiebreaker: check dictionary
    else if (modifiedSegments === originalSegments) {
      const saraAmPos = match.index + match.consonant.length + match.marks.length
      if (shouldBeSaraAa(result, match.index, match.length)) {
        chars[saraAmPos] = SARA_AA
      }
    }
  }

  return chars.join('')
}

/**
 * Fix lost Sara Am using Intl.Segmenter for Thai word boundary detection.
 * When PDFs completely lose the nikhahit, ำ becomes า without any space.
 */
function fixLostSaraAm(text: string): string {
  if (typeof Intl?.Segmenter !== 'function') return text

  const SARA_AA = '\u0E32' // า
  const SARA_AM = '\u0E33' // ำ

  const pattern = new RegExp(
    `(${THAI_CONSONANT_RE.source})(${THAI_COMBINING_RE.source}*)${SARA_AA}`,
    'g'
  )

  const matches: { index: number; length: number; consonant: string; marks: string }[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    if (THAI_ABOVE_BELOW_VOWEL_RE.test(m[2])) continue
    matches.push({
      index: m.index,
      length: m[0].length,
      consonant: m[1],
      marks: m[2]
    })
  }

  if (matches.length === 0) return text

  const result = text.split('')
  for (const match of matches) {
    const contextStart = Math.max(0, match.index - 20)
    const contextEnd = Math.min(text.length, match.index + match.length + 20)

    const originalChunk = text.slice(contextStart, contextEnd)
    const modifiedChunk =
      text.slice(contextStart, match.index) +
      match.consonant + match.marks + SARA_AM +
      text.slice(match.index + match.length, contextEnd)

    const originalSegments = countWordSegments(originalChunk)
    const modifiedSegments = countWordSegments(modifiedChunk)

    // If ำ version produces fewer segments, it's a better match
    if (modifiedSegments < originalSegments) {
      const saraAaPos = match.index + match.consonant.length + match.marks.length
      result[saraAaPos] = SARA_AM
    }
    // Tiebreaker: check dictionary
    else if (modifiedSegments === originalSegments) {
      const saraAaPos = match.index + match.consonant.length + match.marks.length
      if (shouldBeSaraAm(text, match.index, match.length)) {
        result[saraAaPos] = SARA_AM
      }
    }
  }

  return result.join('')
}

// ── Sara Am Dictionary ──

/**
 * Common Thai words/syllables that contain ำ (Sara Am).
 * Used as tiebreaker when Intl.Segmenter comparison is inconclusive.
 */
const SARA_AM_WORDS = new Set([
  // ก-
  'กำ', 'กำลัง', 'กำหนด', 'กำไร', 'กำเนิด', 'กำจัด', 'กำกับ', 'กำแพง', 'กำนัน',
  // ข-
  'ขำ',
  // ค-
  'คำ', 'คำสั่ง', 'คำถาม', 'คำตอบ', 'คำพูด', 'คำศัพท์', 'คำนวณ', 'คำร้อง',
  // จ-
  'จำ', 'จำเป็น', 'จำนวน', 'จำกัด', 'จำได้', 'จำหน่าย', 'จำลอง', 'จำแนก', 'จำปา',
  // ช-
  'ชำ', 'ชำนาญ', 'ชำระ', 'ชำรุด', 'ชำเลือง', 'ชำแหละ',
  // ซ-
  'ซ้ำ',
  // ด-
  'ดำ', 'ดำเนิน', 'ดำรง', 'ดำริ', 'ดำน้ำ',
  // ต-
  'ตำ', 'ตำแหน่ง', 'ตำรวจ', 'ตำรา', 'ตำบล', 'ตำนาน', 'ตำหนิ', 'ตำหนัก',
  // ถ-
  'ถ้ำ',
  // ท-
  'ทำ', 'ทำให้', 'ทำงาน', 'ทำได้', 'ทำลาย', 'ทำการ', 'ทำนาย', 'ทำนอง', 'ทำบุญ',
  // น-
  'นำ', 'นำไป', 'นำมา', 'นำเสนอ', 'นำทาง', 'นำเข้า', 'นำออก', 'น้ำ', 'น้ำมัน', 'น้ำตา', 'น้ำใจ',
  // บ-
  'บำ', 'บำรุง', 'บำบัด', 'บำเพ็ญ', 'บำนาญ', 'บำเหน็จ',
  // ป-
  'ปำ', 'ประจำ', 'ประจำวัน',
  // พ-
  'พำ', 'พำนัก',
  // ย-
  'ยำ',
  // ร-
  'รำ', 'รำคาญ', 'รำพัน', 'รำลึก',
  // ล-
  'ลำ', 'ลำดับ', 'ลำเลียง', 'ลำบาก', 'ลำไย', 'ลำธาร', 'ลำเนา', 'ลำพัง', 'ลำต้น',
  // ส-
  'สำ', 'สำคัญ', 'สำหรับ', 'สำนัก', 'สำนักงาน', 'สำเร็จ', 'สำรวจ', 'สำรอง', 'สำเนา',
  'สำราญ', 'สำอาง', 'สำนึก', 'สำแดง', 'สำเภา',
  // อ-
  'อำ', 'อำนาจ', 'อำเภอ', 'อำนวย', 'อำพราง', 'อำมหิต',
  // ห-
  'หำ',
  // compound patterns with ำ at end
  'ขำ', 'จำ', 'ดำ', 'ตำ', 'ทำ', 'นำ', 'บำ', 'รำ', 'ลำ', 'สำ', 'อำ',
  'กรรม', // not ำ but included as negative check
])

/**
 * Common Thai words where า (Sara Aa) is correct and ำ would be wrong.
 */
const NOT_SARA_AM_PATTERNS = new Set([
  'ภารกิจ', 'ภาร', 'เซาท์', 'การ', 'สาร', 'บาท', 'ราคา',
  'สาว', 'ราย', 'บาง', 'อาก', 'อาร', 'อาห', 'อาส', 'อาย',
  'ราช', 'ชาว', 'ชาต', 'ชาย', 'ชาญ', 'ชาง',
  'ภาค', 'ภาพ', 'ภาษ', 'ภาว',
  'ทาง', 'ทาน', 'ทาส', 'ทาย',
  'นาม', 'นาท', 'นาย', 'นาง', 'นาค',
  'มาก', 'มาต', 'มาร',
  'สาม', 'สาย', 'สาร', 'สาข', 'สาธ',
  'ปาก', 'ปาฏ',
  'ลาย', 'ลาก', 'ลาว', 'ลาภ',
  'วาง', 'วาด', 'วาท', 'วาร',
  'หาก', 'หาย', 'หาร',
  'คาด', 'คาม',
  'จาก', 'จาง', 'จาร',
  'กาล', 'กาย', 'การ', 'กาศ', 'การ',
  'ดาว', 'ดาร', 'ดาน',
  'บาด', 'บาป', 'บาน',
  'ตาก', 'ตาม', 'ตาย', 'ตาร',
  'ฆาต', 'ฆ่า',
])

/**
 * Check if a consonant+ำ at a given position should actually be consonant+า.
 */
function shouldBeSaraAa(text: string, matchIndex: number, matchLength: number): boolean {
  // Extract a small window around the match to check against NOT_SARA_AM_PATTERNS
  const start = Math.max(0, matchIndex - 3)
  const end = Math.min(text.length, matchIndex + matchLength + 3)
  const window = text.slice(start, end)

  for (const pattern of NOT_SARA_AM_PATTERNS) {
    if (window.includes(pattern.replace('า', 'ำ'))) return true
  }
  return false
}

/**
 * Check if a consonant+า at a given position should actually be consonant+ำ.
 */
function shouldBeSaraAm(text: string, matchIndex: number, matchLength: number): boolean {
  const start = Math.max(0, matchIndex - 3)
  const end = Math.min(text.length, matchIndex + matchLength + 3)
  const window = text.slice(start, end)

  for (const word of SARA_AM_WORDS) {
    // Check if the window contains the า version of a ำ word
    const aaVersion = word.replace('ำ', 'า')
    if (aaVersion !== word && window.includes(aaVersion)) return true
  }
  return false
}

/**
 * Dictionary-based Sara Am fallback.
 * Uses Intl.Segmenter to find word boundaries, then checks each word against dictionaries.
 * This avoids false positives from naive substring matching (e.g. "หน้า" ≠ "หน้ำ").
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

    // Try replacing า→ำ: check if the ำ version is in SARA_AM_WORDS
    const amCandidate = word.replace(/า/g, 'ำ')
    if (amCandidate !== word && SARA_AM_WORDS.has(amCandidate)) {
      // Validate: only replace if the ำ version produces fewer segments in context
      const ctx = text.slice(
        Math.max(0, seg.index - 10),
        Math.min(text.length, seg.index + word.length + 10)
      )
      const ctxModified = ctx.replace(word, amCandidate)
      if (countWordSegments(ctxModified) <= countWordSegments(ctx)) {
        word = amCandidate
      }
    }

    // Try replacing ำ→า: check if the า version matches NOT_SARA_AM_PATTERNS
    const aaCandidate = word.replace(/ำ/g, 'า')
    if (aaCandidate !== word) {
      for (const pattern of NOT_SARA_AM_PATTERNS) {
        if (aaCandidate.includes(pattern) && !word.includes(pattern)) {
          word = aaCandidate
          break
        }
      }
    }

    result += word
  }

  return result
}

// ── Encoding fixes ──

/**
 * Fix TIS-620 → Latin-1 mojibake.
 */
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

/**
 * Fix Windows-874 → Latin-1 mojibake.
 */
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

// ── Utility ──

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

  // Step 3: Fix misplaced Sara Am (ำ→า where ำ is wrong)
  result = fixMisplacedSaraAm(result)

  // Step 4: Fix lost Sara Am (า→ำ where า should be ำ)
  result = fixLostSaraAm(result)

  // Step 5: Dictionary-based Sara Am fallback for remaining cases
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
