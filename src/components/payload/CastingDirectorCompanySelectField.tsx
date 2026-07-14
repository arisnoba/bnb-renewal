'use client'

import type { SelectFieldClientComponent } from 'payload'

import { FieldError, FieldLabel, useField } from '@payloadcms/ui'

type CompanyOption = {
  label: string
  value: string
}

function companyOptions(value: unknown): CompanyOption[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((option) => {
    if (typeof option === 'string') {
      return [{ label: option, value: option }]
    }

    if (
      option &&
      typeof option === 'object' &&
      typeof (option as { label?: unknown }).label === 'string' &&
      typeof (option as { value?: unknown }).value === 'string'
    ) {
      return [option as CompanyOption]
    }

    return []
  })
}

export const CastingDirectorCompanySelectField: SelectFieldClientComponent = ({
  field,
  path: pathFromProps,
}) => {
  const { disabled, path, setValue, showError, value } = useField<string>({
    potentiallyStalePath: pathFromProps,
  })
  const options = companyOptions(field.options)
  const fieldValue = typeof value === 'string' ? value : ''

  return (
    <div
      className={['field-type', 'select', field.admin?.className, showError ? 'error' : '']
        .filter(Boolean)
        .join(' ')}
      style={{ display: 'grid', gap: 8, margin: '0 0 20px', width: field.admin?.width }}
    >
      <FieldLabel label={field.label ?? '회사'} path={path} required={field.required} />
      <div className="field-type__wrap" style={{ position: 'relative' }}>
        <FieldError path={path} showError={showError} />
        <select
          disabled={disabled}
          onChange={(event) => setValue(event.currentTarget.value)}
          style={{
            appearance: 'auto',
            background: disabled ? 'var(--theme-elevation-100)' : 'var(--theme-input-bg)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-s)',
            color: 'var(--theme-text)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            height: 40,
            padding: '0 12px',
            width: '100%',
          }}
          value={fieldValue}
        >
          <option disabled value="">
            회사를 선택해 주세요
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
