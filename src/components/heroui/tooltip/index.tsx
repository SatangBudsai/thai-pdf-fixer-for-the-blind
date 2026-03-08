import { Fragment } from 'react'
import { Tooltip as TooltipHeroUI } from '@heroui/react'

type TooltipProps = React.ComponentProps<typeof TooltipHeroUI> & {}

const Tooltip = ({ ...props }: TooltipProps) => {
  return (
    <Fragment>
      <TooltipHeroUI {...props} />
    </Fragment>
  )
}

export default Tooltip
