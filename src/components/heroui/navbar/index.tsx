import { Fragment } from 'react'
import {
  Navbar as NavbarHeroUI,
  NavbarBrand as NavbarBrandHeroUI,
  NavbarContent as NavbarContentHeroUI,
  NavbarItem as NavbarItemHeroUI,
  NavbarMenuToggle as NavbarMenuToggleHeroUI,
  NavbarMenu as NavbarMenuHeroUI,
  NavbarMenuItem as NavbarMenuItemHeroUI
} from '@heroui/react'

type NavbarProps = React.ComponentProps<typeof NavbarHeroUI> & {}

const Navbar = ({ ...props }: NavbarProps) => {
  return (
    <Fragment>
      <NavbarHeroUI {...props} />
    </Fragment>
  )
}

type NavbarBrandProps = React.ComponentProps<typeof NavbarBrandHeroUI> & {}

const NavbarBrand = ({ ...props }: NavbarBrandProps) => {
  return (
    <Fragment>
      <NavbarBrandHeroUI {...props} />
    </Fragment>
  )
}

type NavbarContentProps = React.ComponentProps<typeof NavbarContentHeroUI> & {}

const NavbarContent = ({ ...props }: NavbarContentProps) => {
  return (
    <Fragment>
      <NavbarContentHeroUI {...props} />
    </Fragment>
  )
}

type NavbarItemProps = React.ComponentProps<typeof NavbarItemHeroUI> & {}

const NavbarItem = ({ ...props }: NavbarItemProps) => {
  return (
    <Fragment>
      <NavbarItemHeroUI {...props} />
    </Fragment>
  )
}

type NavbarMenuToggleProps = React.ComponentProps<typeof NavbarMenuToggleHeroUI> & {}

const NavbarMenuToggle = ({ ...props }: NavbarMenuToggleProps) => {
  return (
    <Fragment>
      <NavbarMenuToggleHeroUI {...props} />
    </Fragment>
  )
}

type NavbarMenuProps = React.ComponentProps<typeof NavbarMenuHeroUI> & {}

const NavbarMenu = ({ ...props }: NavbarMenuProps) => {
  return (
    <Fragment>
      <NavbarMenuHeroUI {...props} />
    </Fragment>
  )
}

type NavbarMenuItemProps = React.ComponentProps<typeof NavbarMenuItemHeroUI> & {}

const NavbarMenuItem = ({ ...props }: NavbarMenuItemProps) => {
  return (
    <Fragment>
      <NavbarMenuItemHeroUI {...props} />
    </Fragment>
  )
}

export default Navbar
export { NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem }
