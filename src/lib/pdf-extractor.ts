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

    if (items.length === 0) continue

    // Simple approach: concatenate item.str, use hasEOL for line breaks,
    // detect paragraph breaks from Y gaps
    let pageText = ''
    for (let j = 0; j < items.length; j++) {
      const item = items[j]
      pageText += item.str

      if (item.hasEOL) {
        // Check if next item is a paragraph break (large Y gap)
        const next = items[j + 1]
        if (next) {
          const currY = item.transform[5]
          const nextY = next.transform[5]
          const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
          const yGap = Math.abs(currY - nextY)
          if (yGap > fontSize * 1.8) {
            pageText += '\n\n'
          } else {
            pageText += '\n'
          }
        }
      }
    }

    if (pageText.trim()) pages.push(pageText.trim())
  }

  return pages.join('\n\n')
}
