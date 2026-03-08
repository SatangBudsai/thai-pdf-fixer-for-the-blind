import { Fragment } from 'react'
import { Badge as BadgeHeroUI } from '@heroui/react'

type BadgeProps = React.ComponentProps<typeof BadgeHeroUI> & {}

const Badge = ({ ...props }: BadgeProps) => {
  return (
    <Fragment>
      <BadgeHeroUI {...props} />
    </Fragment>
  )
}

export default Badge
