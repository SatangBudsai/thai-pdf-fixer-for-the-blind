import { Fragment } from 'react'
import { Code as CodeHeroUI } from '@heroui/react'

type CodeProps = React.ComponentProps<typeof CodeHeroUI> & {}

const Code = ({ ...props }: CodeProps) => {
  return (
    <Fragment>
      <CodeHeroUI {...props} />
    </Fragment>
  )
}

export default Code
