import { Fragment } from 'react'
import { Snippet as SnippetHeroUI } from '@heroui/react'

type SnippetProps = React.ComponentProps<typeof SnippetHeroUI> & {}

const Snippet = ({ ...props }: SnippetProps) => {
  return (
    <Fragment>
      <SnippetHeroUI {...props} />
    </Fragment>
  )
}

export default Snippet
