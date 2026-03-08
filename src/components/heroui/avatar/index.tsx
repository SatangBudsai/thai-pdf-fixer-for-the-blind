import { Fragment } from 'react'
import { Avatar as AvatarHeroUI, AvatarGroup as AvatarGroupHeroUI } from '@heroui/react'

type AvatarProps = React.ComponentProps<typeof AvatarHeroUI> & {}

const Avatar = ({ ...props }: AvatarProps) => {
  return (
    <Fragment>
      <AvatarHeroUI {...props} />
    </Fragment>
  )
}

type AvatarGroupProps = React.ComponentProps<typeof AvatarGroupHeroUI> & {}

const AvatarGroup = ({ ...props }: AvatarGroupProps) => {
  return (
    <Fragment>
      <AvatarGroupHeroUI {...props} />
    </Fragment>
  )
}

export default Avatar
export { AvatarGroup }
