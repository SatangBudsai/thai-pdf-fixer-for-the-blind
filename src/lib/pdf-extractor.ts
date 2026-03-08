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

    // disableNormalization gives us more granular text items
    const textContent = await page.getTextContent({ disableNormalization: true })

    const items = textContent.items.filter(
      (item): item is TextItem => 'str' in item && item.str.length > 0
    )

    if (items.length === 0) continue
    pages.push(buildPageText(items))
  }

  return pages.join('\n\n')
}

interface Chunk {
  str: string
  x: number
  y: number
  endX: number
  fontSize: number
}

/**
 * Build text from PDF items by reading their exact positions.
 *
 * 1. Convert items to positioned chunks
 * 2. Group into lines by Y position
 * 3. Sort each line left-to-right
 * 4. Insert space when there's a gap ≥ half a space width
 * 5. Insert newlines between lines, double newline for paragraphs
 */
function buildPageText(items: TextItem[]): string {
  // Convert to simple chunks with position info
  const chunks: Chunk[] = items.map(item => {
    const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
    return {
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      endX: item.transform[4] + item.width,
      fontSize,
    }
  })

  // Group into lines: items with similar Y are on the same line
  const lines: Chunk[][] = []
  let currentLine: Chunk[] = []
  let lineY = chunks[0]?.y ?? 0

  // Sort by Y descending (PDF coords: Y=0 at bottom), then X ascending
  const sorted = [...chunks].sort((a, b) => {
    const yDiff = b.y - a.y
    if (Math.abs(yDiff) > a.fontSize * 0.3) return yDiff > 0 ? -1 : 1
    return a.x - b.x
  })

  for (const chunk of sorted) {
    if (currentLine.length === 0) {
      currentLine.push(chunk)
      lineY = chunk.y
    } else if (Math.abs(chunk.y - lineY) <= chunk.fontSize * 0.3) {
      // Same line
      currentLine.push(chunk)
    } else {
      // New line
      lines.push(currentLine)
      currentLine = [chunk]
      lineY = chunk.y
    }
  }
  if (currentLine.length > 0) lines.push(currentLine)

  // Build text from lines
  const textLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Sort left-to-right within line
    line.sort((a, b) => a.x - b.x)

    let lineText = ''
    for (let j = 0; j < line.length; j++) {
      const chunk = line[j]

      if (j > 0) {
        const prev = line[j - 1]
        const gap = chunk.x - prev.endX
        // A space is roughly 0.25× font size.
        // Use 0.1× as threshold to catch even narrow spaces.
        const spaceThreshold = chunk.fontSize * 0.1
        if (gap >= spaceThreshold) {
          lineText += ' '
        }
      }

      lineText += chunk.str
    }

    // Detect paragraph break vs line break
    if (i > 0) {
      const prevLine = lines[i - 1]
      const prevY = prevLine[0].y
      const currY = line[0].y
      const fontSize = prevLine[0].fontSize
      const yGap = Math.abs(prevY - currY)

      if (yGap > fontSize * 1.8) {
        textLines.push('') // empty line = paragraph break
      }
    }

    textLines.push(lineText)
  }

  return textLines.join('\n')
}
