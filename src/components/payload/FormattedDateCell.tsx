'use client'

import type { DefaultCellComponentProps } from 'payload'

import { formatAdminDate } from '../../lib/formatAdminDate'

function resolveSourceField(field: DefaultCellComponentProps['field']) {
  const custom = field?.admin?.custom

  if (
    custom &&
    typeof custom === 'object' &&
    'sourceField' in custom &&
    typeof custom.sourceField === 'string'
  ) {
    return custom.sourceField
  }

  return 'name' in field ? field.name : undefined
}

export function FormattedDateCell({
  cellData,
  className,
  field,
  link,
  linkURL,
  onClick,
  rowData,
}: DefaultCellComponentProps) {
  const sourceField = resolveSourceField(field)
  const fallbackValue =
    sourceField && rowData && typeof rowData === 'object'
      ? (rowData as Record<string, unknown>)[sourceField]
      : undefined
  const text = formatAdminDate(cellData ?? fallbackValue)

  if (link && linkURL) {
    return <a className={className} href={linkURL}>{text}</a>
  }

  return <span className={className}>{text}</span>
}
