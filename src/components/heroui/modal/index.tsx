import { Fragment } from 'react'
import {
  Modal as ModalHeroUI,
  ModalContent as ModalContentHeroUI,
  ModalHeader as ModalHeaderHeroUI,
  ModalBody as ModalBodyHeroUI,
  ModalFooter as ModalFooterHeroUI
} from '@heroui/react'

type ModalProps = React.ComponentProps<typeof ModalHeroUI> & {}

const Modal = ({ ...props }: ModalProps) => {
  return (
    <Fragment>
      <ModalHeroUI {...props} />
    </Fragment>
  )
}

type ModalContentProps = React.ComponentProps<typeof ModalContentHeroUI> & {}

const ModalContent = ({ ...props }: ModalContentProps) => {
  return (
    <Fragment>
      <ModalContentHeroUI {...props} />
    </Fragment>
  )
}

type ModalHeaderProps = React.ComponentProps<typeof ModalHeaderHeroUI> & {}

const ModalHeader = ({ ...props }: ModalHeaderProps) => {
  return (
    <Fragment>
      <ModalHeaderHeroUI {...props} />
    </Fragment>
  )
}

type ModalBodyProps = React.ComponentProps<typeof ModalBodyHeroUI> & {}

const ModalBody = ({ ...props }: ModalBodyProps) => {
  return (
    <Fragment>
      <ModalBodyHeroUI {...props} />
    </Fragment>
  )
}

type ModalFooterProps = React.ComponentProps<typeof ModalFooterHeroUI> & {}

const ModalFooter = ({ ...props }: ModalFooterProps) => {
  return (
    <Fragment>
      <ModalFooterHeroUI {...props} />
    </Fragment>
  )
}

export default Modal
export { ModalContent, ModalHeader, ModalBody, ModalFooter }
