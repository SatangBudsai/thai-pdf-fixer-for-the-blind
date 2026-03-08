import { Fragment } from 'react'
import { Alert as AlertHeroUI } from '@heroui/react'

type AlertProps = React.ComponentProps<typeof AlertHeroUI> & {}

const Alert = ({ ...props }: AlertProps) => {
  return (
    <Fragment>
      <AlertHeroUI {...props} />
    </Fragment>
  )
}

export default Alert
