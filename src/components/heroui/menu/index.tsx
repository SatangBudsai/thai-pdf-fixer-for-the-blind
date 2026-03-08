import { Fragment } from 'react'
import { Menu as MenuHeroUI, MenuItem as MenuItemHeroUI, MenuSection as MenuSectionHeroUI } from '@heroui/react'

type MenuProps = React.ComponentProps<typeof MenuHeroUI> & {}

const Menu = ({ ...props }: MenuProps) => {
  return (
    <Fragment>
      <MenuHeroUI {...props} />
    </Fragment>
  )
}

type MenuItemProps = React.ComponentProps<typeof MenuItemHeroUI> & {}

const MenuItem = ({ ...props }: MenuItemProps) => {
  return (
    <Fragment>
      <MenuItemHeroUI {...props} />
    </Fragment>
  )
}

type MenuSectionProps = React.ComponentProps<typeof MenuSectionHeroUI> & {}

const MenuSection = ({ ...props }: MenuSectionProps) => {
  return (
    <Fragment>
      <MenuSectionHeroUI {...props} />
    </Fragment>
  )
}

export default Menu
export { MenuItem, MenuSection }
