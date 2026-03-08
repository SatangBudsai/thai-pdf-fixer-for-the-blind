import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="เครื่องมือแก้ไขข้อความภาษาไทยที่อ่านไม่ออกจากไฟล์ PDF สำหรับผู้พิการทางสายตา" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="bg-black text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
