import { Fragment } from 'react'
import { Spacer as SpacerHeroUI } from '@heroui/react'

type SpacerProps = React.ComponentProps<typeof SpacerHeroUI> & {}

const Spacer = ({ ...props }: SpacerProps) => {
  return (
    <Fragment>
      <SpacerHeroUI {...props} />
    </Fragment>
  )
}

export default Spacer
