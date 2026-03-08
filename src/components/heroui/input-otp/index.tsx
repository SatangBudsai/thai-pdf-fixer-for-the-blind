import { Fragment } from 'react'
import { InputOtp as InputOtpHeroUI } from '@heroui/react'

type InputOtpProps = React.ComponentProps<typeof InputOtpHeroUI> & {}

const InputOtp = ({ ...props }: InputOtpProps) => {
  return (
    <Fragment>
      <InputOtpHeroUI {...props} />
    </Fragment>
  )
}

export default InputOtp
