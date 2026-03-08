import { Fragment } from 'react'
import { Calendar as CalendarHeroUI, RangeCalendar as RangeCalendarHeroUI } from '@heroui/react'

type CalendarProps = React.ComponentProps<typeof CalendarHeroUI> & {}

const Calendar = ({ ...props }: CalendarProps) => {
  return (
    <Fragment>
      <CalendarHeroUI {...props} />
    </Fragment>
  )
}

type RangeCalendarProps = React.ComponentProps<typeof RangeCalendarHeroUI> & {}

const RangeCalendar = ({ ...props }: RangeCalendarProps) => {
  return (
    <Fragment>
      <RangeCalendarHeroUI {...props} />
    </Fragment>
  )
}

export default Calendar
export { RangeCalendar }
