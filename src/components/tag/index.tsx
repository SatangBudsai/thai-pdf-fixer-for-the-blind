import React from 'react'
import { Chip } from '@heroui/react'
import { Icon } from '@iconify/react'
import { CourseLevel, CourseType, ProductType } from '@/api/generated/main-service/apiGenerated'

type ChipColorType = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
type VariantType = 'solid' | 'flat' | 'bordered' | 'light' | 'faded' | 'shadow' | 'dot'

export interface TagProps {
  code?: CourseLevel | CourseType | ProductType | 'FREE' | 'PURCHASED' | 'NOT_PURCHASED'
  label?: string
  icon?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: string
  className?: string
  hiddenIcon?: boolean
}

interface TagConfig {
  label: string
  icon: string
  color: string
  variant: string
  customClass?: string
}

const tagConfigs: Record<NonNullable<TagProps['code']>, TagConfig> = {
  BEGINNER: {
    label: 'เริ่มต้น',
    icon: 'mdi:chart-line-variant',
    color: 'success',
    variant: 'flat'
  },
  INTERMEDIATE: {
    label: 'กลาง',
    icon: 'mdi:chart-timeline-variant',
    color: 'warning',
    variant: 'flat'
  },
  ADVANCED: {
    label: 'สูง',
    icon: 'mdi:chart-areaspline',
    color: 'danger',
    variant: 'flat'
  },
  ALLLEVEL: {
    label: 'ทุกระดับ',
    icon: 'mdi:chart-multiple',
    color: 'default',
    variant: 'flat'
  },

  // Course Types
  PRIVATE: {
    label: 'ติวเตอร์ส่วนตัว',
    icon: 'mdi:account-tie',
    color: 'primary',
    variant: 'solid'
  },
  GROUP: {
    label: 'กลุ่มอภิปราย',
    icon: 'mdi:account-group',
    color: 'primary',
    variant: 'solid'
  },
  NEWS: {
    label: 'เรียนจากข่าว',
    icon: 'mdi:newspaper',
    color: 'primary',
    variant: 'solid'
  },
  VIDEO: {
    label: 'วีดีโอออนไลน์',
    icon: 'mdi:video',
    color: 'secondary',
    variant: 'solid'
  },
  FREE: {
    label: 'Free',
    icon: 'mdi:gift',
    color: 'success',
    variant: 'flat',
    customClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },

  // Item Types
  PACKAGE: {
    label: 'แพ็กเกจ',
    icon: 'mdi:package-variant',
    color: 'secondary',
    variant: 'solid',
    customClass: 'bg-purple-600 text-white font-medium'
  },
  COURSE: {
    label: 'คอร์ส',
    icon: 'mdi:book-open-page-variant-outline',
    color: 'primary',
    variant: 'solid',
    customClass: 'text-white font-medium'
  },

  // Purchase Status
  PURCHASED: {
    label: 'ซื้อแล้ว',
    icon: 'mdi:check-circle',
    color: 'success',
    variant: 'solid',
    customClass: 'font-medium'
  },
  NOT_PURCHASED: {
    label: 'ยังไม่ซื้อ',
    icon: 'mdi:shopping-outline',
    color: 'default',
    variant: 'flat'
  }
}

export const Tag: React.FC<TagProps> = ({ code, label, icon, color, size = 'sm', variant, className = '', hiddenIcon }) => {
  // Use config from code if provided, otherwise use direct props
  const config = code ? tagConfigs[code] : null

  // If code is provided but not found, warn and return null
  if (code && !config) {
    console.warn(`Tag code "${code}" not found`)
    return null
  }

  // If neither code nor label is provided, return null
  if (!code && !label) {
    console.warn('Tag requires either code or label prop')
    return null
  }

  // Determine final values - direct props override config
  const finalLabel = label || config?.label || ''
  const finalIcon = icon || config?.icon || 'mdi:tag'
  const finalColor = color || config?.color || 'default'
  const finalVariant = variant || config?.variant || 'flat'
  const finalClassName = config?.customClass ? `${config.customClass} ${className}` : `font-medium ${className}`

  return (
    <Chip size={size} variant={finalVariant as VariantType} color={finalColor as ChipColorType} radius='md' className={finalClassName}>
      <div className='flex items-center gap-1'>
        {!hiddenIcon && <Icon icon={finalIcon} width={14} height={14} />}
        <span>{finalLabel}</span>
      </div>
    </Chip>
  )
}

export default Tag
