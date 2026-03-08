import { Fragment } from 'react'
import { DatePicker as DatePickerHeroUI, DateRangePicker as DateRangePickerHeroUI } from '@heroui/react'

type DatePickerProps = React.ComponentProps<typeof DatePickerHeroUI> & {}

const DatePicker = ({ ...props }: DatePickerProps) => {
  return (
    <Fragment>
      <DatePickerHeroUI {...props} />
    </Fragment>
  )
}

type DateRangePickerProps = React.ComponentProps<typeof DateRangePickerHeroUI> & {}

const DateRangePicker = ({ ...props }: DateRangePickerProps) => {
  return (
    <Fragment>
      <DateRangePickerHeroUI {...props} />
    </Fragment>
  )
}

export default DatePicker
export { DateRangePicker }
