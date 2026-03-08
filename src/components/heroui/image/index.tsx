import { Fragment } from 'react'
import { Image as ImageHeroUI } from '@heroui/react'

type ImageProps = React.ComponentProps<typeof ImageHeroUI> & {}

const Image = ({ ...props }: ImageProps) => {
  return (
    <Fragment>
      <ImageHeroUI {...props} />
    </Fragment>
  )
}

export default Image
