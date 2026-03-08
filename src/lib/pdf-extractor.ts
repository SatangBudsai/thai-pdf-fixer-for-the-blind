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

    // DEBUG: log first page's text items
    if (i === 1) {
      console.log('=== FIRST 20 TEXT ITEMS ===')
      items.slice(0, 20).forEach((item, idx) => {
        console.log(`Item ${idx}: str="${item.str}" width=${item.width} hasEOL=${item.hasEOL} x=${item.transform[4].toFixed(1)} y=${item.transform[5].toFixed(1)} fontSize=${(Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12).toFixed(1)}`)
      })
      console.log('=== END ITEMS ===')
    }

    pages.push(joinItems(items))
  }

  return pages.join('\n\n')
}

/**
 * Join text items preserving the PDF's original formatting exactly:
 * - Line breaks: from Y position changes (matches PDF lines exactly)
 * - Paragraph breaks: from large Y gaps (> 1.8x font size)
 * - Spaces: from horizontal gaps (preserves เว้นวรรค exactly as in PDF)
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
          result += '\n' // line break — preserve PDF lines exactly
        }
      } else {
        // Same line — check horizontal gap for spaces
        const prevEndX = prevItem.transform[4] + prevItem.width
        const currX = item.transform[4]
        const fontSize =
          Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
        const gap = currX - prevEndX

        // Add space if there's a meaningful gap (preserves PDF spacing exactly)
        if (gap > fontSize * 0.15) {
          result += ' '
        }
      }
    }

    result += item.str
  }

  return result
}
