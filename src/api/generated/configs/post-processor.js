const fs = require('fs')
const path = require('path')

function processGeneratedFiles(directory) {
  const files = fs.readdirSync(directory)

  files.forEach(file => {
    const filePath = path.join(directory, file)

    // Skip directories
    if (fs.lstatSync(filePath).isDirectory()) {
      return
    }

    let fileContent = fs.readFileSync(filePath, 'utf-8')

    // Replace type PrismaJsonObject with interface
    fileContent = fileContent.replace(
      /export type PrismaJsonObject = Record<string, PrismaJsonValue>/g,
      `export interface PrismaJsonObject extends Record<string, PrismaJsonValue> {}`
    )

    // Update PrismaJsonArray type
    fileContent = fileContent.replace(
      /export type PrismaJsonArray = object/g,
      `export type PrismaJsonArray = PrismaJsonValue[] | object`
    )

    fs.writeFileSync(filePath, fileContent)
  })
}

const generatedDirs = [
  path.join(__dirname, '../../generated/main-service')
  // Add more directories as needed
]

generatedDirs.forEach(directory => {
  processGeneratedFiles(directory)
})

console.log('Post processing complete.')
