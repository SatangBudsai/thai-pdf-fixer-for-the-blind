const fs = require('fs')
const path = require('path')
require('dotenv').config() // โหลด environment variables จากไฟล์ .env

async function fetchAndProcessSwagger(filePath, outputPath) {
  try {
    // อ่านไฟล์ Swagger JSON
    const swaggerData = fs.readFileSync(filePath, 'utf-8')

    // แปลงข้อมูล JSON เป็น object
    let swaggerJson = JSON.parse(swaggerData)

    // แก้ไขชื่อ enum ที่มีตัวเลขนำหน้า
    let swaggerString = JSON.stringify(swaggerJson, null, 2)
    swaggerString = swaggerString.replace(/"_36_/g, '"E36_')
    swaggerString = swaggerString.replace(/"#\/components\/schemas\/_36_/g, '"#/components/schemas/E36_')

    // เขียนข้อมูลที่แก้ไขแล้วกลับไปยังไฟล์
    fs.writeFileSync(outputPath, swaggerString)
    console.log('Swagger JSON has been processed and saved to', outputPath)
  } catch (error) {
    console.error('Error fetching or processing Swagger JSON:', error)
  }
}

const swaggerFilePath = path.join(__dirname, './main-service.swagger.json') // เปลี่ยน path ตรงนี้ให้ถูกต้องตามที่อยู่ไฟล์ในโปรเจกต์ของคุณ
const outputFilePath = path.join(__dirname, 'swagger-processed.json')

fetchAndProcessSwagger(swaggerFilePath, outputFilePath)
