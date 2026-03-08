import * as pdfjsLib from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

// Use local worker for offline PWA support
if (globalThis.window !== undefined) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

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
    // disableNormalization keeps items granular so we can detect gaps for spaces
    const textContent = await page.getTextContent({ disableNormalization: true })

    const items = textContent.items.filter(
      (item): item is TextItem => 'str' in item && item.str.length > 0
    )

    if (items.length === 0) continue
    pages.push(buildPageText(items))
  }

  return pages.join('\n\n')
}

/**
 * Build text from PDF items in pdfjs reading order (no re-sorting).
 * - Line breaks: from hasEOL flag
 * - Paragraph breaks: from large Y gaps (> 1.8× font size)
 * - Spaces: from horizontal gaps between items on the same line
 */
function buildPageText(items: TextItem[]): string {
  let result = ''

  for (let j = 0; j < items.length; j++) {
    const item = items[j]
    const prev = j > 0 ? items[j - 1] : null

    if (prev) {
      const prevY = prev.transform[5]
      const currY = item.transform[5]
      const fontSize =
        Math.abs(prev.transform[0]) || Math.abs(prev.transform[3]) || 12
      const yDiff = Math.abs(prevY - currY)

      if (yDiff > fontSize * 0.3) {
        // Different line — detect paragraph break vs line break
        if (yDiff > fontSize * 1.8) {
          result += '\n\n'
        } else {
          result += '\n'
        }
      } else {
        // Same line — check horizontal gap for space (เว้นวรรค)
        const prevEndX = prev.transform[4] + prev.width
        const currX = item.transform[4]
        const gap = currX - prevEndX

        if (gap > fontSize * 0.1) {
          result += ' '
        }
      }
    }

    result += item.str
  }

  return result
}
