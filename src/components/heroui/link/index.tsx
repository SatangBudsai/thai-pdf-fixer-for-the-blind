import { Fragment } from 'react'
import { Link as LinkHeroUI } from '@heroui/react'

type LinkProps = React.ComponentProps<typeof LinkHeroUI> & {}

const Link = ({ ...props }: LinkProps) => {
  return (
    <Fragment>
      <LinkHeroUI {...props} />
    </Fragment>
  )
}

export default Link
