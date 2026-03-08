import { Fragment } from 'react'
import { Accordion as AccordionHeroUI, AccordionItem as AccordionItemHeroUI } from '@heroui/react'

type AccordionProps = React.ComponentProps<typeof AccordionHeroUI> & {}

const Accordion = ({ ...props }: AccordionProps) => {
  return (
    <Fragment>
      <AccordionHeroUI {...props} />
    </Fragment>
  )
}

type AccordionItemProps = React.ComponentProps<typeof AccordionItemHeroUI> & {}

const AccordionItem = ({ ...props }: AccordionItemProps) => {
  return (
    <Fragment>
      <AccordionItemHeroUI {...props} />
    </Fragment>
  )
}

export default Accordion
export { AccordionItem }
