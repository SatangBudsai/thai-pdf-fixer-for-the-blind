# HeroUI Component Wrappers

This folder contains wrapper components for all HeroUI components, providing a consistent API and easy customization layer.

## Available Components

### Layout & Navigation

- `Navbar` - Navigation bar with brand, content, items, menu toggle, and menu items
- `Breadcrumbs` - Breadcrumb navigation with individual items
- `Tabs` - Tab container with individual tab components

### Form Controls

- `Input` - Text input field (with existing custom implementation)
- `Textarea` - Multi-line text input
- `Select` - Dropdown select with items and sections
- `Checkbox` - Checkbox input with group support
- `Radio` - Radio button input with group support
- `Switch` - Toggle switch input
- `Slider` - Range slider input
- `NumberInput` - Numeric input field
- `InputOtp` - One-time password input

### Date & Time

- `Calendar` - Calendar picker with range support
- `DateInput` - Date input field
- `DatePicker` - Date picker with range support

### Buttons & Actions

- `Button` - Button component with group support
- `Link` - Link component

### Data Display

- `Table` - Data table with header, body, columns, rows, and cells
- `Card` - Card container with header, body, and footer
- `Avatar` - Avatar image with group support
- `User` - User profile display
- `Image` - Image component
- `Badge` - Badge/label component
- `Chip` - Chip/tag component
- `Code` - Inline code display
- `Kbd` - Keyboard key display
- `Snippet` - Code snippet display

### Feedback

- `Alert` - Alert/notification messages
- `Progress` - Linear progress indicator
- `CircularProgress` - Circular progress indicator
- `Spinner` - Loading spinner
- `Skeleton` - Skeleton loading placeholder
- `Toast` - Toast notification (placeholder implementation)

### Overlays

- `Modal` - Modal dialog with content, header, body, and footer
- `Popover` - Popover overlay with trigger and content
- `Tooltip` - Tooltip overlay
- `Dropdown` - Dropdown menu with trigger, menu, items, and sections
- `Drawer` - Slide-out drawer with content, header, body, and footer

### Lists & Menus

- `Listbox` - List component with items and sections
- `Menu` - Menu component with items and sections
- `Autocomplete` - Autocomplete input with items and sections

### Layout

- `Accordion` - Collapsible accordion with items
- `Divider` - Visual divider/separator
- `Spacer` - Flexible spacing component
- `ScrollShadow` - Scroll container with shadow

### Form

- `Form` - Form container component

### Navigation

- `Pagination` - Pagination component

## Usage

### Individual Component Import

```tsx
import Input from '@/components/heroui/input'
import Button from '@/components/heroui/button'
import Modal from '@/components/heroui/modal'
```

### Bulk Import from Index

```tsx
import { Input, Button, Modal, Card, CardHeader, CardBody } from '@/components/heroui'
```

## Component Structure

Each component follows this pattern:

```tsx
import { Fragment } from 'react'
import { ComponentName as ComponentNameHeroUI } from '@heroui/react'

type ComponentNameProps = React.ComponentProps<typeof ComponentNameHeroUI> & {}

const ComponentName = ({ ...props }: ComponentNameProps) => {
  return (
    <Fragment>
      <ComponentNameHeroUI {...props} />
    </Fragment>
  )
}

export default ComponentName
```

## Customization

You can extend any component by modifying its props type and adding custom logic:

```tsx
type InputProps = React.ComponentProps<typeof InputHeroUI> & {
  errorMessage?: string
  startIcon?: string
}

const Input = (props: InputProps) => {
  const { errorMessage, startIcon, ...rest } = props

  // Add custom logic here

  return (
    <Fragment>
      <InputHeroUI
        startContent={startIcon ? <Icon icon={startIcon} /> : undefined}
        isInvalid={!!errorMessage}
        errorMessage={errorMessage}
        {...rest}
      />
    </Fragment>
  )
}
```

## Notes

- Some components like `NumberInput` and `Toast` may not be available in the current HeroUI version and have placeholder implementations
- All components maintain full TypeScript support
- Components inherit all props from their HeroUI counterparts
- Custom styling can be applied via the `className` prop or HeroUI's styling system
