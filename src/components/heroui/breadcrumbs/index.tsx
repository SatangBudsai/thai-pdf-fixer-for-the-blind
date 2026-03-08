import { Breadcrumbs as BreadcrumbsHeroUI, BreadcrumbItem as BreadcrumbItemHeroUI } from '@heroui/react'

type BreadcrumbsProps = React.ComponentProps<typeof BreadcrumbsHeroUI> & {}

const Breadcrumbs = ({ ...props }: BreadcrumbsProps) => {
  return <BreadcrumbsHeroUI {...props} />
}

type BreadcrumbItemProps = React.ComponentProps<typeof BreadcrumbItemHeroUI> & {}

const BreadcrumbItem = ({ ...props }: BreadcrumbItemProps) => {
  return <BreadcrumbItemHeroUI {...props} />
}

export default Breadcrumbs
export { BreadcrumbItem }
