import dayjs from 'dayjs'
import { E36EnumsCourseType, E36EnumsCourseLevel } from '@/api/generated/main-service/apiGenerated'

/**
 * Get course type display name from enum value
 */
export const getCourseTypeName = (type: E36EnumsCourseType | string | null): string => {
  if (!type) return 'Private Class'

  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'private':
        return 'Private Class'
      case 'group':
        return 'Group Discussion'
      case 'news':
        return 'Learn from News'
      case 'video':
        return 'Video Online'
      default:
        return 'Private Class'
    }
  }

  switch (type) {
    case E36EnumsCourseType.PRIVATE:
      return 'Private Class'
    case E36EnumsCourseType.GROUP:
      return 'Group Discussion'
    case E36EnumsCourseType.NEWS:
      return 'Learn from News'
    default:
      return 'Private Class'
  }
}

/**
 * Get course type tag for display
 */
export const getCourseTypeTag = (type: E36EnumsCourseType | string | null): string => {
  if (!type) return 'Private'

  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'private':
        return 'Private'
      case 'group':
        return 'Group'
      case 'news':
        return 'News'
      default:
        return 'Private'
    }
  }

  switch (type) {
    case E36EnumsCourseType.PRIVATE:
      return 'Private'
    case E36EnumsCourseType.GROUP:
      return 'Group'
    case E36EnumsCourseType.NEWS:
      return 'News'
    default:
      return 'Private'
  }
}

/**
 * Get course type color based on type
 */
export const getCourseTypeColor = (type: E36EnumsCourseType | string | null): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
  const typeName = getCourseTypeName(type)

  switch (typeName) {
    case 'Private Class':
      return 'primary'
    case 'Group Discussion':
      return 'success'
    case 'Learn from News':
      return 'warning'
    default:
      return 'primary'
  }
}

/**
 * Check if class time has been reached
 */
export const isClassTimeReached = (startTime: string | null): boolean => {
  if (!startTime) return false
  return dayjs().isAfter(dayjs(startTime))
}

/**
 * Calculate remaining tickets
 */
export const calculateRemainingTickets = (maxStudents: number | null, currentStudents: number | null): number => {
  if (maxStudents === null || currentStudents === null) return 0
  return Math.max(0, maxStudents - currentStudents)
}

/**
 * Format duration in minutes to readable format
 */
export const formatDuration = (minutes: number | null): string => {
  if (!minutes) return '60 minutes'

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${minutes} minutes`
  } else if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  } else {
    return `${hours}h ${remainingMinutes}m`
  }
}

/**
 * Check if date is today
 */
export const isToday = (date: string | null): boolean => {
  if (!date) return false
  return dayjs(date).isSame(dayjs(), 'day')
}

/**
 * Check if course is expired
 */
export const isCourseExpired = (expiryDate: string | null): boolean => {
  if (!expiryDate) return false
  return dayjs().isAfter(dayjs(expiryDate))
}

/**
 * Check if discount is valid
 */
export const isDiscountValid = (discountEndDate: string | null): boolean => {
  if (!discountEndDate) return false
  return dayjs().isBefore(dayjs(discountEndDate))
}

/**
 * Get final price considering discount
 */
export const getFinalPrice = (price: number, discountPrice: number | null, discountEndDate: string | null): number => {
  if (discountPrice && isDiscountValid(discountEndDate)) {
    return discountPrice
  }
  return price
}

/**
 * Format countdown timer
 */
export const formatCountdown = (targetDate: string | null): string => {
  if (!targetDate) return ''

  const now = dayjs()
  const target = dayjs(targetDate)
  const diff = target.diff(now)

  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
