'use client'

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import ForgotPasswordModal from './ForgotPasswordModal'

type ModalType = 'login' | 'register' | 'forgot-password' | null

interface AuthModalContextType {
  openModal: (type: ModalType, nextStep?: () => void) => void
  closeModal: () => void
  currentModal: ModalType
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export const useAuthModal = () => {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}

interface AuthModalProviderProps {
  children: React.ReactNode
}

export const AuthModalProvider: React.FC<AuthModalProviderProps> = ({ children }) => {
  const [currentModal, setCurrentModal] = useState<ModalType>(null)
  const [nextStepCallback, setNextStepCallback] = useState<(() => void) | undefined>(undefined)

  const openModal = useCallback((type: ModalType, nextStep?: () => void) => {
    setCurrentModal(type)
    setNextStepCallback(() => nextStep)
  }, [])

  const closeModal = useCallback(() => {
    setCurrentModal(null)
    setNextStepCallback(undefined)
  }, [])

  const handleOpenLogin = () => openModal('login')
  const handleOpenRegister = () => openModal('register')
  const handleOpenForgotPassword = () => openModal('forgot-password')

  const contextValue = useMemo(
    () => ({
      openModal,
      closeModal,
      currentModal
    }),
    [openModal, closeModal, currentModal]
  )

  return (
    <AuthModalContext.Provider value={contextValue}>
      {children}

      <LoginModal
        isOpen={currentModal === 'login'}
        onClose={closeModal}
        onOpenRegister={handleOpenRegister}
        onOpenForgotPassword={handleOpenForgotPassword}
        nextStep={nextStepCallback}
      />

      <RegisterModal isOpen={currentModal === 'register'} onClose={closeModal} onOpenLogin={handleOpenLogin} />

      <ForgotPasswordModal
        isOpen={currentModal === 'forgot-password'}
        onClose={closeModal}
        onOpenLogin={handleOpenLogin}
      />
    </AuthModalContext.Provider>
  )
}
