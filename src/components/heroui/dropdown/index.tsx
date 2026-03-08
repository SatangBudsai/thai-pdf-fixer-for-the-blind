import { Fragment } from 'react'
import {
  Dropdown as DropdownHeroUI,
  DropdownTrigger as DropdownTriggerHeroUI,
  DropdownMenu as DropdownMenuHeroUI,
  DropdownItem as DropdownItemHeroUI,
  DropdownSection as DropdownSectionHeroUI
} from '@heroui/react'

type DropdownProps = React.ComponentProps<typeof DropdownHeroUI> & {}

const Dropdown = ({ ...props }: DropdownProps) => {
  return (
    <Fragment>
      <DropdownHeroUI {...props} />
    </Fragment>
  )
}

type DropdownTriggerProps = React.ComponentProps<typeof DropdownTriggerHeroUI> & {}

const DropdownTrigger = ({ ...props }: DropdownTriggerProps) => {
  return (
    <Fragment>
      <DropdownTriggerHeroUI {...props} />
    </Fragment>
  )
}

type DropdownMenuProps = React.ComponentProps<typeof DropdownMenuHeroUI> & {}

const DropdownMenu = ({ ...props }: DropdownMenuProps) => {
  return (
    <Fragment>
      <DropdownMenuHeroUI {...props} />
    </Fragment>
  )
}

type DropdownItemProps = React.ComponentProps<typeof DropdownItemHeroUI> & {}

const DropdownItem = ({ ...props }: DropdownItemProps) => {
  return (
    <Fragment>
      <DropdownItemHeroUI {...props} />
    </Fragment>
  )
}

type DropdownSectionProps = React.ComponentProps<typeof DropdownSectionHeroUI> & {}

const DropdownSection = ({ ...props }: DropdownSectionProps) => {
  return (
    <Fragment>
      <DropdownSectionHeroUI {...props} />
    </Fragment>
  )
}

export default Dropdown
export { DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection }
