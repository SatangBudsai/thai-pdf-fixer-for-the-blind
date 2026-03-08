import { Fragment } from 'react'
import { Kbd as KbdHeroUI } from '@heroui/react'

type KbdProps = React.ComponentProps<typeof KbdHeroUI> & {}

const Kbd = ({ ...props }: KbdProps) => {
  return (
    <Fragment>
      <KbdHeroUI {...props} />
    </Fragment>
  )
}

export default Kbd
