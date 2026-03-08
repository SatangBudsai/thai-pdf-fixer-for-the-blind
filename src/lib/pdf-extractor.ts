import * as pdfjsLib from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

// Use local worker for offline PWA support
if (globalThis.window !== undefined) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

const RE_THAI = /[\u0E00-\u0E7F]/

export async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const totalPages = pdf.numPages
  const pages: string[] = []

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(i, totalPages)
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    const items = textContent.items.filter(
      (item): item is TextItem => 'str' in item && item.str.length > 0
    )

    if (items.length === 0) continue
    pages.push(joinItems(items))
  }

  return pages.join('\n\n')
}

/**
 * Join text items preserving the PDF's original formatting:
 * - Line breaks: from Y position changes (matches PDF lines exactly)
 * - Paragraph breaks: from large Y gaps (> 1.8x font size)
 * - Thai text: concatenate adjacent items WITHOUT inserting spaces
 *   (Thai doesn't use spaces between words; spaces would be artifacts)
 * - Non-Thai text: use horizontal gap detection for spaces
 */
function joinItems(items: TextItem[]): string {
  let result = ''

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const prevItem = i > 0 ? items[i - 1] : null

    if (prevItem) {
      const prevY = prevItem.transform[5]
      const currY = item.transform[5]
      const prevFontSize =
        Math.abs(prevItem.transform[0]) || Math.abs(prevItem.transform[3]) || 12
      const yGap = Math.abs(prevY - currY)

      if (prevItem.hasEOL || yGap > prevFontSize * 0.5) {
        // Line or paragraph break detected from Y position change
        if (yGap > prevFontSize * 1.8) {
          result += '\n\n' // paragraph break
        } else {
          // Same paragraph, new line — for Thai text, just concatenate
          // (PDF line breaks within a paragraph don't mean word breaks)
          const lastChar = result.at(-1) ?? ''
          const firstChar = item.str[0] ?? ''

          if (RE_THAI.test(lastChar) && RE_THAI.test(firstChar)) {
            // Thai continues on next line — no space or newline
            // (the PDF just wraps, not a real break)
          } else if (RE_THAI.test(lastChar) || RE_THAI.test(firstChar)) {
            // Mixed Thai/non-Thai at line break
            result += ' '
          } else {
            // Non-Thai: preserve line break as space
            result += '\n'
          }
        }
      } else {
        // Same line — check horizontal gap
        const prevEndX = prevItem.transform[4] + prevItem.width
        const currX = item.transform[4]
        const fontSize =
          Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
        const gap = currX - prevEndX

        const lastChar = result.at(-1) ?? ''
        const firstChar = item.str[0] ?? ''

        if (RE_THAI.test(lastChar) && RE_THAI.test(firstChar)) {
          // Both Thai: only add space for LARGE gaps (real word breaks in PDF)
          if (gap > fontSize * 0.5) {
            result += ' '
          }
        } else if (gap > fontSize * 0.3) {
          // Non-Thai or mixed: standard gap detection
          result += ' '
        }
      }
    }

    result += item.str
  }

  return result
}
