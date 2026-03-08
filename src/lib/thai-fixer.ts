/**
 * Fix garbled Thai text from PDFs.
 *
 * Handles two main garbling patterns:
 *
 * 1. PDF text extraction artifacts:
 *    - Spaces inserted before Thai combining characters (่ ้ ็ ์ ั ิ ี ึ ื ุ ู etc.)
 *    - Sara Am (ำ) decomposed: "ท า" → "ทำ", "บ ารุง" → "บำรุง"
 *    - Nikhahit (ํ) + Sara Aa (า) not combined into Sara Am (ำ)
 *
 * 2. TIS-620 / Windows-874 encoding misread as Latin-1 (mojibake):
 *    - Bytes in 0xA1-0xFB mapped back to Thai Unicode U+0E01-U+0E5B
 */

// Thai combining characters: vowels above/below, tone marks, etc.
// These should never be preceded by a space in proper Thai text.
// U+0E31 (mai han akat), U+0E34-U+0E3A (sara i/ii/ue/uee/u/uu/pinthu),
// U+0E47-U+0E4E (mai tai khu, mai ek, mai tho, mai tri, mai chattawa, thanthakhat, nikhahit, yamakkan)
const THAI_COMBINING_RE = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/

// Thai consonants: U+0E01-U+0E2E
const THAI_CONSONANT_RE = /[\u0E01-\u0E2E]/

// Thai above-vowels that sit on consonants (สระบน): U+0E34-U+0E39 (ิ ี ึ ื ุ ู)
const THAI_ABOVE_BELOW_VOWEL_RE = /[\u0E34-\u0E39]/

/**
 * Fix PDF extraction artifacts: remove spurious spaces before combining marks
 * and reassemble decomposed Sara Am.
 */
function fixPdfSpacing(text: string): string {
  let result = text

  // Step 1: Remove spaces before Thai combining characters
  // Pattern: any char + space(s) + combining mark → remove the space(s)
  // e.g., "สิ ่ง" → "สิ่ง", "นี ้" → "นี้", "มั ่น" → "มั่น"
  result = result.replace(
    new RegExp(`(.) +(${THAI_COMBINING_RE.source})`, 'g'),
    '$1$2'
  )

  // Step 2: Reassemble decomposed Sara Am (ำ)
  // In PDFs, ำ is often split as: consonant + space + า (sara aa)
  // But only when the consonant doesn't already have an above/below vowel.
  // Pattern: Thai consonant (possibly with combining marks) + space + า → consonant + ำ
  // e.g., "ท า" → "ทำ", "บ ารุง" → "บำรุง", "น า" → "นำ"
  result = result.replace(
    new RegExp(
      `(${THAI_CONSONANT_RE.source})(${THAI_COMBINING_RE.source}*) +\u0E32`,
      'g'
    ),
    (match, consonant: string, combiningMarks: string) => {
      // If there's already an above/below vowel, don't convert — it's likely a real "า"
      if (THAI_ABOVE_BELOW_VOWEL_RE.test(combiningMarks)) {
        return match
      }
      return consonant + combiningMarks + '\u0E33' // ำ
    }
  )

  // Step 3: Combine standalone Nikhahit (ํ) + Sara Aa (า) into Sara Am (ำ)
  // Some PDFs decompose ำ as ํ + า without spaces
  result = result.replace(/\u0E4D\u0E32/g, '\u0E33')

  return result
}

/**
 * Fix TIS-620/Windows-874 → Latin-1 mojibake.
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

export function fixGarbledThai(input: string): string {
  if (!input.trim()) return ''

  // Strategy 1: Always apply PDF spacing fixes (safe for all Thai text)
  let result = fixPdfSpacing(input)

  // Strategy 2: If text has Latin high-byte characters, try encoding fixes
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
