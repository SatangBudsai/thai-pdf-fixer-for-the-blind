import { Fragment } from 'react'
import { Divider as DividerHeroUI } from '@heroui/react'

type DividerProps = React.ComponentProps<typeof DividerHeroUI> & {}

const Divider = ({ ...props }: DividerProps) => {
  return (
    <Fragment>
      <DividerHeroUI {...props} />
    </Fragment>
  )
}

export default Divider
