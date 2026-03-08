import { Fragment } from 'react'
import { User as UserHeroUI } from '@heroui/react'

type UserProps = React.ComponentProps<typeof UserHeroUI> & {}

const User = ({ ...props }: UserProps) => {
  return (
    <Fragment>
      <UserHeroUI {...props} />
    </Fragment>
  )
}

export default User
