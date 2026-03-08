import { Fragment } from 'react'
import { Tabs as TabsHeroUI, Tab as TabHeroUI } from '@heroui/react'

type TabsProps = React.ComponentProps<typeof TabsHeroUI> & {}

const Tabs = ({ ...props }: TabsProps) => {
  return (
    <Fragment>
      <TabsHeroUI {...props} />
    </Fragment>
  )
}

type TabProps = React.ComponentProps<typeof TabHeroUI> & {}

const Tab = ({ ...props }: TabProps) => {
  return (
    <Fragment>
      <TabHeroUI {...props} />
    </Fragment>
  )
}

export default Tabs
export { Tab }
