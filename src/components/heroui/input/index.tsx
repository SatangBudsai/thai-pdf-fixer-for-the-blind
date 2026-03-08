import { Fragment } from 'react'
import { Input as InputHeroUI } from '@heroui/react'
import Icon from '@/components/icon'

type InputProps = React.ComponentProps<typeof InputHeroUI> & {
  errorMessage?: string
  startIcon?: string
}

const Input = (props: InputProps) => {
  const { errorMessage, startIcon, ...rest } = props

  return (
    <Fragment>
      <div>
        <InputHeroUI
          startContent={
            startIcon ? (
              <Icon
                icon={startIcon}
                width={18}
                height={18}
                className={!!errorMessage || props.isInvalid ? 'text-danger' : 'text-primary'}
              />
            ) : null
          }
          {...rest}
        />
        {errorMessage && <p className='-mb-2 ml-4 mt-1 text-xs text-danger'>{errorMessage}</p>}
      </div>
    </Fragment>
  )
}

export default Input
