import React from 'react'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrBefore)
import { Card, CardBody, Chip, Button, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import Icon from '@/components/icon'

interface CalendarEvent {
  id: string
  title: string
  type: 'Private Class' | 'Group Discussion' | 'Learn from News'
  teacher: string
  time: string
  duration: number
  topic: string
  meetingUrl: string
  date: string
  status: 'upcoming' | 'completed' | 'cancelled'
  color: string
}

interface CalendarComponentProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  currentDate: dayjs.Dayjs
  view: 'month' | 'week' | 'day'
  onDateChange: (direction: 'prev' | 'next') => void
  onViewChange: (view: 'month' | 'week' | 'day') => void
}

const EVENT_COLOR_STYLES: Record<string, { dot: string; compact: string; modalBg: string; modalBorder: string; modalText: string }> = {
  primary: {
    dot: 'bg-primary',
    compact: 'bg-primary text-primary-foreground shadow-sm',
    modalBg: 'bg-primary-50',
    modalBorder: 'border-primary-200',
    modalText: 'text-primary-700'
  },
  secondary: {
    dot: 'bg-secondary',
    compact: 'bg-secondary text-secondary-foreground shadow-sm',
    modalBg: 'bg-secondary-50',
    modalBorder: 'border-secondary-200',
    modalText: 'text-secondary-700'
  },
  success: {
    dot: 'bg-primary',
    compact: 'bg-primary text-primary-foreground shadow-sm',
    modalBg: 'bg-primary-50',
    modalBorder: 'border-primary-200',
    modalText: 'text-primary-700'
  },
  warning: {
    dot: 'bg-warning',
    compact: 'bg-warning text-warning-foreground shadow-sm',
    modalBg: 'bg-warning-50',
    modalBorder: 'border-warning-200',
    modalText: 'text-warning-700'
  },
  danger: {
    dot: 'bg-danger',
    compact: 'bg-danger text-danger-foreground shadow-sm',
    modalBg: 'bg-danger-50',
    modalBorder: 'border-danger-200',
    modalText: 'text-danger-700'
  },
  default: {
    dot: 'bg-default-500',
    compact: 'bg-default-400 text-white shadow-sm',
    modalBg: 'bg-default-50',
    modalBorder: 'border-default-200',
    modalText: 'text-default-700'
  }
}

const getEventStyle = (color?: string) => {
  if (!color) return EVENT_COLOR_STYLES.default
  const key = color.toLowerCase()
  return EVENT_COLOR_STYLES[key] || EVENT_COLOR_STYLES.default
}

const canJoinEvent = (event: CalendarEvent) => {
  const startTime = event.time ? event.time.split('-')[0].trim() : '00:00'
  const startDateTime = dayjs(`${event.date} ${startTime}`)
  if (!startDateTime.isValid()) return false
  return dayjs().isAfter(startDateTime.subtract(10, 'minute'))
}

