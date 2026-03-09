import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <meta name="theme-color" content="#fafaf9" />
        <meta name="description" content="แปลงไฟล์ PDF ภาษาไทยเป็น Word พร้อมแก้ไขตัวอักษรสำหรับผู้พิการทางสายตา" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="bg-stone-50 text-stone-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
