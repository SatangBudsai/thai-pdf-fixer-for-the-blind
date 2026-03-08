import React, { useState, useEffect, useMemo } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Image,
  Card,
  CardBody,
  Chip,
  Avatar
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'

import type { ProductTypeRelation, CreateBookingRequest } from '@/api/generated/main-service/apiGenerated'
import { E36EnumsPaymentStatus } from '@/api/generated/main-service/apiGenerated'
import { mainService } from '@/api/generated/main-service'
import Tag from '../tag'
import ShowAlert from '../alert/ShowAlert'
import { useRouter } from 'next/router'
import Alert from '../alert'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  productData?: ProductTypeRelation
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, productData }) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedCourse, setSelectedCourse] = useState<string>(productData?.id || '')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number>(0)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const { data: myProductData } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => mainService.userCourse.getMyCourse(),
    enabled: !!productData?.id
  })

  // Query สำหรับดึงวันที่ที่ว่าง
  const {
    data: availableDatesData,
    isLoading: datesLoading,
    error: datesError
  } = useQuery({
    queryKey: ['courseScheduleDates', selectedCourse],
    queryFn: async () => {
      console.log('Fetching dates for course:', selectedCourse)
      const result = await mainService.bookingschedule.getCourseScheduleDates(selectedCourse, { daysAhead: 30 })
      console.log('Dates API response:', result)
      return result
    },
    enabled: !!selectedCourse && isOpen,
    retry: 1
  })

  // Query สำหรับดึง timeslots ที่ว่าง
  const { data: availableTimeslotsData, isLoading: timeslotsLoading } = useQuery({
    queryKey: ['courseScheduleTimeslots', selectedCourse, selectedDate],
    queryFn: () => mainService.bookingschedule.getCourseScheduleTimeslots(selectedCourse, { date: selectedDate }),
    enabled: !!selectedCourse && !!selectedDate && isOpen
  })

  // Query สำหรับดึงรายชื่อครูที่ว่าง
  const { data: availableTeachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['courseScheduleTeachers', selectedCourse, selectedDate, selectedTimeSlotId],
    queryFn: () =>
      mainService.bookingschedule.getCourseScheduleTeachers(selectedCourse, {
        date: selectedDate,
        timeSlotId: selectedTimeSlotId
      }),
    enabled: !!selectedCourse && !!selectedDate && selectedTimeSlotId > 0 && isOpen
  })

  // Set selectedCourse เมื่อ productData มีค่า
  useEffect(() => {
    if (productData?.id) {
      setSelectedCourse(productData.id)
    }
  }, [productData?.id])

  // Reset form เมื่อ course เปลี่ยน
  useEffect(() => {
    setSelectedDate('')
    setSelectedTimeSlotId(0)
    setSelectedScheduleId('')
    setSelectedTeacherId('')
  }, [selectedCourse])

  // Reset timeslot และ teacher เมื่อวันที่เปลี่ยน
  useEffect(() => {
    setSelectedTimeSlotId(0)
    setSelectedScheduleId('')
    setSelectedTeacherId('')
  }, [selectedDate])

  // Reset teacher เมื่อ timeslot เปลี่ยน
  useEffect(() => {
    setSelectedScheduleId('')
    setSelectedTeacherId('')
  }, [selectedTimeSlotId])

  const handleConfirm = async () => {
    if (!selectedCourse || !selectedDate || !selectedScheduleId) return

    try {
      setIsSubmitting(true)

      const bookingRequest: CreateBookingRequest = {
        product_id: selectedCourse,
        scheduleId: selectedScheduleId,
        class_date: selectedDate
      }

      const response = await mainService.bookingschedule.createBooking(bookingRequest)

      if (response.status === 'success') {
        // Invalidate all courseScheduleTimeslots queries
        queryClient.invalidateQueries({
          queryKey: ['courseScheduleTimeslots']
        })

        Alert.success({
          color: 'success',
          content: (
            <div className='text-center'>
              <h3 className='mb-2 text-lg font-semibold text-foreground'>จองคลาสเรียนสำเร็จ!</h3>
              <p className='text-sm text-foreground/70'>
                จองคลาสเรียนของคุณเรียบร้อยแล้ว
                <br />
                เราส่งการจองไปยังอีเมลของคุณ
              </p>
            </div>
          ),
          labelSubmit: 'ไปหน้าตารางเรียน',
          onSubmit: () => {
            router.push('/courses?tab=calendar')
          }
        })
        handleClose()
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'ไม่สามารถจองคลาสเรียนได้'

      Alert.error({
        color: 'danger',
        content: (
          <div className='text-center'>
            <h3 className='mb-2 text-lg font-semibold text-foreground'>เกิดข้อผิดพลาด</h3>
            <p className='text-sm text-foreground/70'>{errorMessage}</p>
            <p className='mt-2 text-xs text-foreground/60'>กรุณาลองอีกครั้งหรือติดต่อเจ้าหน้าที่</p>
          </div>
        ),
        labelSubmit: 'ตกลง'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!productData?.id) {
      setSelectedCourse('')
    }
    setSelectedDate('')
    setSelectedTimeSlotId(0)
    setSelectedScheduleId('')
    setSelectedTeacherId('')
    onClose()
  }

  // หาข้อมูลคอร์สปัจจุบัน
  const currentUserProduct = myProductData?.data?.mycourse?.find(course => course.id === selectedCourse)

  // Check if user has purchased the course
  const isPurchased =
    productData?.product_type === 'PACKAGE'
      ? productData.transaction_user_payment?.every(p => p.paymentStatus === E36EnumsPaymentStatus.SUCCESS)
      : productData?.user_product && productData?.user_product?.length > 0

  // Get available tickets
  const availableTickets =
    isPurchased && productData?.user_product?.[0]
      ? productData.user_product[0].enrolled_limit - (productData.user_product[0].enrolled_count || 0)
      : undefined

  const isPrivateClass = productData && 'type' in productData && productData.type === 'PRIVATE'
  const isGroupClass = productData && 'type' in productData && productData.type === 'GROUP'
  const isLearnFromNews = productData && 'type' in productData && productData.type === 'NEWS'

  // ข้อมูลวันที่ที่ได้จาก API
  const availableDates = useMemo(() => availableDatesData?.data || [], [availableDatesData?.data])

  // Debug logging
  useEffect(() => {
    console.log('Selected Course:', selectedCourse)
    console.log('Available Dates Data:', availableDatesData)
    console.log('Available Dates:', availableDates)
    console.log('Dates Loading:', datesLoading)
    console.log('Dates Error:', datesError)
  }, [selectedCourse, availableDatesData, availableDates, datesLoading, datesError])

  // ข้อมูล timeslots ที่ได้จาก API
  const availableTimeslots = availableTimeslotsData?.data || []

  // ข้อมูลครูที่ได้จาก API
  const availableTeachers = availableTeachersData?.data || []

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size='xl' placement='center' backdrop='blur'>
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1 pb-2'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center rounded-full bg-primary/10 p-2'>
              <Icon icon='mdi:calendar-plus' width={20} className='text-primary' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-foreground'>จองคลาสเรียน</h3>
              <p className='text-sm text-foreground/70'>เลือกวันและเวลาที่สะดวกสำหรับคุณ</p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className='gap-6'>
          {/* Course Selection - แสดงเมื่อไม่มี productData?.id */}
          {!productData?.id && (
            <Select
              variant='bordered'
              label='เลือกคอร์สที่ต้องการจอง'
              placeholder='เลือกคอร์สที่ต้องการจอง'
              color='primary'
              startContent={<Icon icon='mdi:book-outline' width={18} className='text-primary' />}
              selectedKeys={selectedCourse ? [selectedCourse] : []}
              onSelectionChange={keys => setSelectedCourse(Array.from(keys)[0] as string)}
              isLoading={!myProductData}>
              {(myProductData?.data?.mycourse || []).map(course => (
                <SelectItem key={course.id || ''}>
                  {(course &&
                  typeof course === 'object' &&
                  'product' in course &&
                  course.product &&
                  typeof course.product === 'object' &&
                  'name' in course.product
                    ? String(course.product.name)
                    : '') || 'ไม่มีชื่อคอร์ส'}
                </SelectItem>
              ))}
            </Select>
          )}

          {/* Class Information Card */}
          {productData && (
            <Card shadow='sm'>
              <CardBody className='p-5'>
                {/* Header Section */}
                <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='flex items-start gap-4'>
                    {productData && 'images' in productData && productData.images && (
                      <Image
                        src={productData.images}
                        alt={productData.name || 'Course Image'}
                        className='h-14 w-14 flex-shrink-0 object-cover sm:h-16 sm:w-16'
                      />
                    )}

                    <div className='min-w-0 flex-1'>
                      <h4 className='mb-1 line-clamp-2 text-base font-semibold leading-tight text-foreground'>
                        {(productData && 'name' in productData && productData.name) || 'ไม่มีชื่อคอร์ส'}
                      </h4>

                      <div className='flex items-center gap-2'>
                        <div>
                          <h3 className='text-sm font-medium text-foreground'>รายละเอียดคอร์ส</h3>
                          <p className='line-clamp-1 text-xs leading-relaxed text-foreground/80'>{productData.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className='flex flex-shrink-0 flex-col gap-2 self-start'>
                    <Tag code={productData.type} size='sm' />
                  </div>
                </div>

                {/* Availability Status */}
                <div className='space-y-3'>
                  {/* Private Class - Ticket System */}
                  {isPrivateClass && availableTickets !== undefined && (
                    <div className='rounded-xl border border-primary/20 bg-primary/5 px-4 py-2'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Icon icon='mdi:ticket' className='text-primary' width={16} />
                          <span className='text-sm font-medium text-primary'>
                            {isPurchased ? `เหลือ ${availableTickets} ตั๋ว` : `รวม ${productData?.user_product?.[0]?.enrolled_limit || 0} ตั๋ว`}
                          </span>
                        </div>
                        {currentUserProduct?.enrolled_expired && (
                          <div className='text-xs text-primary/70'>หมดอายุ {dayjs(currentUserProduct.enrolled_expired).format('D MMM YY')}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Group Class - Info */}
                  {isGroupClass && (
                    <div className='rounded-xl border border-orange-200 bg-orange-50/80 p-4'>
                      <div className='mb-3 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='rounded-full bg-orange-500/20 p-1.5'>
                            <Icon icon='mdi:account-group' className='text-orange-600' width={16} />
                          </div>
                          <span className='text-sm font-medium text-orange-700'>คลาสกลุ่ม</span>
                        </div>
                      </div>
                      <div className='rounded-lg border border-orange-200/60 bg-orange-100/60 px-3 py-2'>
                        <div className='flex items-center gap-2'>
                          <Icon icon='mdi:information-outline' className='text-orange-600' width={16} />
                          <span className='text-sm font-medium text-orange-700'>สามารถจองได้</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Learn from News - Free Class */}
                  {isLearnFromNews && (
                    <div className='rounded-xl border border-emerald-200 bg-emerald-50/80 p-4'>
                      <div className='mb-3 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='rounded-full bg-emerald-500/20 p-1.5'>
                            <Icon icon='mdi:newspaper' className='text-emerald-600' width={16} />
                          </div>
                          <span className='text-sm font-medium text-emerald-700'>คลาสฟรี</span>
                        </div>
                        <div className='text-right'>
                          <div className='text-lg font-bold text-emerald-700'>ไม่มีค่าใช้จ่าย</div>
                          <div className='text-xs text-emerald-600'>เรียนได้ไม่จำกัด</div>
                        </div>
                      </div>
                      <div className='rounded-lg border border-emerald-200/60 bg-emerald-100/60 px-3 py-2'>
                        <div className='flex items-center gap-2'>
                          <Icon icon='mdi:star-circle' className='text-emerald-600' width={16} />
                          <span className='text-sm font-medium text-emerald-700'>เรียนรู้ผ่านข่าวสารล่าสุด</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Booking Form */}
          <div className='space-y-3'>
            {/* Date Selection */}
            <Select
              variant='bordered'
              label='เลือกวันที่เรียน'
              placeholder='เลือกวันที่ที่ต้องการเรียน'
              color='primary'
              startContent={<Icon icon='mdi:calendar' width={18} className='text-primary' />}
              selectedKeys={selectedDate ? [selectedDate] : []}
              isDisabled={!selectedCourse || datesLoading}
              disabledKeys={availableDates.filter(date => date.availableSchedules === 0).map(date => date.date)}
              onSelectionChange={keys => setSelectedDate(Array.from(keys)[0] as string)}
              isLoading={datesLoading}>
              {[
                ...(availableDates.length === 0 && !datesLoading
                  ? [
                      <SelectItem key='no-dates' textValue='no dates available'>
                        {datesError ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล' : 'ไม่มีวันที่ว่างในช่วงนี้'}
                      </SelectItem>
                    ]
                  : []),
                ...availableDates.map(date => (
                  <SelectItem
                    key={date.date}
                    endContent={
                      date.availableSchedules > 0 ? null : (
                        <Chip size='sm' color='danger' variant='flat'>
                          เต็ม
                        </Chip>
                      )
                    }>
                    {dayjs(date.date).format('D MMMM YYYY')}
                  </SelectItem>
                ))
              ]}
            </Select>

            {/* Time Selection */}
            <Select
              variant={!selectedDate || timeslotsLoading ? 'flat' : 'bordered'}
              color={!selectedDate || timeslotsLoading ? 'default' : 'primary'}
              label='เลือกช่วงเวลาที่สะดวก'
              placeholder='เลือกช่วงเวลาที่สะดวก'
              startContent={<Icon icon='mdi:clock' width={18} className='text-primary' />}
              isDisabled={!selectedDate || timeslotsLoading}
              selectedKeys={selectedTimeSlotId ? [selectedTimeSlotId.toString()] : []}
              disabledKeys={availableTimeslots.filter(time => time.isBooked).map(time => time.timeSlotId.toString())}
              onSelectionChange={keys => {
                const timeSlotId = Number.parseInt(Array.from(keys)[0] as string, 10)
                setSelectedTimeSlotId(timeSlotId)
                // หา scheduleId ที่ตรงกับ timeSlotId ที่เลือก
                const selectedTimeslot = availableTimeslots.find(t => t.timeSlotId === timeSlotId)
                if (selectedTimeslot) {
                  setSelectedScheduleId(selectedTimeslot.scheduleId)
                }
              }}
              isLoading={timeslotsLoading}>
              {availableTimeslots.map(time => (
                <SelectItem
                  key={time.timeSlotId.toString()}
                  endContent={
                    time.isBooked ? (
                      <Chip size='sm' color='danger' variant='flat'>
                        เต็ม
                      </Chip>
                    ) : (
                      <Chip size='sm' color='success' variant='flat'>
                        ว่าง
                      </Chip>
                    )
                  }>
                  {time.timeName}
                </SelectItem>
              ))}
            </Select>

            {/* Teacher Selection */}
            <Select
              variant={!selectedTimeSlotId || teachersLoading ? 'flat' : 'bordered'}
              color={!selectedTimeSlotId || teachersLoading ? 'default' : 'primary'}
              label='เลือกครูผู้สอน'
              placeholder='เลือกครูผู้สอน'
              startContent={<Icon icon='mdi:account-tie' width={18} className='text-primary' />}
              isDisabled={!selectedTimeSlotId || teachersLoading}
              selectedKeys={selectedTeacherId ? [selectedTeacherId] : []}
              disabledKeys={availableTeachers.filter(teacher => teacher.isBooked).map(teacher => teacher.id)}
              onSelectionChange={keys => {
                const teacherId = Array.from(keys)[0] as string
                setSelectedTeacherId(teacherId)
                // อัพเดท scheduleId จากครูที่เลือก
                const selectedTeacher = availableTeachers.find(t => t.id === teacherId)
                if (selectedTeacher) {
                  setSelectedScheduleId(selectedTeacher.scheduleId)
                }
              }}
              isLoading={teachersLoading}>
              {availableTeachers.map(teacher => (
                <SelectItem
                  key={teacher.id}
                  startContent={
                    teacher.images ? (
                      <Avatar src={teacher.images} className='h-6 w-6' />
                    ) : (
                      <Icon icon='mdi:account-circle' width={24} className='text-default-400' />
                    )
                  }
                  endContent={
                    teacher.isBooked ? (
                      <Chip size='sm' color='warning' variant='flat'>
                        ไม่ว่าง
                      </Chip>
                    ) : null
                  }>
                  {teacher.name}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>

        <ModalFooter className='gap-2'>
          <Button color='default' variant='light' onPress={handleClose} isDisabled={isSubmitting} className='min-w-24'>
            ยกเลิก
          </Button>
          <Button
            variant={!selectedCourse || !selectedDate || !selectedScheduleId || !selectedTeacherId ? 'flat' : 'solid'}
            color={!selectedCourse || !selectedDate || !selectedScheduleId || !selectedTeacherId ? 'default' : 'primary'}
            onPress={handleConfirm}
            isLoading={isSubmitting}
            isDisabled={!selectedCourse || !selectedDate || !selectedScheduleId || !selectedTeacherId}
            startContent={isSubmitting ? undefined : <Icon icon='mdi:calendar-check' width={18} />}
            className='min-w-32 font-medium'>
            {isSubmitting ? 'กำลังจอง...' : 'ยืนยันการจอง'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default BookingModal
