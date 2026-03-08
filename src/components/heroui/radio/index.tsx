import { Fragment } from 'react'
import { Radio as RadioHeroUI, RadioGroup as RadioGroupHeroUI } from '@heroui/react'

type RadioProps = React.ComponentProps<typeof RadioHeroUI> & {}

const Radio = ({ ...props }: RadioProps) => {
  return (
    <Fragment>
      <RadioHeroUI {...props} />
    </Fragment>
  )
}

type RadioGroupProps = React.ComponentProps<typeof RadioGroupHeroUI> & {}

const RadioGroup = ({ ...props }: RadioGroupProps) => {
  return (
    <Fragment>
      <RadioGroupHeroUI {...props} />
    </Fragment>
  )
}

export default Radio
export { RadioGroup }
