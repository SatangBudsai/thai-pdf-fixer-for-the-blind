import { Fragment } from 'react'
import { Form as FormHeroUI } from '@heroui/react'

type FormProps = React.ComponentProps<typeof FormHeroUI> & {}

const Form = ({ ...props }: FormProps) => {
  return (
    <Fragment>
      <FormHeroUI {...props} />
    </Fragment>
  )
}

export default Form
