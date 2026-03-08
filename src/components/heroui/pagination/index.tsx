import { Fragment } from 'react'
import { Pagination as PaginationHeroUI } from '@heroui/react'

type PaginationProps = React.ComponentProps<typeof PaginationHeroUI> & {}

const Pagination = ({ ...props }: PaginationProps) => {
  return (
    <Fragment>
      <PaginationHeroUI {...props} />
    </Fragment>
  )
}

export default Pagination
