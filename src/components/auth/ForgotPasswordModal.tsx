'use client'

import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Input, addToast } from '@heroui/react'
import Icon from '@/components/icon'
import { forgotPasswordloginRequestType } from '@/types/auth'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useBreakpoint from '@/hooks/useBreakpoint'
import { mainService } from '@/api/generated/main-service'

const schema = yup.object({
  email: yup.string().email('กรุณากรอกอีเมลที่ถูกต้อง').required('กรุณากรอกอีเมล')
})

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenLogin: () => void
}

export default function ForgotPasswordModal({ isOpen, onClose, onOpenLogin }: ForgotPasswordModalProps) {
  const { isMobile } = useBreakpoint()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<forgotPasswordloginRequestType>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: ''
    }
  })

  const [isSuccess, setIsSuccess] = React.useState(false)

  const onSubmit: SubmitHandler<forgotPasswordloginRequestType> = async data => {
    try {
      console.log('Forgot password data:', data)

      // Call actual API
      const response = await mainService.auth.forgotPassword({
        email: data.email
      })

      // Check if the API call was successful
      if (response.data) {
        console.log('Forgot password email sent:', response.data)
        setIsSuccess(true)
      } else {
        console.error('Failed to send reset email')
        addToast({
          title: 'ส่งอีเมลไม่สำเร็จ',
          description: 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้ กรุณาลองใหม่',
          color: 'danger'
        })
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      const message = error?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      addToast({
        title: 'ส่งอีเมลไม่สำเร็จ',
        description: message,
        color: 'danger'
      })
    }
  }

  const handleClose = () => {
    reset()
    setIsSuccess(false)
    onClose()
  }

  const handleSwitchToLogin = () => {
    reset()
    setIsSuccess(false)
    onClose()
    onOpenLogin()
  }

  const handleBackToForm = () => {
    setIsSuccess(false)
    reset()
  }

  if (isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} placement='center' backdrop='blur' size={isMobile ? 'full' : 'md'}>
        <ModalContent>
          <ModalHeader className='flex flex-col items-center px-8 pb-6 pt-8'>
            <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-success shadow-lg'>
              <Icon icon='mdi:email-check' width={40} height={40} className='text-white' />
            </div>
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>ตรวจสอบอีเมลของคุณ</h1>
            <p className='text-center text-sm text-gray-600'>เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว</p>
          </ModalHeader>

          <ModalBody className='px-8 pb-8 text-center'>
            <p className='mb-6 text-gray-600'>กรุณาตรวจสอบกล่องจดหมายของคุณและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน</p>

            <div className='space-y-3'>
              <Button color='primary' className='w-full' onPress={handleSwitchToLogin}>
                กลับไปหน้าเข้าสู่ระบบ
              </Button>

              <Button variant='light' className='w-full text-gray-500 hover:text-gray-700' onPress={handleBackToForm}>
                ส่งอีเมลอีกครั้ง
              </Button>

              <Button variant='light' size='sm' onPress={handleClose} className='text-gray-500 hover:text-gray-700'>
                ปิด
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement='center' backdrop='blur' size={'md'}>
      <ModalContent>
        <ModalHeader className='flex flex-col items-center px-8 pb-6 pt-8'>
          <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg'>
            <Icon icon='mdi:lock-reset' width={40} height={40} className='text-white' />
          </div>
          <h1 className='mb-2 text-3xl font-bold text-gray-900'>ลืมรหัสผ่าน</h1>
          <p className='text-center text-sm text-gray-600'>กรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน</p>
        </ModalHeader>

        <ModalBody className='px-8 pb-8'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <Input
                  size='md'
                  label='อีเมล'
                  type='email'
                  placeholder='กรอกอีเมลของคุณ'
                  variant='bordered'
                  {...field}
                  startContent={
                    <Icon
                      icon='mdi:email'
                      width={20}
                      height={20}
                      className={errors.email ? 'text-danger' : 'text-primary'}
                    />
                  }
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              )}
            />

            <Button type='submit' color='primary' isLoading={isSubmitting} className='w-full'>
              {isSubmitting ? (
                <div className='flex items-center gap-2'>กำลังส่งอีเมล...</div>
              ) : (
                'ส่งลิงก์รีเซ็ตรหัสผ่าน'
              )}
            </Button>

            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-200'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='bg-white px-4 text-gray-500'>หรือ</span>
              </div>
            </div>

            <div className='text-center'>
              <p className='text-gray-600'>
                จำรหัสผ่านได้แล้ว?
                <Button
                  variant='flat'
                  size='sm'
                  onPress={handleSwitchToLogin}
                  className='ml-2 p-0 font-semibold text-primary transition-colors hover:text-primary-800'>
                  เข้าสู่ระบบ
                </Button>
              </p>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
