'use client'

import React, { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { Divider } from '@heroui/react'
import Icon from '@/components/icon'
import { useDispatch, useSelector } from 'react-redux'
import { StateType } from '@/store'
import { userDataAction } from '@/store/reducers/user-data'
import Cookies from 'js-cookie'
import Avvvatars from 'avvvatars-react'

type Props = {
  children: ReactNode
}

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'mdi:view-dashboard-outline'
  },
  {
    href: '/students',
    label: 'ค้นหานักเรียน',
    icon: 'mdi:account-search-outline'
  },
  {
    href: '/news-stats',
    label: 'สถิติข่าว',
    icon: 'mdi:newspaper-variant-outline'
  }
]

export default function SidebarLayout({ children }: Props) {
  const router = useRouter()
  const dispatch = useDispatch()
  const userData = useSelector((state: StateType) => state.userDataReducer)

  const isActive = (path: string) => {
    if (path === '/dashboard') return router.pathname === '/dashboard'
    return router.pathname.startsWith(path)
  }

  const handleLogout = () => {
    Cookies.remove('token')
    dispatch(userDataAction.resetState())
    router.push('/')
  }

  return (
    <div className='flex min-h-dvh'>
      {/* Sidebar */}
      <aside className='fixed bottom-0 left-0 top-0 z-50 flex w-[240px] flex-col bg-white border-r border-default-200'>
        {/* Logo */}
        <div className='flex h-[64px] items-center gap-3 px-6'>
          <img src='/images/engenius/logo.png' alt='Onlearn Logo' className='h-9 w-9 flex-shrink-0 rounded-lg object-contain' />
          <div>
            <p className='text-[15px] font-bold text-default-900'>Onlearn</p>
            <p className='text-[10px] font-medium text-default-400'>Admin Panel</p>
          </div>
        </div>

        <Divider className='bg-default-100' />

        {/* Navigation */}
        <nav className='flex-1 overflow-y-auto px-3 py-5'>
          <p className='mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-default-300'>เมนูหลัก</p>
          <div className='flex flex-col gap-0.5'>
            {menuItems.map(item => {
              const active = isActive(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-default-500 hover:bg-default-100 hover:text-default-900'
                  }`}>
                  <Icon icon={active ? item.icon.replace('-outline', '') : item.icon} width={18} height={18} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className='border-t border-default-100 px-4 py-4'>
          <div className='flex items-center gap-3'>
            <div className='h-9 w-9 flex-shrink-0 overflow-hidden rounded-full'>
              <Avvvatars value={userData.email || userData.name || 'Admin'} style='character' size={36} />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-[13px] font-semibold text-default-800'>{userData.name || 'Admin'}</p>
              <p className='truncate text-[11px] text-default-400'>{userData.email || 'ผู้ดูแลระบบ'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className='mt-3 flex w-full items-center gap-2 rounded-lg border border-default-200 px-3 py-2 text-[12px] font-medium text-default-500 transition-colors hover:border-danger-200 hover:bg-danger-50 hover:text-danger'>
            <Icon icon='mdi:logout' width={14} height={14} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className='ml-[240px] flex flex-1 flex-col bg-default-50'>
        {children}
      </div>
    </div>
  )
}
