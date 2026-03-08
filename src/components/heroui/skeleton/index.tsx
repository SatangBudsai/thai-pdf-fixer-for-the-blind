import { Fragment } from 'react'
import { Skeleton as SkeletonHeroUI } from '@heroui/react'

type SkeletonProps = React.ComponentProps<typeof SkeletonHeroUI> & {}

const Skeleton = ({ ...props }: SkeletonProps) => {
  return (
    <Fragment>
      <SkeletonHeroUI {...props} />
    </Fragment>
  )
}

export default Skeleton
