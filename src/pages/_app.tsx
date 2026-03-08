import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Sarabun } from 'next/font/google'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '700'],
  display: 'swap'
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={sarabun.className}>
      <Component {...pageProps} />
    </div>
  )
}
