'use client'

import React, { useEffect } from 'react'
import { Modal, ModalContent, ModalBody, Button, addToast } from '@heroui/react'
import Icon from '@/components/icon'
import PasswordVisibilityToggle from '@/components/password-visibility-toggle'
import { registerloginRequestType } from '@/types/auth'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { mainService } from '@/api/generated/main-service'
// Replaced Alert with HeroUI toast notifications
import { isNumberOnly } from '@/utils/validate-pattern'
import Input from '../heroui/input'

type RegisterFormData = registerloginRequestType & {
  confirmPassword: string
}

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenLogin: () => void
}

export default function RegisterModal({ isOpen, onClose, onOpenLogin }: RegisterModalProps) {
  // const router = useRouter() // not used
  // const { isMobile } = useBreakpoint()

  const schema = yup.object({
    email: yup.string().email('กรุณากรอกอีเมลที่ถูกต้อง').required('กรุณากรอกอีเมล'),
    password: yup.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร').required('กรุณากรอกรหัสผ่าน'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'รหัสผ่านไม่ตรงกัน')
      .required('กรุณายืนยันรหัสผ่าน'),
    name: yup.string().required('กรุณากรอกชื่อ'),
    lastname: yup.string().required('กรุณากรอกนามสกุล'),
    phoneNumber: yup.string().min(10).required('กรุณากรอกเบอร์โทรศัพท์')
  })

  const {
    watch,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted },
    reset,
    trigger
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      lastname: '',
      phoneNumber: ''
    }
  })

  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const onSubmit: SubmitHandler<RegisterFormData> = async data => {
    try {
      const response = await mainService.auth.register({
        email: data.email,
        password: data.password,
        name: data.name,
        lastname: data.lastname,
        phoneNumber: data.phoneNumber
      })

      if (response.data && response.data.user && response.data.token) {
        onClose()
        onOpenLogin()
      } else {
        addToast({
          title: 'สมัครสมาชิกไม่สำเร็จ',
          description: 'กรุณาลองใหม่อีกครั้ง',
          color: 'danger'
        })
      }
    } catch (error: any) {
      if (error?.response?.status === 400 || error?.response?.status === 409) {
        addToast({
          title: 'อีเมลนี้ถูกใช้แล้ว',
          description: 'กรุณาใช้อีเมลอื่นในการสมัครสมาชิก',
          color: 'danger'
        })
      } else {
        addToast({
          title: 'สมัครสมาชิกไม่สำเร็จ',
          description: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
          color: 'danger'
        })
      }
    }
  }

  const handleClose = () => {
    reset()
    setShowPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  const handleSwitchToLogin = () => {
    reset()
    setShowPassword(false)
    setShowConfirmPassword(false)
    onClose()
    onOpenLogin()
  }

  const passwordValue = watch('password')
  const confirmPasswordValue = watch('confirmPassword')

  useEffect(() => {
    if (isSubmitted && (passwordValue || confirmPasswordValue)) {
      trigger('confirmPassword')
    }
  }, [isSubmitted, passwordValue, confirmPasswordValue, trigger])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement='center' backdrop='blur' size={'lg'} scrollBehavior='inside'>
      <ModalContent>
        <ModalBody className='px-8 pb-8'>
          <section className='mb-2 flex flex-col items-center px-8 pt-8'>
            <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg'>
              <Icon icon='mdi:school' width={40} height={40} className='text-white' />
            </div>
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>สมัครสมาชิก</h1>
            <p className='text-center text-sm text-gray-600'>สร้างบัญชีใหม่ Onlearn by Engenius</p>
          </section>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {/* Personal Information */}
            <div className='grid grid-cols-2 gap-4 '>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <Input
                    size='md'
                    label='ชื่อ'
                    placeholder='กรอกชื่อ'
                    variant='bordered'
                    {...field}
                    startContent={<Icon icon='mdi:account' width={18} height={18} className={errors.name ? 'text-danger' : 'text-primary'} />}
                    isInvalid={!!errors.name}
                  />
                )}
              />

              <Controller
                name='lastname'
                control={control}
                render={({ field }) => (
                  <Input
                    size='md'
                    label='นามสกุล'
                    placeholder='กรอกนามสกุล'
                    variant='bordered'
                    startIcon={'mdi:account'}
                    isInvalid={!!errors.lastname}
                    {...field}
                  />
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Controller
                name='email'
                control={control}
                render={({ field }) => (
                  <Input
                    size='md'
                    label='อีเมล'
                    type='email'
                    placeholder='กรอกอีเมล'
                    variant='bordered'
                    startIcon={'mdi:email'}
                    isInvalid={!!errors.email}
                    {...field}
                  />
                )}
              />

              <Controller
                name='phoneNumber'
                control={control}
                render={({ field }) => (
                  <Input
                    type='tel'
                    size='md'
                    label='เบอร์โทรศัพท์ (10 หลัก)'
                    placeholder='XXX-XXXX-XXXX'
                    variant='bordered'
                    startIcon='mdi:phone'
                    isInvalid={!!errors.phoneNumber}
                    maxLength={10}
                    {...field}
                    onChange={e => {
                      const rawValue = e.target.value.toUpperCase().toString()
                      const value = [...rawValue].filter(char => isNumberOnly(char)).join('')

                      field.onChange(value)
                    }}
                  />
                )}
              />
            </div>

            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <div>
                  <Input
                    size='md'
                    label='รหัสผ่าน'
                    placeholder='กรอกรหัสผ่าน'
                    type={showPassword ? 'text' : 'password'}
                    variant='bordered'
                    startIcon='mdi:lock'
                    endContent={<PasswordVisibilityToggle isVisible={showPassword} toggleVisibility={() => setShowPassword(!showPassword)} />}
                    isInvalid={!!errors.password}
                    errorMessage={errors.password?.message}
                    {...field}
                  />
                </div>
              )}
            />

            <Controller
              name='confirmPassword'
              control={control}
              render={({ field }) => (
                <div>
                  <Input
                    size='md'
                    label='ยืนยันรหัสผ่าน'
                    placeholder='ยืนยันรหัสผ่าน'
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant='bordered'
                    startIcon='mdi:lock'
                    endContent={
                      <PasswordVisibilityToggle
                        isVisible={showConfirmPassword}
                        toggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                    isInvalid={!!errors.confirmPassword}
                    errorMessage={errors.confirmPassword?.message}
                    {...field}
                  />
                </div>
              )}
            />

            <Button type='submit' color='primary' isLoading={isSubmitting} className='mt-6 w-full'>
              {isSubmitting ? <div className='flex items-center gap-2'>กำลังสร้างบัญชี...</div> : 'สร้างบัญชี'}
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
                มีบัญชีอยู่แล้ว?
                <Button
                  variant='flat'
                  size='sm'
                  onPress={handleSwitchToLogin}
                  className='ml-2 px-2 font-semibold text-primary transition-colors hover:text-primary-800'>
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
