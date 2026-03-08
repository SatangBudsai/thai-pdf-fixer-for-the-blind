/**
 * Thai word segmentation:
 *   1. PyThaiNLP backend (best, ~95%) — if server is running
 *   2. Intl.Segmenter fallback (~85-90%) — client-side, no server needed
 *
 * Pre-processing: strips spaces between Thai chars (PDF artifacts) before
 * segmenting, so "อา กาศ" → "อากาศ" → then segments correctly.
 */

const API_URL = process.env.NEXT_PUBLIC_SEGMENT_API || 'http://localhost:8000'

const RE_THAI = /[\u0E00-\u0E7F]/

/**
 * Remove spaces between Thai characters — these are PDF extraction artifacts.
 */
function stripThaiSpaces(text: string): string {
  return text
    .split('\n')
    .map(line => {
      let result = line
      let prev = ''
      while (prev !== result) {
        prev = result
        result = result.replaceAll(/([\u0E00-\u0E7F]) ([\u0E00-\u0E7F])/g, '$1$2')
      }
      return result
    })
    .join('\n')
}

/**
 * Fallback: use browser's Intl.Segmenter for Thai word segmentation.
 * Not as accurate as PyThaiNLP but much better than no segmentation.
 */
function segmentWithIntl(text: string): string {
  if (typeof Intl?.Segmenter === 'undefined') return text

  const segmenter = new Intl.Segmenter('th', { granularity: 'word' })

  return text
    .split('\n')
    .map(line => {
      if (!line.trim()) return line

      const segments = [...segmenter.segment(line)]
      let result = ''

      for (const seg of segments) {
        const word = seg.segment

        if (!result) {
          result = word
          continue
        }

        const lastChar = result.at(-1) ?? ''
        const firstChar = word[0] ?? ''

        // Add space between Thai words (not before punctuation/spaces)
        if (
          RE_THAI.test(lastChar) &&
          RE_THAI.test(firstChar) &&
          seg.isWordLike
        ) {
          result += ' ' + word
        } else {
          result += word
        }
      }

      return result
    })
    .join('\n')
}

export async function segmentThai(text: string): Promise<string> {
  const cleaned = stripThaiSpaces(text)

  try {
    const res = await fetch(`${API_URL}/segment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleaned, engine: 'newmm' }),
      signal: AbortSignal.timeout(10000)
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    return data.segmented
  } catch {
    // Backend unavailable — fallback to Intl.Segmenter
    return segmentWithIntl(cleaned)
  }
}
