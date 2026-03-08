import { Fragment } from 'react'
import { Progress as ProgressHeroUI } from '@heroui/react'

type ProgressProps = React.ComponentProps<typeof ProgressHeroUI> & {}

const Progress = ({ ...props }: ProgressProps) => {
  return (
    <Fragment>
      <ProgressHeroUI {...props} />
    </Fragment>
  )
}

export default Progress
