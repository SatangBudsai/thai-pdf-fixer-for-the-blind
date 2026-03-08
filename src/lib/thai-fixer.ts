/**
 * Fix garbled Thai text caused by encoding misinterpretation.
 *
 * Common problem: Thai text encoded in TIS-620 / Windows-874
 * is decoded as ISO-8859-1 (Latin-1), producing mojibake.
 *
 * The fix reverses this: take each Latin-1 byte in the 0xA1-0xFB range
 * and map it back to the corresponding Thai Unicode character (U+0E01-U+0E5B).
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
  // Windows-874 is a superset of TIS-620 with extra characters in 0x80-0xA0
  const win874Extras: Record<number, number> = {
    0x80: 0x20ac, // Euro sign
    0x85: 0x2026, // Horizontal ellipsis
    0x91: 0x2018, // Left single quotation mark
    0x92: 0x2019, // Right single quotation mark
    0x93: 0x201c, // Left double quotation mark
    0x94: 0x201d, // Right double quotation mark
    0x95: 0x2022, // Bullet
    0x96: 0x2013, // En dash
    0x97: 0x2014 // Em dash
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
    if (code >= 0x0e01 && code <= 0x0e5b) {
      count++
    }
  }
  return count
}

function isAlreadyThai(text: string): boolean {
  const thaiCount = countThaiChars(text)
  const nonSpaceLength = text.replace(/\s/g, '').length
  return nonSpaceLength > 0 && thaiCount / nonSpaceLength > 0.3
}

export function fixGarbledThai(input: string): string {
  if (!input.trim()) return ''

  // If text already contains significant Thai characters, return as-is
  if (isAlreadyThai(input)) return input

  // Try multiple strategies and pick the best result
  const strategies = [
    { name: 'TIS-620', fn: tis620ToUnicode },
    { name: 'Windows-874', fn: windows874ToUnicode }
  ]

  let bestResult = input
  let bestScore = countThaiChars(input)

  for (const strategy of strategies) {
    const result = strategy.fn(input)
    const score = countThaiChars(result)
    if (score > bestScore) {
      bestScore = score
      bestResult = result
    }
  }

  return bestResult
}
