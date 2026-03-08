import React from 'react'
import { Card, CardBody, Button, Chip, Divider } from '@heroui/react'
import { Icon } from '@iconify/react'
import dayjs from 'dayjs'
import type { ProductTypeRelation } from '@/api/generated/main-service/apiGenerated'

interface BookedSession {
  id: string
  date: string
  time: string
  topic: string
  status: 'upcoming' | 'completed' | 'cancelled'
  meetingUrl?: string
  teacher: string
  notes?: string
  rating?: number
}

interface MyLearningSectionProps {
  productData: ProductTypeRelation
  bookedSessions?: BookedSession[]
  completedSessions?: BookedSession[]
}

const MyLearningSection: React.FC<MyLearningSectionProps> = ({ productData, bookedSessions = [], completedSessions = [] }) => {
  const upcomingSessions = bookedSessions.filter(session => session.status === 'upcoming')
  const totalSessions = bookedSessions.length + completedSessions.length

  return (
    <div className='space-y-4'>
      {/* Combined Sessions Card */}
      {(upcomingSessions.length > 0 || completedSessions.length > 0) && (
        <Card className='border border-primary/20 shadow-sm'>
          <CardBody className='p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='flex items-center justify-center rounded-lg bg-primary/10 p-2'>
                  <Icon icon='mdi:calendar-clock' width={18} className='text-primary' />
                </div>
                <h3 className='text-base font-semibold text-foreground'>คลาสของฉัน</h3>
              </div>
              <Chip size='sm' color='primary' variant='flat'>
                {totalSessions} คลาส
              </Chip>
            </div>

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <div className='mb-4'>
                <div className='mb-2 flex items-center gap-2'>
                  <h4 className='text-sm font-medium text-foreground'>คลาสที่จองแล้ว ({upcomingSessions.length})</h4>
                </div>
                <div className='space-y-2'>
                  {upcomingSessions.slice(0, 2).map((session, index) => (
                    <div key={session.id} className='rounded-lg border border-primary/20 bg-primary/5 p-3'>
                      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='min-w-0 flex-1'>
                          <div className='mb-1 flex flex-wrap items-center gap-2'>
                            <span className='rounded bg-primary/20 px-2 py-1 text-sm font-medium text-primary'>
                              {dayjs(session.date).format('DD MMM')}
                            </span>
                            <span className='text-sm font-medium text-foreground'>{session.time}</span>
                            <span className='text-xs text-foreground/70'>• {session.teacher}</span>
                          </div>
                          <p className='line-clamp-1 text-sm text-foreground/80'>{session.topic}</p>
                        </div>
                        <div className='flex flex-shrink-0 gap-2'>
                          <Button size='sm' color='primary' variant='bordered' className='px-2 text-xs'>
                            เปลี่ยน
                          </Button>
                          <Button size='sm' color='primary' startContent={<Icon icon='mdi:video' width={14} />} className='px-2 text-xs'>
                            เข้าเรียน
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {upcomingSessions.length > 2 && (
                  <div className='mt-2 text-center'>
                    <Button size='sm' color='primary' variant='flat' className='text-xs'>
                      ดูทั้งหมด +{upcomingSessions.length - 2}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Divider between sections */}
            {upcomingSessions.length > 0 && completedSessions.length > 0 && <Divider className='my-4' />}

            {/* Learning History */}
            {completedSessions.length > 0 && (
              <div>
                <div className='mb-2 flex items-center gap-2'>
                  <h4 className='text-sm font-medium text-foreground'>ประวัติการเรียน ({completedSessions.length})</h4>
                </div>
                <div className='space-y-2'>
                  {completedSessions.slice(0, 2).map((session, index) => (
                    <div key={session.id} className='rounded-lg border border-success/20 bg-success/5 p-3'>
                      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='min-w-0 flex-1'>
                          <div className='mb-1 flex flex-wrap items-center gap-2'>
                            <span className='rounded bg-success/20 px-2 py-1 text-sm font-medium text-success'>
                              {dayjs(session.date).format('DD MMM')}
                            </span>
                            <span className='text-sm font-medium text-foreground'>{session.time}</span>
                            <span className='text-xs text-foreground/70'>• {session.teacher}</span>
                          </div>
                          <p className='line-clamp-1 text-sm text-foreground/80'>{session.topic}</p>
                          {session.notes && <p className='line-clamp-1 text-xs text-foreground/60'>หมายเหตุ: {session.notes}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {completedSessions.length > 2 && (
                  <div className='mt-2 text-center'>
                    <Button size='sm' color='success' variant='flat' className='text-xs'>
                      ดูประวัติทั้งหมด +{completedSessions.length - 2}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default MyLearningSection