const FullCalendarEvents: React.FC<CalendarComponentProps> = ({ events, onEventClick, currentDate, view, onDateChange, onViewChange }) => {
  const [selectedDate, setSelectedDate] = React.useState<dayjs.Dayjs | null>(null)
  const [dayPreview, setDayPreview] = React.useState<{ date: dayjs.Dayjs; events: CalendarEvent[] } | null>(null)

  const getEventsForDate = (date: dayjs.Dayjs) => {
    return events.filter(event => dayjs(event.date).isSame(date, 'day'))
  }

  const getCalendarDays = () => {
    const startOfMonth = currentDate.startOf('month')
    const endOfMonth = currentDate.endOf('month')
    const startOfCalendar = startOfMonth.startOf('week')
    const endOfCalendar = endOfMonth.endOf('week')

    const days = []
    let current = startOfCalendar

    while (current.isSameOrBefore(endOfCalendar)) {
      days.push(current)
      current = current.add(1, 'day')
    }

    return days
  }

  const openDayPreview = (day: dayjs.Dayjs, eventsForDay: CalendarEvent[]) => {
    if (eventsForDay.length === 0) return
    setDayPreview({ date: day, events: eventsForDay })
  }

  const closeDayPreview = () => setDayPreview(null)

  const renderEvent = (event: CalendarEvent, isCompact = false) => {
    const colorStyle = getEventStyle(event.color)
    const joinable = canJoinEvent(event)

    if (isCompact) {
      return (
        <div
          key={event.id}
          onClick={() => onEventClick(event)}
          className={`min-h-[50px] cursor-pointer truncate rounded-md px-3 py-2 text-sm font-medium transition-all sm:min-h-[auto] sm:px-2 sm:py-1 sm:text-xs ${colorStyle.compact}`}>
          <div className='text-sm font-semibold sm:text-xs'>{event.time}</div>
          <div className='truncate text-sm leading-tight opacity-90 sm:text-xs'>{event.title}</div>
        </div>
      )
    }

    return (
      <Card key={event.id} className='mb-3 cursor-pointer transition-all' isPressable onPress={() => onEventClick(event)}>
        <CardBody className='p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='mb-2 flex items-center gap-2'>
                <div className={`h-3 w-3 rounded-full ${colorStyle.dot}`}></div>
                <h4 className='truncate text-sm font-semibold text-foreground'>{event.title}</h4>
              </div>
              <p className='mb-3 line-clamp-2 text-sm text-foreground/70'>{event.topic}</p>
              <div className='flex items-center gap-4 text-xs text-foreground/60'>
                <span className='flex items-center gap-1'>
                  <Icon icon='mdi:clock-outline' width={14} height={14} />
                  {event.time} ({event.duration} นาที)
                </span>
                <span className='flex items-center gap-1'>
                  <Icon icon='mdi:account-outline' width={14} height={14} />
                  {event.teacher}
                </span>
              </div>
            </div>
            <Chip
              size='sm'
              variant='dot'
              color={event.type === 'Private Class' ? 'primary' : event.type === 'Group Discussion' ? 'secondary' : 'primary'}>
              {event.type === 'Private Class' ? 'ติวเตอร์' : event.type === 'Group Discussion' ? 'กลุ่ม' : 'ข่าว'}
            </Chip>
          </div>
          <Button
            size='sm'
            color='primary'
            variant={joinable ? 'solid' : 'flat'}
            isDisabled={!joinable || !event.meetingUrl}
            className='mt-4 w-full'
            startContent={<Icon icon='mdi:video' width={16} height={16} />}
            onPress={() => {
              if (joinable && event.meetingUrl) {
                window.open(event.meetingUrl, '_blank')
              }
            }}>
            {joinable ? 'เข้าเรียน' : 'รอเวลา'}
          </Button>
        </CardBody>
      </Card>
    )
  }

  if (view === 'month') {
    const days = getCalendarDays()
    const weekDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์']

    return (
      <>
        {/* Mobile View */}
        <div className='block sm:hidden'>
          <Card className='shadow-sm'>
            <CardBody className='p-3 pt-0'>
              {/* Mini Calendar */}
              <div className='mb-4'>
                {/* Week day headers */}
                <div className='mb-2 grid grid-cols-7 gap-1'>
                  {weekDays.map(day => (
                    <div key={day} className='p-2 text-center text-xs font-medium text-foreground/60'>
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className='grid grid-cols-7 gap-1'>
                  {days.map(day => {
                    const dayEvents = getEventsForDate(day)
                    const isCurrentMonth = day.month() === currentDate.month()
                    const isToday = day.isSame(dayjs(), 'day')
                    const isSelected = selectedDate?.isSame(day, 'day')
                    const dayKey = day.format('YYYY-MM-DD')
                    const dayStateClass = isCurrentMonth
                      ? isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isToday
                          ? 'bg-primary-100 font-bold text-primary'
                          : 'text-foreground hover:bg-content2'
                      : 'text-foreground/30'

                    return (
                      <div
                        key={dayKey}
                        onClick={() => {
                          if (isCurrentMonth) {
                            setSelectedDate(isSelected ? null : day)
                          }
                        }}
                        className={`relative flex h-12 cursor-pointer items-center justify-center rounded-lg text-sm font-medium transition-all ${dayStateClass}`}>
                        {day.format('D')}
                        {/* Event indicator dots */}
                        {dayEvents.length > 0 && isCurrentMonth && (
                          <div className='absolute bottom-1 right-1 flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm'>
                            {dayEvents.length}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Selected Date Events */}
              {selectedDate && (
                <div className='rounded-lg border border-divider bg-content1 p-4'>
                  <div className='mb-3 flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-foreground'>{selectedDate.format('dddd')}</h3>
                      <p className='text-sm text-foreground/60'>{selectedDate.format('DD MMMM YYYY')}</p>
                    </div>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className='rounded-full p-1 text-foreground/40 hover:bg-content2 hover:text-foreground'>
                      <Icon icon='mdi:close' width={20} height={20} />
                    </button>
                  </div>

                  {(() => {
                    const selectedDateEvents = getEventsForDate(selectedDate)
                    return selectedDateEvents.length > 0 ? (
                      <div className='space-y-2'>
                        {selectedDateEvents.map(event => {
                          const colorStyle = getEventStyle(event.color)
                          return (
                            <div
                              key={event.id}
                              onClick={() => onEventClick(event)}
                              className={`cursor-pointer rounded-lg p-3 transition-all ${colorStyle.compact}`}>
                              <div className='flex items-center justify-between gap-2'>
                                <div className='min-w-0 flex-1'>
                                  <div className='text-sm font-semibold'>{event.time}</div>
                                  <div className='text-sm opacity-90'>{event.title}</div>
                                  <div className='text-xs opacity-80'>{event.teacher}</div>
                                </div>
                                <Chip size='sm' variant='flat' color='default' className='bg-white/20'>
                                  {event.duration}น
                                </Chip>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className='py-6 text-center text-sm text-foreground/40'>ไม่มีคลาสในวันนี้</div>
                    )
                  })()}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Desktop View */}
        <Card className='hidden shadow-sm sm:block'>
          <CardBody className='p-0'>
            {/* Week day headers */}
            <div className='grid grid-cols-7 border-b border-divider'>
              {weekDays.map(day => (
                <div
                  key={day}
                  className='border-r border-divider bg-content2 p-3 text-center text-base font-semibold text-foreground/80 last:border-r-0 sm:p-3 sm:text-sm'>
                  <div className='hidden sm:block'>{day}</div>
                  <div className='block sm:hidden'>{day.slice(0, 3)}</div>
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className='grid grid-cols-7'>
              {days.map(day => {
                const dayEvents = getEventsForDate(day)
                const isCurrentMonth = day.month() === currentDate.month()
                const isToday = day.isSame(dayjs(), 'day')
                const isWeekend = day.day() === 0 || day.day() === 6
                const dayKey = day.format('YYYY-MM-DD')
                const dayBackgroundClass = isCurrentMonth ? 'bg-content1' : 'bg-content1 text-foreground/40'

                return (
                  <div
                    key={dayKey}
                    className={`min-h-[140px] border-b border-r border-divider p-3 transition-colors hover:bg-content2/50 sm:min-h-[120px] sm:p-3 ${dayBackgroundClass} ${isToday ? 'border-primary-200 bg-primary-50' : ''} ${isWeekend && isCurrentMonth ? 'bg-content2/30' : ''} last:border-r-0`}>
                    <div
                      className={`mb-3 flex items-center justify-between text-lg font-medium sm:text-sm ${
                        isToday ? 'font-bold text-primary' : isCurrentMonth ? 'text-foreground' : 'text-foreground/40'
                      }`}>
                      <div className='flex items-center gap-1'>
                        {isToday ? (
                          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground sm:h-6 sm:w-6 sm:text-xs'>
                            {day.format('D')}
                          </div>
                        ) : (
                          <span className='text-lg sm:text-sm'>{day.format('D')}</span>
                        )}
                      </div>
                      {dayEvents.length > 1 && isCurrentMonth && (
                        <button
                          type='button'
                          onClick={() => openDayPreview(day, dayEvents)}
                          className='rounded-md border border-default-200 px-2 py-1 text-[11px] font-medium text-default-600 transition-colors hover:border-primary/60 hover:text-primary'>
                          ดูทั้งหมด
                        </button>
                      )}
                    </div>

                    <div className='space-y-1'>
                      {dayEvents.slice(0, 2).map(event => renderEvent(event, true))}
                      {dayEvents.length > 2 && (
                        <button
                          type='button'
                          onClick={() => openDayPreview(day, dayEvents)}
                          className='w-full rounded-md bg-default-100 px-2 py-1 text-center text-xs font-medium text-default-600 transition-colors hover:bg-default-200'>
                          +{dayEvents.length - 2} คลาสเพิ่มเติม
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>

        <Modal isOpen={!!dayPreview} onClose={closeDayPreview} size='md'>
          <ModalContent>
            <ModalHeader className='flex flex-col gap-1'>
              <p className='text-sm font-medium text-foreground/60'>คลาสทั้งหมด</p>
              <h3 className='text-lg font-semibold text-foreground'>{dayPreview?.date.format('DD MMMM YYYY')}</h3>
            </ModalHeader>
            <ModalBody className='space-y-3'>
              {dayPreview?.events.map(event => {
                const colorStyle = getEventStyle(event.color)
                const joinable = canJoinEvent(event)
                return (
                  <div
                    key={event.id}
                    className={`rounded-lg border ${colorStyle.modalBorder} ${colorStyle.modalBg} p-4 transition-colors hover:border-primary/40`}>
                    <div className='mb-2 flex items-start justify-between gap-3'>
                      <div className='min-w-0 flex-1'>
                        <p className={`text-sm font-semibold ${colorStyle.modalText}`}>{event.title}</p>
                        <p className='text-xs text-foreground/60'>{event.topic}</p>
                      </div>
                      <Chip size='sm' variant='flat' color={event.color as any} className='shrink-0'>
                        {event.type}
                      </Chip>
                    </div>
                    <div className='mb-3 flex flex-wrap gap-3 text-xs text-foreground/60'>
                      <span className='flex items-center gap-1'>
                        <Icon icon='mdi:clock-outline' width={14} height={14} />
                        {event.time} ({event.duration} นาที)
                      </span>
                      <span className='flex items-center gap-1'>
                        <Icon icon='mdi:account-outline' width={14} height={14} />
                        {event.teacher}
                      </span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        size='sm'
                        color='primary'
                        variant={joinable ? 'solid' : 'flat'}
                        isDisabled={!joinable || !event.meetingUrl}
                        startContent={<Icon icon='mdi:video' width={16} height={16} />}
                        onPress={() => {
                          if (joinable && event.meetingUrl) {
                            window.open(event.meetingUrl, '_blank')
                          }
                        }}>
                        {joinable ? 'เข้าเรียน' : 'รอเวลา'}
                      </Button>
                      <Button
                        size='sm'
                        variant='light'
                        color='default'
                        startContent={<Icon icon='mdi:eye' width={16} height={16} />}
                        onPress={() => {
                          closeDayPreview()
                          onEventClick(event)
                        }}>
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </div>
                )
              })}
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    )
  }
}

export default FullCalendarEvents
