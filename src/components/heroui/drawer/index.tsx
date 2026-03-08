import { Fragment } from 'react'
import {
  Drawer as DrawerHeroUI,
  DrawerContent as DrawerContentHeroUI,
  DrawerHeader as DrawerHeaderHeroUI,
  DrawerBody as DrawerBodyHeroUI,
  DrawerFooter as DrawerFooterHeroUI
} from '@heroui/react'

type DrawerProps = React.ComponentProps<typeof DrawerHeroUI> & {}

const Drawer = ({ ...props }: DrawerProps) => {
  return (
    <Fragment>
      <DrawerHeroUI {...props} />
    </Fragment>
  )
}

type DrawerContentProps = React.ComponentProps<typeof DrawerContentHeroUI> & {}

const DrawerContent = ({ ...props }: DrawerContentProps) => {
  return (
    <Fragment>
      <DrawerContentHeroUI {...props} />
    </Fragment>
  )
}

type DrawerHeaderProps = React.ComponentProps<typeof DrawerHeaderHeroUI> & {}

const DrawerHeader = ({ ...props }: DrawerHeaderProps) => {
  return (
    <Fragment>
      <DrawerHeaderHeroUI {...props} />
    </Fragment>
  )
}

type DrawerBodyProps = React.ComponentProps<typeof DrawerBodyHeroUI> & {}

const DrawerBody = ({ ...props }: DrawerBodyProps) => {
  return (
    <Fragment>
      <DrawerBodyHeroUI {...props} />
    </Fragment>
  )
}

type DrawerFooterProps = React.ComponentProps<typeof DrawerFooterHeroUI> & {}

const DrawerFooter = ({ ...props }: DrawerFooterProps) => {
  return (
    <Fragment>
      <DrawerFooterHeroUI {...props} />
    </Fragment>
  )
}

export default Drawer
export { DrawerContent, DrawerHeader, DrawerBody, DrawerFooter }
