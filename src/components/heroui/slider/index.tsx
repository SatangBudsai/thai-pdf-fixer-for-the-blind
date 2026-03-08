import { Fragment } from 'react'
import { Slider as SliderHeroUI } from '@heroui/react'

type SliderProps = React.ComponentProps<typeof SliderHeroUI> & {}

const Slider = ({ ...props }: SliderProps) => {
  return (
    <Fragment>
      <SliderHeroUI {...props} />
    </Fragment>
  )
}

export default Slider
