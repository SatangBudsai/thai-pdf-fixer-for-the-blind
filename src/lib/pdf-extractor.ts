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
      (item): item is TextItem => 'str' in item
    )

    if (items.length === 0) {
      pages.push('')
      continue
    }

    // Position-aware text joining:
    // Instead of blindly joining with spaces, use the transform matrix
    // to detect when items are adjacent (no space needed) vs separated.
    // This prevents inserting spaces between Thai consonants and combining marks.
    let pageText = ''

    for (let j = 0; j < items.length; j++) {
      const item = items[j]

      if (j === 0) {
        pageText += item.str
        continue
      }

      const prev = items[j - 1]

      // transform = [scaleX, skewY, skewX, scaleY, translateX, translateY]
      const prevY = prev.transform[5]
      const currY = item.transform[5]
      const lineHeight = Math.abs(prev.transform[3]) || Math.abs(prev.height) || 12

      // Different line? (Y position differs significantly)
      if (prev.hasEOL || Math.abs(prevY - currY) > lineHeight * 0.3) {
        pageText += '\n' + item.str
        continue
      }

      // Same line — check horizontal gap
      const prevEndX = prev.transform[4] + prev.width
      const currStartX = item.transform[4]
      const avgCharWidth = prev.str.length > 0
        ? prev.width / prev.str.length
        : lineHeight * 0.5

      const gap = currStartX - prevEndX

      // If items overlap or are very close, join without space.
      // This is critical for Thai combining marks that PDF renders
      // as separate text items with near-zero gap.
      if (gap < avgCharWidth * 0.3) {
        pageText += item.str
      } else {
        pageText += ' ' + item.str
      }
    }

    pages.push(pageText)
  }

  return pages.join('\n\n')
}
