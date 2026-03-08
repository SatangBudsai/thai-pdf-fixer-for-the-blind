'use client'

import { HeroUIProvider as NextProvider, ToastProvider } from '@heroui/react'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/navigation'

export default function HeroUIProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <NextProvider navigate={router.push}>
      <ThemeProvider attribute='class' defaultTheme='light'>
        <ToastProvider placement='top-right' toastProps={{ variant: 'flat' }} />
        {children}
      </ThemeProvider>
    </NextProvider>
  )
}
