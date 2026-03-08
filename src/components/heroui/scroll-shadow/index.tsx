import { Fragment } from 'react'
import { ScrollShadow as ScrollShadowHeroUI } from '@heroui/react'

type ScrollShadowProps = React.ComponentProps<typeof ScrollShadowHeroUI> & {}

const ScrollShadow = ({ ...props }: ScrollShadowProps) => {
  return (
    <Fragment>
      <ScrollShadowHeroUI {...props} />
    </Fragment>
  )
}

export default ScrollShadow
