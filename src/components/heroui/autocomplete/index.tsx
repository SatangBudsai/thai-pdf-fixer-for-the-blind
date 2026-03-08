import { Fragment } from 'react'
import {
  Autocomplete as AutocompleteHeroUI,
  AutocompleteItem as AutocompleteItemHeroUI,
  AutocompleteSection as AutocompleteSectionHeroUI
} from '@heroui/react'

type AutocompleteProps = React.ComponentProps<typeof AutocompleteHeroUI> & {}

const Autocomplete = ({ ...props }: AutocompleteProps) => {
  return (
    <Fragment>
      <AutocompleteHeroUI {...props} />
    </Fragment>
  )
}

type AutocompleteItemProps = React.ComponentProps<typeof AutocompleteItemHeroUI> & {}

const AutocompleteItem = ({ ...props }: AutocompleteItemProps) => {
  return (
    <Fragment>
      <AutocompleteItemHeroUI {...props} />
    </Fragment>
  )
}

type AutocompleteSectionProps = React.ComponentProps<typeof AutocompleteSectionHeroUI> & {}

const AutocompleteSection = ({ ...props }: AutocompleteSectionProps) => {
  return (
    <Fragment>
      <AutocompleteSectionHeroUI {...props} />
    </Fragment>
  )
}

export default Autocomplete
export { AutocompleteItem, AutocompleteSection }
