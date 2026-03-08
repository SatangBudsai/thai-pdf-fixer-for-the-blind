import { Fragment } from 'react'
import { CircularProgress as CircularProgressHeroUI } from '@heroui/react'

type CircularProgressProps = React.ComponentProps<typeof CircularProgressHeroUI> & {}

const CircularProgress = ({ ...props }: CircularProgressProps) => {
  return (
    <Fragment>
      <CircularProgressHeroUI {...props} />
    </Fragment>
  )
}

export default CircularProgress
