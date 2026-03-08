import { Fragment } from 'react'
import { Textarea as TextareaHeroUI } from '@heroui/react'

type TextareaProps = React.ComponentProps<typeof TextareaHeroUI> & {}

const Textarea = ({ ...props }: TextareaProps) => {
  return (
    <Fragment>
      <TextareaHeroUI
        {...props}
        {...(props.variant === 'bordered' ? { classNames: { inputWrapper: 'shadow-none' } } : {})}
      />
    </Fragment>
  )
}

export default Textarea
