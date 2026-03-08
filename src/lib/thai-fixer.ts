/**
 * Fix garbled Thai text from PDFs.
 *
 * Handles three main garbling patterns:
 *
 * 1. PDF text extraction spacing artifacts:
 *    - Spaces inserted before Thai combining characters (่ ้ ็ ์ ั ิ ี ึ ื ุ ู etc.)
 *    - Sara Am (ำ) decomposed with space: "ท า" → "ทำ"
 *    - Nikhahit (ํ) + Sara Aa (า) not combined into Sara Am (ำ)
 *    - Multiple spaces from line-break joins
 *    - Spaces around hyphens: "C - 17" → "C-17"
 *
 * 2. Lost Sara Am (ำ → า) without spaces:
 *    - Nikhahit completely lost: "ทาตาม" → "ทำตาม", "สาคัญ" → "สำคัญ"
 *    - Uses Intl.Segmenter to detect whether า should be ำ
 *    - Covers ALL Thai words (browser built-in dictionary)
 *
 * 3. TIS-620 / Windows-874 encoding misread as Latin-1 (mojibake):
 *    - Bytes in 0xA1-0xFB mapped back to Thai Unicode U+0E01-U+0E5B
 */

// Thai combining characters
const THAI_COMBINING_RE = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/

// Thai consonants: U+0E01-U+0E2E
const THAI_CONSONANT_RE = /[\u0E01-\u0E2E]/

// Thai above/below vowels: U+0E34-U+0E39 (ิ ี ึ ื ุ ู)
const THAI_ABOVE_BELOW_VOWEL_RE = /[\u0E34-\u0E39]/

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
 * Count word-like segments using Intl.Segmenter.
 * Fewer segments generally means better word boundaries (more recognized words).
 */
function countWordSegments(text: string): number {
  const segmenter = new Intl.Segmenter('th', { granularity: 'word' })
  let count = 0
  for (const seg of segmenter.segment(text)) {
    if (seg.isWordLike) count++
  }
  return count
}

/**
 * Fix lost Sara Am using Intl.Segmenter for Thai word boundary detection.
 * When PDFs completely lose the nikhahit, ำ becomes า without any space.
 *
 * Algorithm: Find each Thai consonant + า sequence. Try replacing า with ำ.
 * If the ำ version produces fewer word-like segments (= better recognized words),
 * keep the ำ version. This covers ALL Thai words via the browser's built-in dictionary.
 */
function fixLostSaraAm(text: string): string {
  if (typeof Intl?.Segmenter !== 'function') return text

  // Match: Thai consonant (optionally with tone/combining marks) followed by า (Sara Aa)
  // We need to check each occurrence and decide if it should be ำ (Sara Am)
  const SARA_AA = '\u0E32' // า
  const SARA_AM = '\u0E33' // ำ

  // Find all positions of า that follow a Thai consonant (with optional combining marks)
  const pattern = new RegExp(
    `(${THAI_CONSONANT_RE.source})(${THAI_COMBINING_RE.source}*)${SARA_AA}`,
    'g'
  )

  // Collect all match positions first
  const matches: { index: number; length: number; consonant: string; marks: string }[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(text)) !== null) {
    // Skip if there are above/below vowels in the combining marks (can't be ำ)
    if (THAI_ABOVE_BELOW_VOWEL_RE.test(m[2])) continue
    matches.push({
      index: m.index,
      length: m[0].length,
      consonant: m[1],
      marks: m[2]
    })
  }

  if (matches.length === 0) return text

  // Process each match: extract a context window around each า and test า vs ำ
  const result = text.split('')
  for (const match of matches) {
    // Extract a context window around this position for segmentation comparison
    const contextStart = Math.max(0, match.index - 10)
    const contextEnd = Math.min(text.length, match.index + match.length + 10)

    const originalChunk = text.slice(contextStart, contextEnd)
    const modifiedChunk =
      text.slice(contextStart, match.index) +
      match.consonant + match.marks + SARA_AM +
      text.slice(match.index + match.length, contextEnd)

    const originalSegments = countWordSegments(originalChunk)
    const modifiedSegments = countWordSegments(modifiedChunk)

    // If ำ version produces fewer word segments, it's a better match
    if (modifiedSegments < originalSegments) {
      // Replace า with ำ at this position
      const saraAaPos = match.index + match.consonant.length + match.marks.length
      result[saraAaPos] = SARA_AM
    }
  }

  return result.join('')
}

/**
 * Normalize multiple spaces and fix spacing artifacts from PDF line breaks.
 */
function fixSpacingArtifacts(text: string): string {
  let result = text

  // Collapse all runs of 2+ spaces to a single space.
  result = result.replace(/ {2,}/g, ' ')

  // Spaces around hyphens in alphanumeric context: "C - 17" → "C-17"
  result = result.replace(/([A-Za-z0-9]) +- +([A-Za-z0-9])/g, '$1-$2')

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

  // Step 1: Fix spaces before combining marks and decomposed Sara Am (with spaces)
  let result = fixPdfSpacing(input)

  // Step 2: Fix spacing artifacts (multiple spaces, hyphens)
  result = fixSpacingArtifacts(result)

  // Step 3: Fix lost Sara Am using dictionary (า → ำ without spaces)
  result = fixLostSaraAm(result)

  // Step 4: If text has Latin high-byte characters, try encoding fixes
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
