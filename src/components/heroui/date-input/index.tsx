import { Fragment } from 'react'
import { DateInput as DateInputHeroUI } from '@heroui/react'

type DateInputProps = React.ComponentProps<typeof DateInputHeroUI> & {}

const DateInput = ({ ...props }: DateInputProps) => {
  return (
    <Fragment>
      <DateInputHeroUI {...props} />
    </Fragment>
  )
}

export default DateInput
