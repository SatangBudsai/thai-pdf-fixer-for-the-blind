import { Fragment } from 'react'
import {
  Table as TableHeroUI,
  TableHeader as TableHeaderHeroUI,
  TableBody as TableBodyHeroUI,
  TableColumn as TableColumnHeroUI,
  TableRow as TableRowHeroUI,
  TableCell as TableCellHeroUI
} from '@heroui/react'

type TableProps = React.ComponentProps<typeof TableHeroUI> & {}

const Table = ({ ...props }: TableProps) => {
  return (
    <Fragment>
      <TableHeroUI {...props} />
    </Fragment>
  )
}

type TableHeaderProps = React.ComponentProps<typeof TableHeaderHeroUI> & {}

const TableHeader = ({ ...props }: TableHeaderProps) => {
  return (
    <Fragment>
      <TableHeaderHeroUI {...props} />
    </Fragment>
  )
}

type TableBodyProps = React.ComponentProps<typeof TableBodyHeroUI> & {}

const TableBody = ({ ...props }: TableBodyProps) => {
  return (
    <Fragment>
      <TableBodyHeroUI {...props} />
    </Fragment>
  )
}

type TableColumnProps = React.ComponentProps<typeof TableColumnHeroUI> & {}

const TableColumn = ({ ...props }: TableColumnProps) => {
  return (
    <Fragment>
      <TableColumnHeroUI {...props} />
    </Fragment>
  )
}

type TableRowProps = React.ComponentProps<typeof TableRowHeroUI> & {}

const TableRow = ({ ...props }: TableRowProps) => {
  return (
    <Fragment>
      <TableRowHeroUI {...props} />
    </Fragment>
  )
}

type TableCellProps = React.ComponentProps<typeof TableCellHeroUI> & {}

const TableCell = ({ ...props }: TableCellProps) => {
  return (
    <Fragment>
      <TableCellHeroUI {...props} />
    </Fragment>
  )
}

export default Table
export { TableHeader, TableBody, TableColumn, TableRow, TableCell }
