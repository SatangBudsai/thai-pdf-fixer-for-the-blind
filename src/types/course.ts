// Shared interfaces for course detail components
// Base interface
export interface BaseClass {
  id: string
  title: string
  description: string
  image: string
  price: number
  originalPrice?: number
  discountPrice?: number
  expireDiscountPrice?: string
  duration: string
  level: string
  rating: number
  studentsCount: number
  teacher: string
  tags?: string[]
  isPurchased?: boolean
  isCompleted?: boolean
  progress?: number
  expiryDate?: string
  itemType: 'course' | 'package'
  teacherImage?: string
  teacherBio?: string
  totalLessons?: number
  completedLessons?: number
}

// Private Class interface
export interface PrivateClass extends BaseClass {
  type: 'Private Class'
  tickets?: number
  isBooked?: boolean
  curriculum?: string[]
  features?: string[]
}

// Group Class interface
export interface GroupClass extends BaseClass {
  type: 'Group Discussion'
  maxParticipants?: number
  currentParticipants?: number
  isBooked?: boolean
  schedules?: Array<{
    date: string
    time: string
    topic: string
    duration: string
  }>
  features?: string[]
  curriculum?: string[]
}

export interface VideoLesson {
  id: string
  title: string
  duration: string
  videoUrl?: string
  isPreview?: boolean
  resources?: Array<{
    type: string
    url: string
    label: string
  }>
}

export interface VideoTopic {
  id: string
  title: string
  description: string
  lessons: VideoLesson[]
}

export interface VideoClass extends BaseClass {
  type: 'Video Course'
  totalHours?: string
  videoCount?: number
  topics?: VideoTopic[]
  lessons?: VideoLesson[] // Keep for backward compatibility
  features?: string[]
  originalPrice?: number
}

// Package Class interface
export interface PackageClass extends BaseClass {
  type: 'Package'
  packageDetails: {
    totalCourses: number
    includedCourses: Array<{
      name: string
      originalPrice: number
    }>
    totalDuration: string
    totalTickets?: number
  }
  features?: string[]
}

// Union type for all class types
export type ClassData = PrivateClass | GroupClass | VideoClass | PackageClass
