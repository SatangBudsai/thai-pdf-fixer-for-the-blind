'use client'

import React from 'react'
import { useRouter } from 'next/router'
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Input, Link, Divider, addToast } from '@heroui/react'
import NextLink from 'next/link'
import Icon from '@/components/icon'
import PasswordVisibilityToggle from '@/components/password-visibility-toggle'
import { loginRequestType } from '@/types/auth'
import { ApiResponseTypeResLogin } from '@/api/generated/main-service/apiGenerated'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import useBreakpoint from '@/hooks/useBreakpoint'
import { mainService } from '@/api/generated/main-service'
import Cookies from 'js-cookie'
import { userDataAction } from '@/store/reducers/user-data'
import { useDispatch } from 'react-redux'

const schema = yup.object({
  username: yup.string().required('กรุณากรอกชื่อผู้ใช้'),
  password: yup.string().required('กรุณากรอกรหัสผ่าน')
})

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenRegister: () => void
  onOpenForgotPassword: () => void
  nextStep?: () => void
}

export default function LoginModal({ isOpen, onClose, onOpenRegister, onOpenForgotPassword, nextStep }: LoginModalProps) {
  const dispatch = useDispatch()
  const { isMobile } = useBreakpoint()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<loginRequestType>({
    resolver: yupResolver(schema)
  })

  const [showPassword, setShowPassword] = React.useState(false)

  const onSubmit: SubmitHandler<loginRequestType> = async data => {
    try {
      const response = await mainService.auth.login({
        username: data.username,
        password: data.password
      })

      if (response.data && response.data.user && response.data.token) {
        const { user, token } = response.data

        Cookies.set('token', token, { expires: 7, secure: true })

        const userData = {
          id: user.learnerId,
          email: data.username,
          name: user.name,
          lastname: user.lastname,
          phone: user.phonenumber,
          avatar: null,
          isLoggedIn: true
        }

        dispatch(userDataAction.updateState(userData))

        onClose()

        // Dispatch custom event for other components to refresh data
        globalThis.dispatchEvent(new CustomEvent('user-logged-in'))

        // Execute nextStep callback if provided
        if (nextStep) {
          nextStep()
        }
      } else {
        console.error('Login failed: Invalid response structure')
        addToast({
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          description: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',
          color: 'danger'
        })
      }
    } catch (error: any) {
      addToast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',
        color: 'danger'
      })
    }
  }

  const handleClose = () => {
    reset()
    setShowPassword(false)
    onClose()
  }

  const handleSwitchToRegister = () => {
    reset()
    setShowPassword(false)
    onClose()
    onOpenRegister()
  }

  const handleSwitchToForgotPassword = () => {
    reset()
    setShowPassword(false)
    onClose()
    onOpenForgotPassword()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement='center' backdrop='blur' size={'md'}>
      <ModalContent>
        <ModalHeader className='flex flex-col items-center px-8 pb-6 pt-8'>
          <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg'>
            <Icon icon='mdi:school' width={40} height={40} className='text-white' />
          </div>
          <h1 className='mb-2 text-3xl font-bold text-gray-900'>เข้าสู่ระบบ</h1>
          <p className='text-center text-sm text-gray-600'>กรุณาใส่ข้อมูลเพื่อเข้าสู่ระบบบัญชีของคุณ</p>
        </ModalHeader>

        <ModalBody className='px-8 pb-8'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
            <div className='space-y-4'>
              <Controller
                name='username'
                control={control}
                render={({ field }) => (
                  <Input
                    size='md'
                    label='ชื่อผู้ใช้'
                    placeholder='กรอกชื่อผู้ใช้ของคุณ'
                    variant='bordered'
                    {...field}
                    startContent={<Icon icon='mdi:account' width={18} height={18} className={!!errors.username ? 'text-danger' : 'text-primary'} />}
                    isInvalid={!!errors.username}
                    errorMessage={errors.username?.message}
                  />
                )}
              />
              <Controller
                name='password'
                control={control}
                render={({ field }) => (
                  <Input
                    size='md'
                    label='รหัสผ่าน'
                    placeholder='กรอกรหัสผ่านของคุณ'
                    type={showPassword ? 'text' : 'password'}
                    variant='bordered'
                    {...field}
                    startContent={<Icon icon='mdi:lock' width={18} height={18} className={!!errors.password ? 'text-danger' : 'text-primary'} />}
                    endContent={<PasswordVisibilityToggle isVisible={showPassword} toggleVisibility={() => setShowPassword(!showPassword)} />}
                    isInvalid={!!errors.password}
                    errorMessage={errors.password?.message}
                  />
                )}
              />
            </div>

            <div className='flex items-center justify-end'>
              <Button
                variant='light'
                size='sm'
                onPress={handleSwitchToForgotPassword}
                className='font-medium text-primary transition-colors hover:text-primary-800'>
                ลืมรหัสผ่าน?
              </Button>
            </div>

            <Button type='submit' color='primary' isLoading={isSubmitting} className='w-full'>
              {isSubmitting ? <div className='flex items-center gap-2'>กำลังเข้าสู่ระบบ...</div> : 'เข้าสู่ระบบ'}
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
                ยังไม่มีบัญชี?
                <Button
                  variant='flat'
                  size='sm'
                  onPress={handleSwitchToRegister}
                  className='ml-2 px-2 font-semibold text-primary transition-colors hover:text-primary-800'>
                  สมัครสมาชิก
                </Button>
              </p>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
