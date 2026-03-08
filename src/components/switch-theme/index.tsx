'use client'

import React, { Fragment } from 'react'
import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react'
import { Button } from "@heroui/react"

const SwitchTheme = () => {
  const { setTheme } = useTheme()

  return (
    <Fragment>
      <div className='relative flex'>
        <Button
          isIconOnly
          variant='light'
          color='primary'
          className='absolute scale-100 opacity-100 transition-all dark:scale-0 dark:opacity-0'
          onClick={() => setTheme('dark')}>
          <Icon icon='mingcute:sun-fill' className='h-6 w-6 rotate-0 transition-all dark:-rotate-90' />
        </Button>
        <Button
          isIconOnly
          color='primary'
          variant='light'
          onClick={() => setTheme('light')}
          className='scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100'>
          <Icon icon='ph:moon-fill' className='h-6 w-6 rotate-90 transition-all dark:rotate-0' />
        </Button>
      </div>
    </Fragment>
  )
}

export default SwitchTheme
