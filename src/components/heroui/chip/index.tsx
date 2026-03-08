import { Fragment } from 'react'
import { Chip as ChipHeroUI } from '@heroui/react'

type ChipProps = React.ComponentProps<typeof ChipHeroUI> & {}

const Chip = ({ ...props }: ChipProps) => {
  return (
    <Fragment>
      <ChipHeroUI {...props} />
    </Fragment>
  )
}

export default Chip
