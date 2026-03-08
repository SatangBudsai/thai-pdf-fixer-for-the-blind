import { Fragment } from 'react'
import {
  Popover as PopoverHeroUI,
  PopoverTrigger as PopoverTriggerHeroUI,
  PopoverContent as PopoverContentHeroUI
} from '@heroui/react'

type PopoverProps = React.ComponentProps<typeof PopoverHeroUI> & {}

const Popover = ({ ...props }: PopoverProps) => {
  return (
    <Fragment>
      <PopoverHeroUI {...props} />
    </Fragment>
  )
}

type PopoverTriggerProps = React.ComponentProps<typeof PopoverTriggerHeroUI> & {}

const PopoverTrigger = ({ ...props }: PopoverTriggerProps) => {
  return (
    <Fragment>
      <PopoverTriggerHeroUI {...props} />
    </Fragment>
  )
}

type PopoverContentProps = React.ComponentProps<typeof PopoverContentHeroUI> & {}

const PopoverContent = ({ ...props }: PopoverContentProps) => {
  return (
    <Fragment>
      <PopoverContentHeroUI {...props} />
    </Fragment>
  )
}

export default Popover
export { PopoverTrigger, PopoverContent }
