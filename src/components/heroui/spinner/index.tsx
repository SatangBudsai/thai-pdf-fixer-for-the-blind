import { Fragment } from 'react'
import { Spinner as SpinnerHeroUI } from '@heroui/react'

type SpinnerProps = React.ComponentProps<typeof SpinnerHeroUI> & {}

const Spinner = ({ ...props }: SpinnerProps) => {
  return (
    <Fragment>
      <SpinnerHeroUI {...props} />
    </Fragment>
  )
}

export default Spinner
