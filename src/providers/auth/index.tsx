'use client'

import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useDispatch, useSelector } from 'react-redux'
import { mainService } from '@/api/generated/main-service'
import { userDataAction } from '@/store/reducers/user-data'
import { StateType } from '@/store'
import Alert from '@/components/alert'
import { Cookie } from 'next/font/google'

type Props = {
  children: React.ReactNode
  isAuth: boolean
}

const AuthGuard = (props: Props) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const userDataReducer = useSelector((state: StateType) => state.userDataReducer)
  const [isLoading, setLoading] = useState(true)

  const handleCheckAuth = async () => {
    const token = Cookies.get('token') || Cookies.get('next-auth.session-token')
    console.log('🚀 ~ handleCheckAuth ~ token:', token)

    if (token && !userDataReducer.isLoggedIn) {
      try {
        const response = await mainService.auth.verifytoken()
        if (response.data) {
          const userData = {
            id: response.data.learnerId,
            email: response.data?.email,
            name: response.data?.name,
            lastname: response.data?.lastname,
            phone: response.data?.phoneNumber,
            avatar: null,
            isLoggedIn: true
          }

          dispatch(userDataAction.updateState(userData))
          setLoading(false)
        }
      } catch (error) {
        console.error('Token verification failed:', error)
        Cookies.remove('token')
        dispatch(userDataAction.resetState())
      }
    }

    if (!token && props.isAuth) {
      router.push('/')
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleCheckAuth()
  }, [router.asPath])

  if (isLoading) {
    return null // Or you can return a loading
  } else {
    return props.children
  }
}

export default AuthGuard
