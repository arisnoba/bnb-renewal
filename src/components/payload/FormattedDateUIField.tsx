import type { UIFieldServerComponent, UIFieldServerProps } from 'payload'

import { formatAdminDate } from '../../lib/formatAdminDate'

function resolveSourceField(field: UIFieldServerProps['field']) {
  const custom = field.admin?.custom

  if (
    custom &&
    typeof custom === 'object' &&
    'sourceField' in custom &&
    typeof custom.sourceField === 'string'
  ) {
    return custom.sourceField
  }

  return field.name
}

function resolveLabel(field: UIFieldServerProps['field']) {
  if (typeof field.label === 'string') {
    return field.label
  }

  return field.name
}

export const FormattedDateUIField: UIFieldServerComponent = ({ data, field }) => {
  const sourceField = resolveSourceField(field)
  const rawValue =
    data && typeof data === 'object'
      ? (data as Record<string, unknown>)[sourceField]
      : undefined

  return (
    <div style={{ marginBottom: 'calc(var(--base) * 0.75)' }}>
      <div
        style={{
          color: 'var(--theme-elevation-500)',
          fontSize: '0.75rem',
          marginBottom: '0.25rem',
        }}
      >
        {resolveLabel(field)}
      </div>
      <div>{formatAdminDate(rawValue)}</div>
    </div>
  )
}
