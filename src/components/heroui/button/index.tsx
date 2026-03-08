import { Fragment } from 'react'
import { Button as ButtonHeroUI, ButtonGroup as ButtonGroupHeroUI } from '@heroui/react'

type ButtonProps = React.ComponentProps<typeof ButtonHeroUI> & {}

const Button = ({ ...props }: ButtonProps) => {
  return (
    <Fragment>
      <ButtonHeroUI {...props} />
    </Fragment>
  )
}

type ButtonGroupProps = React.ComponentProps<typeof ButtonGroupHeroUI> & {}

const ButtonGroup = ({ ...props }: ButtonGroupProps) => {
  return (
    <Fragment>
      <ButtonGroupHeroUI {...props} />
    </Fragment>
  )
}

export default Button
export { ButtonGroup }
