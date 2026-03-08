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
 * Join text items using hasEOL for line breaks and position gaps for spaces.
 *
 * pdfjs provides items in reading order (top-to-bottom, left-to-right).
 * Each item has hasEOL indicating if it ends a line in the PDF.
 * We use horizontal gaps between items to detect inter-word spaces.
 */
function joinItems(items: TextItem[]): string {
  let result = ''

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const prevItem = i > 0 ? items[i - 1] : null

    if (prevItem) {
      if (prevItem.hasEOL) {
        // Previous item ended a line — check if this is a paragraph break
        const prevY = prevItem.transform[5]
        const currY = item.transform[5]
        const prevFontSize = Math.abs(prevItem.transform[0]) || Math.abs(prevItem.transform[3]) || 12
        const yGap = Math.abs(prevY - currY)

        if (yGap > prevFontSize * 1.8) {
          result += '\n\n' // paragraph break
        } else {
          result += '\n' // line break
        }
      } else {
        // Same line — check horizontal gap for spaces
        const prevEndX = prevItem.transform[4] + prevItem.width
        const currX = item.transform[4]
        const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
        const gap = currX - prevEndX

        if (gap > fontSize * 0.3) {
          result += ' '
        }
        // If gap ≤ 0 (adjacent/overlapping), concatenate directly
      }
    }

    result += item.str
  }

  return result
}
