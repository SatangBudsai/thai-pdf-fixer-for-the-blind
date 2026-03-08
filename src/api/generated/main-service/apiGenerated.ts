/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ResPaymentResponse {
  ref_system: string
  paymentMethod: string
  paymentsUrl: string | null
  transactionId: string
}

export interface ApiResponseTypeResPaymentResponse {
  data?: ResPaymentResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export enum E36EnumsPaymentMethod {
  QRCODE = 'QRCODE',
  CREDIT = 'CREDIT',
  INSTALLMENT = 'INSTALLMENT',
  CASH = 'CASH'
}

export type PaymentMethod = E36EnumsPaymentMethod

export interface ReqUserPayment {
  privateClassId?: string
  bankType?: string
  paymentMethod: PaymentMethod
  packageOrCourseId: string
}

export enum E36EnumsPaymentStatus {
  WAITING = 'WAITING',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL'
}

export type PaymentStatus = E36EnumsPaymentStatus

export interface ResPaymentStatusResponse {
  paymentMethod: PaymentMethod
  transaction_db_status: PaymentStatus
  description: string
  amount: string
  status: string
  Transaction_ID: string
}

export interface ApiResponseTypeResPaymentStatusResponse {
  data?: ResPaymentStatusResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface ApiResponseTypeAny {
  data?: any
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface Bank {
  /** @format double */
  is_active: number
  logo_bank: string
  name_bank_en: string
  name_bank_th: string
  name_bank: string
  code_bank: string
  /** @format double */
  id: number
}

export type BankList = Bank[]

export interface ApiResponseTypeBankList {
  data?: BankList
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export enum E36EnumsBookingScheduleStatus {
  PENDING = 'PENDING',
  ATTENDED = 'ATTENDED',
  CANCELLEDREFUND = 'CANCELLEDREFUND',
  CANCELLEDNOTREFUND = 'CANCELLEDNOTREFUND'
}

export type BookingScheduleStatus = E36EnumsBookingScheduleStatus

export enum E36EnumsCourseType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  NEWS = 'NEWS',
  VIDEO = 'VIDEO'
}

export type CourseType = E36EnumsCourseType

export enum E36EnumsCourseLevel {
  ALLLEVEL = 'ALLLEVEL',
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export type CourseLevel = E36EnumsCourseLevel

export enum E36EnumsProductType {
  COURSE = 'COURSE',
  PACKAGE = 'PACKAGE'
}

export type ProductType = E36EnumsProductType

export interface BookingScheduleTypeRelation {
  user_product_comment?: UserProductCommentTypeRelation[] | null
  user_product?: UserProductTypeRelation | null
  user?: UserTypeRelation | null
  time_slot?: TimeSlotTypeRelation | null
  teacher_schedule?: TeacherScheduleTypeRelation | null
  teacher?: TeacherTypeRelation | null
  google_meet_links?: GoogleMeetLinksTypeRelation | null
  product?: ProductTypeRelation | null
  scheduleId: string
  user_product_id: string
  /** @format double */
  time_slot_id: number | null
  google_meet_link_id: string | null
  /** @format double */
  class_minutes: number | null
  /** @format date-time */
  class_timesend: string | null
  /** @format date-time */
  updated_at: string | null
  /** @format date-time */
  created_at: string | null
  status: BookingScheduleStatus | null
  /** @format date-time */
  class_date: string
  teacher_id: string
  product_id: string
  user_id: string
  codeBooking: string
  id: string | null
}

export interface OrderItemTypeRelation {
  user_product?: UserProductTypeRelation | null
  product?: ProductTypeRelation | null
  orders?: OrdersTypeRelation | null
  /** @format date-time */
  created_at: string | null
  user_product_id: string | null
  /** @format double */
  quantity: number | null
  /** @format double */
  price: number | null
  product_id: string
  order_id: string
  id: string | null
}

export interface OrdersTypeRelation {
  user_product?: UserProductTypeRelation[] | null
  transaction_user_payment?: TransactionUserPaymentTypeRelation[] | null
  user?: UserTypeRelation | null
  order_item?: OrderItemTypeRelation[] | null
  payment_id: string | null
  /** @format date-time */
  updated_at: string | null
  /** @format date-time */
  created_at: string | null
  /** @format double */
  total: number | null
  user_id: string
  id: string | null
}

export interface ProductTypeRelation {
  user_product_comment?: UserProductCommentTypeRelation[] | null
  user_product?: UserProductTypeRelation[] | null
  transaction_user_payment?: TransactionUserPaymentTypeRelation[] | null
  teacher_schedule?: TeacherScheduleTypeRelation[] | null
  product_vdo_class?: ProductVdoClassTypeRelation[] | null
  product_teacher?: ProductTeacherTypeRelation[] | null
  product_tag?: ProductTagTypeRelation[] | null
  product_private_class?: ProductPrivateClassTypeRelation[] | null
  product_news_class?: ProductNewsClassTypeRelation[] | null
  product_group_class?: ProductGroupClassTypeRelation[] | null
  product_main?: ProductGroupTypeRelation[] | null
  product_child?: ProductGroupTypeRelation[] | null
  product_feature?: ProductFeatureTypeRelation[] | null
  product_curriculum?: ProductCurriculumTypeRelation[] | null
  order_item?: OrderItemTypeRelation[] | null
  booking_schedule?: BookingScheduleTypeRelation[] | null
  product_type: ProductType | null
  level: CourseLevel | null
  images: string | null
  description: string | null
  type: CourseType
  /** @format date-time */
  ex_date_discount_price: string | null
  /** @format double */
  discount_price: number | null
  /** @format double */
  price: number | null
  name: string
  id: string | null
}

export interface ProductVdoLessonsTypeRelation {
  product_video_lesson_progress?: ProductVideoLessonProgressTypeRelation[] | null
  product_video_document?: ProductVideoDocumentTypeRelation[] | null
  product_vdo_class?: ProductVdoClassTypeRelation | null
  /** @format double */
  ordering: number | null
  /** @format double */
  duration: number | null
  video_url: string | null
  description: string | null
  sub_title: string | null
  title: string | null
  product_vdo_class_id: string
  id: string | null
}

export interface ProductVdoClassTypeRelation {
  product_vdo_lessons?: ProductVdoLessonsTypeRelation[] | null
  product?: ProductTypeRelation | null
  owner_name: string | null
  /** @format double */
  total_lessons: number
  product_id: string
  id: string | null
}

export interface ProductVideoDocumentTypeRelation {
  product_vdo_lessons?: ProductVdoLessonsTypeRelation | null
  label: string | null
  url_download: string | null
  /** @format double */
  size: number | null
  type: string | null
  product_video_lesson_id: string
  id: string | null
}

export interface ProductVideoLessonProgressTypeRelation {
  user?: UserTypeRelation | null
  product_vdo_lessons?: ProductVdoLessonsTypeRelation | null
  is_completed: boolean | null
  user_id: string
  product_video_lesson_id: string
  id: string | null
}

export interface UserTypeRelation {
  user_product_comment?: UserProductCommentTypeRelation[] | null
  user_product?: UserProductTypeRelation[] | null
  transaction_user_payment?: TransactionUserPaymentTypeRelation[] | null
  product_video_lesson_progress?: ProductVideoLessonProgressTypeRelation[] | null
  orders?: OrdersTypeRelation[] | null
  booking_schedule?: BookingScheduleTypeRelation[] | null
  lastname: string
  phonenumber: string
  email: string
  name: string
  /** @format date-time */
  updated_at: string | null
  /** @format date-time */
  created_at: string | null
  /** @format double */
  tambonId: number | null
  /** @format double */
  amphureId: number | null
  /** @format double */
  provinceId: number | null
  learnerId: string
  id: string | null
}

export interface TransactionUserPaymentTypeRelation {
  product?: ProductTypeRelation | null
  orders?: OrdersTypeRelation | null
  user?: UserTypeRelation | null
  private_class_id: string | null
  order_id: string | null
  /** @format double */
  pricepayment: number | null
  ref_system: string
  /** @format date-time */
  updatedAt: string | null
  /** @format date-time */
  createdAt: string | null
  paymentStatus: PaymentStatus | null
  paymentMethod: PaymentMethod
  qrUrl: string | null
  transactionId: string
  product_id: string
  userId: string
  id: string | null
}

export interface UserProductTypeRelation {
  orders?: OrdersTypeRelation | null
  user?: UserTypeRelation | null
  product?: ProductTypeRelation | null
  order_item?: OrderItemTypeRelation[] | null
  booking_schedule?: BookingScheduleTypeRelation[] | null
  privateclassid: string | null
  order_id: string | null
  iscompleted: boolean | null
  /** @format date-time */
  enrolled_expired: string
  /** @format date-time */
  enrolled_at: string | null
  /** @format double */
  enrolled_limit: number
  /** @format double */
  enrolled_count: number | null
  is_payment: boolean | null
  product_id: string
  user_id: string
  id: string | null
}

export interface TeacherTypeRelation {
  user_product_comment?: UserProductCommentTypeRelation[] | null
  teacher_schedule?: TeacherScheduleTypeRelation[] | null
  product_teacher?: ProductTeacherTypeRelation[] | null
  booking_schedule?: BookingScheduleTypeRelation[] | null
  images: string | null
  /** @format date-time */
  created_at: string | null
  name: string
  id: string | null
}

export interface ProductTeacherTypeRelation {
  teacher?: TeacherTypeRelation | null
  product?: ProductTypeRelation | null
  teacherId: string
  courseId: string
  id: string | null
}

export interface TeacherScheduleTypeRelation {
  time_slot?: TimeSlotTypeRelation | null
  teacher?: TeacherTypeRelation | null
  course?: ProductTypeRelation | null
  booking_schedule?: BookingScheduleTypeRelation[] | null
  isbooking: boolean | null
  /** @format date-time */
  updated_at: string | null
  /** @format date-time */
  created_at: string | null
  /** @format double */
  time_slot_id: number | null
  /** @format date-time */
  class_date: string
  teacher_id: string
  course_id: string
  id: string | null
}

export interface TimeSlotTypeRelation {
  teacher_schedule?: TeacherScheduleTypeRelation[] | null
  booking_schedule?: BookingScheduleTypeRelation[] | null
  /** @format date-time */
  end_time: string | null
  /** @format date-time */
  start_time: string | null
  time_show: string | null
  is_active: boolean | null
  /** @format double */
  orderslot: number | null
  /** @format date-time */
  time_name: string | null
  /** @format double */
  id: number | null
}

export interface UserProductCommentTypeRelation {
  user?: UserTypeRelation | null
  teacher?: TeacherTypeRelation | null
  product?: ProductTypeRelation | null
  booking_schedule?: BookingScheduleTypeRelation | null
  commentby: string
  /** @format date-time */
  updated_at: string | null
  /** @format date-time */
  created_at: string | null
  comment: string | null
  scheduleId: string
  userId: string
  productId: string
  id: string | null
}

export interface ProductCurriculumTypeRelation {
  product?: ProductTypeRelation | null
  product_id: string
  /** @format double */
  order_index: number | null
  title: string
  id: string | null
}

export interface ProductFeatureTypeRelation {
  feature?: FeatureTypeRelation | null
  product?: ProductTypeRelation | null
  feature_id: string
  product_id: string
  id: string | null
}

export interface FeatureTypeRelation {
  product_feature?: ProductFeatureTypeRelation[] | null
  name: string
  id: string | null
}

export interface ProductGroupTypeRelation {
  child_product?: ProductTypeRelation | null
  main_product?: ProductTypeRelation | null
  child_product_id: string
  main_product_id: string
}

export interface ProductGroupClassTypeRelation {
  product?: ProductTypeRelation | null
  course_id: string
  schedule: string | null
  /** @format double */
  group_size: number | null
  id: string | null
}

export interface ProductNewsClassTypeRelation {
  product?: ProductTypeRelation | null
  course_id: string
  /** @format date-time */
  publish_date: string | null
  news_tag: string | null
  id: string | null
}

export interface ProductPrivateClassTypeRelation {
  product?: ProductTypeRelation | null
  /** @format double */
  discount_price: number | null
  /** @format double */
  price: number | null
  /** @format double */
  limit_ticket: number | null
  course_id: string
  /** @format double */
  duration_minutes: number | null
  /** @format double */
  max_students: number | null
  id: string | null
}

export interface ProductTagTypeRelation {
  tag?: TagTypeRelation | null
  product?: ProductTypeRelation | null
  tag_id: string
  product_id: string
  id: string | null
}

export interface TagTypeRelation {
  product_tag?: ProductTagTypeRelation[] | null
  custom_class: string | null
  variant: string | null
  color: string | null
  icon: string | null
  /** @format date-time */
  update_at: string | null
  /** @format date-time */
  create_at: string | null
  name: string
  id: string | null
}

export interface GoogleMeetLinksTypeRelation {
  booking_schedule?: BookingScheduleTypeRelation[] | null
  /** @format date-time */
  created_at: string | null
  /** @format date-time */
  expire_at: string | null
  meet_url: string
  meet_id: string
  id: string | null
}

export interface ResponsecourseBooking {
  meetinglink: string | null
  /** @format date-time */
  classtimesend: string | null
  timeslotname: string | null
  /** @format double */
  timeslotid: number | null
  coursetype: string
  /** @format date-time */
  classdate: string | null
  teacher: string
  name: string
  bookingscheduleId: string
}

export interface DashBoardMycourse {
  /** @format double */
  attendedHours: number
  /** @format double */
  pendingCount: number
  /** @format double */
  attendedCount: number
}

export interface WeeklyClassSummary {
  /** @format double */
  totalHours: number
  /** @format double */
  totalBookings: number
}

export interface ResponseMyUserCourseDashBorad {
  WeeklyClassSummary: WeeklyClassSummary
  dashBoardMycourse: DashBoardMycourse
  comingSoon: ResponsecourseBooking | null
  mycourse: UserProductTypeRelation[]
}

export interface ApiResponseTypeResponseMyUserCourseDashBorad {
  data?: ResponseMyUserCourseDashBorad
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface ProductListResponse {
  /** @format double */
  total: number
  items: ProductTypeRelation[]
}

export interface ApiResponseTypeProductListResponse {
  data?: ProductListResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface CourseFilterParams {
  searchText?: string
  category?: string
  courseType?: CourseType
  courseLevel?: CourseLevel
  isPurchased?: boolean
  /** @format double */
  page?: number
  /** @format double */
  limit?: number
}

export interface ApiResponseTypeProductTypeRelation {
  data?: ProductTypeRelation
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface ApiResponseTypeTransactionUserPaymentTypeRelation {
  data?: TransactionUserPaymentTypeRelation
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface ProductVideoLessonProgressType {
  is_completed: boolean | null
  user_id: string | null
  product_video_lesson_id: string | null
  id: string | null
}

export interface ApiResponseTypeProductVideoLessonProgressType {
  data?: ProductVideoLessonProgressType
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface CreateBookingResponse {
  booking: BookingScheduleTypeRelation
  meetLink: string
  message: string
}

export interface ApiResponseTypeCreateBookingResponse {
  data?: CreateBookingResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface CreateBookingRequest {
  product_id: string
  scheduleId: string
  class_date: string
}

export interface BookingScheduleListResponse {
  bookings: BookingScheduleTypeRelation[]
  /** @format double */
  total: number
  /** @format double */
  page: number
  /** @format double */
  limit: number
  /** @format double */
  totalPages: number
}

export interface ApiResponseTypeBookingScheduleListResponse {
  data?: BookingScheduleListResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export type Restimeslots = {
  time_show: string | null
  is_active: boolean
  /** @format double */
  orderslot: number
  time_name: string | null
  /** @format double */
  id: number
}[]

export interface ApiResponseTypeRestimeslots {
  data?: Restimeslots
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface CourseScheduleDateItem {
  date: string
  /** @format double */
  totalSchedules: number
  /** @format double */
  bookedSchedules: number
  /** @format double */
  availableSchedules: number
}

export type CourseScheduleDatesResponse = CourseScheduleDateItem[]

export interface ApiResponseTypeCourseScheduleDatesResponse {
  data?: CourseScheduleDatesResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface CourseScheduleTimeslotItem {
  /** @format double */
  timeSlotId: number
  timeName?: string | null
  start_time: string | null
  end_time: string | null
  isBooked: boolean
  scheduleId: string
}

export type CourseScheduleTimeslotsResponse = CourseScheduleTimeslotItem[]

export interface ApiResponseTypeCourseScheduleTimeslotsResponse {
  data?: CourseScheduleTimeslotsResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface CourseScheduleTeacherItem {
  id: string
  name: string
  images?: string | null
  scheduleId: string
  isBooked: boolean
}

export type CourseScheduleTeachersResponse = CourseScheduleTeacherItem[]

export interface ApiResponseTypeCourseScheduleTeachersResponse {
  data?: CourseScheduleTeachersResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export enum CalendarEventStatus {
  Upcoming = 'upcoming',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export enum CalendarEventColor {
  Primary = 'primary',
  Secondary = 'secondary',
  Success = 'success',
  Warning = 'warning',
  Danger = 'danger'
}

export interface CalendarEvent {
  id: string
  title: string
  type: CourseType
  teacher: string
  time: string
  /** @format double */
  duration: number
  topic?: string
  meetingUrl: string | null
  /** @format date-time */
  date: string
  status: CalendarEventStatus
  color: CalendarEventColor
}

export interface MonthSummary {
  /** @format double */
  completedClasses: number
  /** @format double */
  upcomingClasses: number
  /** @format double */
  totalMinutes: number
}

export interface MyCalendarResponse {
  events: CalendarEvent[]
  summary: MonthSummary
  /** @format double */
  year: number
  /** @format double */
  month: number
}

export interface ApiResponseTypeMyCalendarResponse {
  data?: MyCalendarResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export enum HistoryItemType {
  Attended = 'attended',
  Purchase = 'purchase',
  Booking = 'booking',
  Completion = 'completion'
}

export enum HistoryStatus {
  Completed = 'completed',
  Pending = 'pending',
  Success = 'success',
  Cancelled = 'cancelled'
}

export interface HistoryItem {
  id: string
  type: HistoryItemType
  title: string
  description: string
  date: string
  status: HistoryStatus
  productId: string
  productName: string
  productImage: string | null
  teacher?: string
  /** @format double */
  rating?: number
  /** @format double */
  amount?: number
  paymentMethod?: string
}

export interface MyHistoryResponse {
  items: HistoryItem[]
  /** @format double */
  total: number
  /** @format double */
  page: number
  /** @format double */
  limit: number
  /** @format double */
  totalPages: number
}

export interface ApiResponseTypeMyHistoryResponse {
  data?: MyHistoryResponse
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface DefaultSelectionPrisma36BannerReviewPayload {
  /** @format double */
  order_banner: number
  /** @format date-time */
  updated_at: string
  /** @format date-time */
  created_at: string
  image_url: string
  id: string
}

/** Model banner_review */
export type BannerReview = DefaultSelectionPrisma36BannerReviewPayload

export interface ApiResponseTypeBannerReviewArray {
  data?: BannerReview[]
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface ApiResponseTypeBannerReview {
  /** Model banner_review */
  data?: BannerReview
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface UserType {
  email: string
  phonenumber: string
  lastname: string
  name: string
  learnerId: string
}

export interface ResRegister {
  user: UserType
  token: string
}

export interface ApiResponseTypeResRegister {
  data?: ResRegister
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface RegisterUserRequest {
  phoneNumber: string
  lastname: string
  name: string
  password: string
  email: string
}

export interface ResLogin {
  user: UserType
  token: string
}

export interface ApiResponseTypeResLogin {
  data?: ResLogin
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface LoginUserRequest {
  password: string
  username: string
}

export interface ApiResponseTypeBoolean {
  data?: boolean
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

export interface ReqForgotPassword {
  email: string
}

export interface ResJwtPayload {
  email: string
  phoneNumber: string
  lastname: string
  name: string
  learnerId: string
}

export interface ApiResponseTypeResJwtPayload {
  data?: ResJwtPayload
  /** @format double */
  code: number
  message: string
  status: 'success' | 'error'
}

import type { AxiosInstance, AxiosRequestConfig, HeadersDefaults, ResponseType } from 'axios'
import axios from 'axios'

export type QueryParamsType = Record<string | number, any>

export interface FullRequestParams extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean
  /** request path */
  path: string
  /** content type of request body */
  type?: ContentType
  /** query params */
  query?: QueryParamsType
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType
  /** request body */
  body?: unknown
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
  securityWorker?: (securityData: SecurityDataType | null) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void
  secure?: boolean
  format?: ResponseType
}

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain'
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance
  private securityData: SecurityDataType | null = null
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker']
  private secure?: boolean
  private format?: ResponseType

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || '/api/v1/main' })
    this.secure = secure
    this.format = format
    this.securityWorker = securityWorker
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data
  }

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method)

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {})
      }
    }
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === 'object' && formItem !== null) {
      return JSON.stringify(formItem)
    } else {
      return `${formItem}`
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key]
      const propertyContent: any[] = property instanceof Array ? property : [property]

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem))
      }

      return formData
    }, new FormData())
  }

  public request = async <T = any, _E = any>({ secure, path, type, query, format, body, ...params }: FullRequestParams): Promise<T> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.secure) && this.securityWorker && (await this.securityWorker(this.securityData))) || {}
    const requestParams = this.mergeRequestParams(params, secureParams)
    const responseFormat = format || this.format || undefined

    if (type === ContentType.FormData && body && body !== null && typeof body === 'object') {
      body = this.createFormData(body as Record<string, unknown>)
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== 'string') {
      body = JSON.stringify(body)
    }

    return this.instance
      .request({
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData ? { 'Content-Type': type } : {})
        },
        params: query,
        responseType: responseFormat,
        data: body,
        url: path
      })
      .then(response => response.data)
  }
}

/**
 * @title OnLearn API - Main Service
 * @version 1.0.0
 * @license MIT
 * @baseUrl /api/v1/main
 * @contact
 *
 * API Service Node Express Template
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  userPayment = {
    /**
     * No description
     *
     * @tags userpayment
     * @name CreatePayment
     * @request POST:/user-payment/createPayment
     * @secure
     */
    createPayment: (data: ReqUserPayment, params: RequestParams = {}) =>
      this.request<ApiResponseTypeResPaymentResponse, any>({
        path: `/user-payment/createPayment`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags userpayment
     * @name CheckTransactionStatus
     * @request GET:/user-payment/checkTransactionStatus/{transactionID}
     * @secure
     */
    checkTransactionStatus: (transactionId: string, params: RequestParams = {}) =>
      this.request<ApiResponseTypeResPaymentStatusResponse, any>({
        path: `/user-payment/checkTransactionStatus/${transactionId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags userpayment
     * @name CancelTransactionStatus
     * @request GET:/user-payment/cancelTransactionStatus/{transactionID}
     * @secure
     */
    cancelTransactionStatus: (transactionId: string, params: RequestParams = {}) =>
      this.request<ApiResponseTypeAny, any>({
        path: `/user-payment/cancelTransactionStatus/${transactionId}`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags userpayment
     * @name GetBankInstallment
     * @request GET:/user-payment/getBankInstallment
     * @secure
     */
    getBankInstallment: (params: RequestParams = {}) =>
      this.request<ApiResponseTypeBankList, any>({
        path: `/user-payment/getBankInstallment`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags userpayment
     * @name UpdatePaymentStatus
     * @request PUT:/user-payment/updatePaymentStatus/{transactionID}
     * @secure
     */
    updatePaymentStatus: (transactionId: string, params: RequestParams = {}) =>
      this.request<ApiResponseTypeAny, any>({
        path: `/user-payment/updatePaymentStatus/${transactionId}`,
        method: 'PUT',
        secure: true,
        format: 'json',
        ...params
      })
  }
  userCourse = {
    /**
     * No description
     *
     * @tags usercourse
     * @name GetMyCourse
     * @request GET:/user-course/userCourseDashboard
     * @secure
     */
    getMyCourse: (params: RequestParams = {}) =>
      this.request<ApiResponseTypeResponseMyUserCourseDashBorad, any>({
        path: `/user-course/userCourseDashboard`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params
      })
  }
  product = {
    /**
     * @description ดึงรายการผลิตภัณฑ์พร้อมตัวกรอง รองรับทั้ง logged-in user และ guest user
     *
     * @tags Product
     * @name GetProducts
     * @request GET:/product/getAllProducts
     */
    getProducts: (
      query?: {
        searchText?: string
        category?: string
        courseType?: CourseType
        courseLevel?: CourseLevel
        isPurchased?: boolean
        /** @format double */
        page?: number
        /** @format double */
        limit?: number
      },
      params: RequestParams = {}
    ) =>
      this.request<ApiResponseTypeProductListResponse, any>({
        path: `/product/getAllProducts`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params
      }),

    /**
     * @description ดึงรายละเอียดผลิตภัณฑ์ตาม ID รองรับทั้ง logged-in user และ guest user
     *
     * @tags Product
     * @name GetProductById
     * @request GET:/product/getProductById/{productId}
     */
    getProductById: (productId: string, params: RequestParams = {}) =>
      this.request<ApiResponseTypeProductTypeRelation, any>({
        path: `/product/getProductById/${productId}`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * @description ดึงรายละเอียดผลิตภัณฑ์ตาม Transaction ID ใช้สำหรับดูข้อมูลผลิตภัณฑ์ที่ซื้อผ่าน transaction
     *
     * @tags Product
     * @name GetProductByTransactionId
     * @request GET:/product/getProductByTransactionID/{transactionId}
     */
    getProductByTransactionId: (transactionId: string, params: RequestParams = {}) =>
      this.request<ApiResponseTypeTransactionUserPaymentTypeRelation, any>({
        path: `/product/getProductByTransactionID/${transactionId}`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * @description สร้างหรืออัปเดต progress ของ video lesson ใช้สำหรับบันทึกความคืบหน้าในการดูวิดีโอ
     *
     * @tags Product
     * @name CreateOrUpdateProductVideoProgress
     * @request POST:/product/createOrUpdateVideoProgress
     */
    createOrUpdateProductVideoProgress: (
      data: {
        isCompleted: boolean
        productVideoLessonId: string
        userId: string
      },
      params: RequestParams = {}
    ) =>
      this.request<ApiResponseTypeProductVideoLessonProgressType, any>({
        path: `/product/createOrUpdateVideoProgress`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params
      })
  }
  bookingschedule = {
    /**
     * @description สร้าง Booking Schedule พร้อม Google Meet
     *
     * @tags BookingSchedule
     * @name CreateBooking
     * @summary Create booking schedule with Google Meet link
     * @request POST:/bookingschedule/create
     * @secure
     */
    createBooking: (data: CreateBookingRequest, params: RequestParams = {}) =>
      this.request<ApiResponseTypeCreateBookingResponse, any>({
        path: `/bookingschedule/create`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * @description ดึงรายการ booking ของผู้ใช้ที่ login
     *
     * @tags BookingSchedule
     * @name GetMyBookings
     * @summary Get my booking schedules
     * @request GET:/bookingschedule/my-bookings
     * @secure
     */
    getMyBookings: (
      query?: {
        /** @format double */
        page?: number
        /** @format double */
        limit?: number
        status?: BookingScheduleStatus
        course_id?: string
        from_date?: string
        to_date?: string
      },
      params: RequestParams = {}
    ) =>
      this.request<ApiResponseTypeBookingScheduleListResponse, any>({
        path: `/bookingschedule/my-bookings`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags BookingSchedule
     * @name GetTimeslot
     * @request POST:/bookingschedule/getTimeslot
     * @secure
     */
    getTimeslot: (params: RequestParams = {}) =>
      this.request<ApiResponseTypeRestimeslots, any>({
        path: `/bookingschedule/getTimeslot`,
        method: 'POST',
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * @description /** Teacher Schedule Routes - ค้นหาจาก teacher_schedule
     *
     * @tags BookingSchedule
     * @name GetCourseScheduleDates
     * @request GET:/bookingschedule/product/schedule-dates/{productId}
     * @secure
     */
    getCourseScheduleDates: (
      productId: string,
      query?: {
        /** @format double */
        daysAhead?: number
      },
      params: RequestParams = {}
    ) =>
      this.request<ApiResponseTypeCourseScheduleDatesResponse, any>({
        path: `/bookingschedule/product/schedule-dates/${productId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * @description 2) ดึง timeslots จาก teacher_schedule สำหรับวันที่กำหนด พร้อมสถานะจอง
     *
     * @tags BookingSchedule
     * @name GetCourseScheduleTimeslots
     * @summary Get course schedule timeslots from teacher_schedule table
     * @request GET:/bookingschedule/product/schedule-timeslots/{productId}
     * @secure
     */
    getCourseScheduleTimeslots: (
      productId: string,
      query?: {
        date?: string
      },
      params: RequestParams = {}
    ) =>
      this.request<ApiResponseTypeCourseScheduleTimeslotsResponse, any>({
        path: `/bookingschedule/product/schedule-timeslots/${productId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * @description 3) ดึงรายชื่ออาจารย์จาก teacher_schedule สำหรับวันและ timeslot ที่กำหนด
     *
     * @tags BookingSchedule
     * @name GetCourseScheduleTeachers
     * @summary Get course schedule teachers from teacher_schedule table
     * @request GET:/bookingschedule/product/schedule-teachers/{productId}
     * @secure
     */
    getCourseScheduleTeachers: (
      productId: string,
      query?: {
        date?: string
        /** @format double */
        timeSlotId?: number
      },
      params: RequestParams = {}
    ) =>
      this.request<ApiResponseTypeCourseScheduleTeachersResponse, any>({
        path: `/bookingschedule/product/schedule-teachers/${productId}`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * @description 📅 My Calendar - แสดงปฏิทินของ user พร้อมสรุปสถิติในเดือน
     *
     * @tags BookingSchedule
     * @name GetMyCalendar
     * @summary Get user's calendar with monthly summary
     * @request GET:/bookingschedule/my-calendar
     * @secure
     */
    getMyCalendar: (
      query: {
        /** @format double */
        year: number
        /** @format double */
        month: number
      },
      params: RequestParams = {}
    ) =>
      this.request<ApiResponseTypeMyCalendarResponse, any>({
        path: `/bookingschedule/my-calendar`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params
      }),

    /**
     * @description 📜 My History - แสดงประวัติการเข้าเรียน, ซื้อคอร์ส, จองเวลา, จบคอร์ส
     *
     * @tags BookingSchedule
     * @name GetMyHistory
     * @summary Get user's history with filters and search
     * @request GET:/bookingschedule/my-history
     * @secure
     */
    getMyHistory: (
      query?: {
        /** @format double */
        page?: number
        /** @format double */
        limit?: number
        type?: 'ATTENDED' | 'purchase' | 'booking' | 'completion'
        search?: string
      },
      params: RequestParams = {}
    ) =>
      this.request<ApiResponseTypeMyHistoryResponse, any>({
        path: `/bookingschedule/my-history`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params
      })
  }
  bannerReview = {
    /**
     * @description ดึงรายการ banner review ทั้งหมด เรียงตาม order_banner
     *
     * @tags BannerReview
     * @name GetAllBannerReviews
     * @request GET:/banner-review/getAllBannerReviews
     */
    getAllBannerReviews: (params: RequestParams = {}) =>
      this.request<ApiResponseTypeBannerReviewArray, any>({
        path: `/banner-review/getAllBannerReviews`,
        method: 'GET',
        format: 'json',
        ...params
      }),

    /**
     * @description ดึงรายละเอียด banner review ตาม ID
     *
     * @tags BannerReview
     * @name GetBannerReviewById
     * @request GET:/banner-review/getBannerReviewById/{id}
     */
    getBannerReviewById: (id: string, params: RequestParams = {}) =>
      this.request<ApiResponseTypeBannerReview, any>({
        path: `/banner-review/getBannerReviewById/${id}`,
        method: 'GET',
        format: 'json',
        ...params
      })
  }
  auth = {
    /**
     * No description
     *
     * @tags Auth
     * @name Register
     * @request POST:/auth/register
     */
    register: (data: RegisterUserRequest, params: RequestParams = {}) =>
      this.request<ApiResponseTypeResRegister, any>({
        path: `/auth/register`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name Login
     * @request POST:/auth/login
     */
    login: (data: LoginUserRequest, params: RequestParams = {}) =>
      this.request<ApiResponseTypeResLogin, any>({
        path: `/auth/login`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ForgotPassword
     * @request POST:/auth/forgot-Password
     */
    forgotPassword: (data: ReqForgotPassword, params: RequestParams = {}) =>
      this.request<ApiResponseTypeBoolean, any>({
        path: `/auth/forgot-Password`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name Verifytoken
     * @request GET:/auth/verify-token
     * @secure
     */
    verifytoken: (params: RequestParams = {}) =>
      this.request<ApiResponseTypeResJwtPayload, any>({
        path: `/auth/verify-token`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params
      })
  }
}
