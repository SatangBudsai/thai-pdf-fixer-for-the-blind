import { Fragment } from 'react'
import { Switch as SwitchHeroUI } from '@heroui/react'

type SwitchProps = React.ComponentProps<typeof SwitchHeroUI> & {}

const Switch = ({ ...props }: SwitchProps) => {
  return (
    <Fragment>
      <SwitchHeroUI {...props} />
    </Fragment>
  )
}

export default Switch
