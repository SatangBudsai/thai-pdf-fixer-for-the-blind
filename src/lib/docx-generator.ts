import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'

export async function downloadAsDocx(text: string, filename = 'fixed-thai-text'): Promise<void> {
  const paragraphs = text.split('\n').map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ',
            font: 'TH SarabunPSK',
            size: 32
          })
        ]
      })
  )

  const doc = new Document({
    sections: [{ children: paragraphs }]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${filename}.docx`)
}
