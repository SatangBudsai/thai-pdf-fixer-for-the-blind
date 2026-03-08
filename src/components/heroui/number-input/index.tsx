// Note: NumberInput component may not be available in current @heroui/react version
// This is a placeholder wrapper for when it becomes available

import { Fragment } from 'react'
// import { NumberInput as NumberInputHeroUI } from '@heroui/react'

// Placeholder component - uncomment when NumberInput is available
// type NumberInputProps = React.ComponentProps<typeof NumberInputHeroUI> & {}

// const NumberInput = ({ ...props }: NumberInputProps) => {
//   return (
//     <Fragment>
//       <NumberInputHeroUI {...props} />
//     </Fragment>
//   )
// }

// Temporary fallback to regular Input
import { Input } from '@heroui/react'

type NumberInputProps = React.ComponentProps<typeof Input> & {}

const NumberInput = ({ ...props }: NumberInputProps) => {
  return (
    <Fragment>
      <Input type='number' {...props} />
    </Fragment>
  )
}

export default NumberInput
