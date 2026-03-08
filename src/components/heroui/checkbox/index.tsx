import { Fragment } from 'react'
import { Checkbox as CheckboxHeroUI, CheckboxGroup as CheckboxGroupHeroUI } from '@heroui/react'

type CheckboxProps = React.ComponentProps<typeof CheckboxHeroUI> & {}

const Checkbox = ({ ...props }: CheckboxProps) => {
  return (
    <Fragment>
      <CheckboxHeroUI {...props} />
    </Fragment>
  )
}

type CheckboxGroupProps = React.ComponentProps<typeof CheckboxGroupHeroUI> & {}

const CheckboxGroup = ({ ...props }: CheckboxGroupProps) => {
  return (
    <Fragment>
      <CheckboxGroupHeroUI {...props} />
    </Fragment>
  )
}

export default Checkbox
export { CheckboxGroup }
