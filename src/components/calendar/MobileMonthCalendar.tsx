'use client'

import React, { useEffect, useMemo, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import Icon from '@/components/icon'

export type MobileCalendarEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'
  typeLabel?: string
  teacher?: string
}

interface MobileMonthCalendarProps {
  events: MobileCalendarEvent[]
  currentDate: Dayjs
  onDateChange: (direction: 'prev' | 'next') => void
  onEventClick?: (event: MobileCalendarEvent) => void
}

const weekdayShort = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const MobileMonthCalendar: React.FC<MobileMonthCalendarProps> = ({ events, currentDate, onDateChange, onEventClick }) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(currentDate)

  useEffect(() => {
    setSelectedDate(currentDate)
  }, [currentDate])

  const colorClassMap: Record<NonNullable<MobileCalendarEvent['color']>, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    default: 'bg-default-500'
  }

  const monthMatrix = useMemo(() => {
    // Start from the first day shown in grid (start of week that contains the 1st)
    const start = currentDate.startOf('month').startOf('week')
    // Show 6 weeks grid (42 cells)
    return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'))
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const map: Record<string, MobileCalendarEvent[]> = {}
    for (const ev of events) {
      const d = dayjs(ev.date).format('YYYY-MM-DD')
      if (!map[d]) map[d] = []
      map[d].push(ev)
    }
    return map
  }, [events])

  const selectedKey = selectedDate.format('YYYY-MM-DD')
  const selectedEvents = eventsByDate[selectedKey] || []

  const isSameDay = (a: Dayjs, b: Dayjs) => a.isSame(b, 'day')
  const isSameMonth = (d: Dayjs, ref: Dayjs) => d.isSame(ref, 'month')

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='mb-3 flex items-center justify-between'>
        <button
          aria-label='previous month'
          className='flex h-9 w-9 items-center justify-center rounded-lg border border-default-200 bg-white hover:bg-default-50'
          onClick={() => onDateChange('prev')}>
          <Icon icon='mdi:chevron-left' width={20} height={20} />
        </button>
        <div className='text-sm font-semibold text-foreground'>{currentDate.format('MMMM YYYY')}</div>
        <button
          aria-label='next month'
          className='flex h-9 w-9 items-center justify-center rounded-lg border border-default-200 bg-white hover:bg-default-50'
          onClick={() => onDateChange('next')}>
          <Icon icon='mdi:chevron-right' width={20} height={20} />
        </button>
      </div>

      {/* Weekdays */}
      <div className='mb-2 grid grid-cols-7 gap-1 text-center text-xs text-foreground/70'>
        {weekdayShort.map(d => (
          <div key={d} className='py-1'>
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className='grid grid-cols-7 gap-1'>
        {monthMatrix.map((d, idx) => {
          const key = d.format('YYYY-MM-DD')
          const hasEvents = !!eventsByDate[key]
          const isToday = isSameDay(d, dayjs())
          const inMonth = isSameMonth(d, currentDate)
          const isSelected = isSameDay(d, selectedDate)
          return (
            <button
              key={key}
              onClick={() => setSelectedDate(d)}
              className={[
                'relative flex h-10 items-center justify-center rounded-lg border text-sm',
                inMonth ? 'border-default-200 bg-white' : 'border-default-100 bg-default-50 text-foreground/40',
                isSelected ? 'ring-2 ring-primary/60' : '',
                'active:scale-[0.98]'
              ].join(' ')}>
              <span className={['z-10', isToday ? 'font-semibold text-primary' : ''].join(' ')}>{d.date()}</span>
              {hasEvents && (
                <span className='absolute bottom-1 right-1 flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm'>
                  {eventsByDate[key].length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day events */}
      <div className='mt-4'>
        {selectedEvents.length === 0 ? (
          <div className='rounded-lg border border-default-200 bg-default-50 p-3 text-center text-xs text-foreground/70'>ไม่มีคลาสในวันนี้</div>
        ) : (
          <div className='space-y-2'>
            {selectedEvents.map(ev => (
              <button
                key={ev.id}
                onClick={() => onEventClick?.(ev)}
                className='w-full rounded-lg border border-default-200 bg-white p-3 text-left hover:bg-default-50 active:scale-[0.99]'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${ev.color ? colorClassMap[ev.color] : 'bg-primary'}`}></span>
                      <p className='text-sm font-semibold text-foreground'>{ev.title}</p>
                    </div>
                    {ev.typeLabel && <p className='text-xs font-medium text-foreground/70'>{ev.typeLabel}</p>}
                    {ev.teacher && <p className='text-xs text-foreground/60'>ครู {ev.teacher}</p>}
                  </div>
                  {ev.time && <p className='text-xs font-semibold text-foreground/80'>{ev.time}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileMonthCalendar
