import { Fragment } from 'react'
import {
  Listbox as ListboxHeroUI,
  ListboxItem as ListboxItemHeroUI,
  ListboxSection as ListboxSectionHeroUI
} from '@heroui/react'

type ListboxProps = React.ComponentProps<typeof ListboxHeroUI> & {}

const Listbox = ({ ...props }: ListboxProps) => {
  return (
    <Fragment>
      <ListboxHeroUI {...props} />
    </Fragment>
  )
}

type ListboxItemProps = React.ComponentProps<typeof ListboxItemHeroUI> & {}

const ListboxItem = ({ ...props }: ListboxItemProps) => {
  return (
    <Fragment>
      <ListboxItemHeroUI {...props} />
    </Fragment>
  )
}

type ListboxSectionProps = React.ComponentProps<typeof ListboxSectionHeroUI> & {}

const ListboxSection = ({ ...props }: ListboxSectionProps) => {
  return (
    <Fragment>
      <ListboxSectionHeroUI {...props} />
    </Fragment>
  )
}

export default Listbox
export { ListboxItem, ListboxSection }
