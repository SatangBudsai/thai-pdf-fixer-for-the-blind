import { Fragment } from 'react'
import {
  Card as CardHeroUI,
  CardHeader as CardHeaderHeroUI,
  CardBody as CardBodyHeroUI,
  CardFooter as CardFooterHeroUI
} from '@heroui/react'

type CardProps = React.ComponentProps<typeof CardHeroUI> & {}

const Card = ({ ...props }: CardProps) => {
  return (
    <Fragment>
      <CardHeroUI {...props} />
    </Fragment>
  )
}

type CardHeaderProps = React.ComponentProps<typeof CardHeaderHeroUI> & {}

const CardHeader = ({ ...props }: CardHeaderProps) => {
  return (
    <Fragment>
      <CardHeaderHeroUI {...props} />
    </Fragment>
  )
}

type CardBodyProps = React.ComponentProps<typeof CardBodyHeroUI> & {}

const CardBody = ({ ...props }: CardBodyProps) => {
  return (
    <Fragment>
      <CardBodyHeroUI {...props} />
    </Fragment>
  )
}

type CardFooterProps = React.ComponentProps<typeof CardFooterHeroUI> & {}

const CardFooter = ({ ...props }: CardFooterProps) => {
  return (
    <Fragment>
      <CardFooterHeroUI {...props} />
    </Fragment>
  )
}

export default Card
export { CardHeader, CardBody, CardFooter }
