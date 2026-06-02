type RowValueRecord = Record<string, unknown>

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function recordValue(value: unknown): RowValueRecord | null {
  return value && typeof value === 'object' ? (value as RowValueRecord) : null
}

export function mainBannerOrderBannerTitle(value: unknown): string {
  const record = recordValue(value)

  if (!record) {
    return ''
  }

  const directTitle = textValue(record.title)

  if (directTitle) {
    return directTitle
  }

  const label = textValue(record.label)

  if (label) {
    return label
  }

  return mainBannerOrderBannerTitle(record.value)
}

export function mainBannerOrderBannerId(value: unknown): string {
  if (typeof value === 'number') {
    return String(value)
  }

  const scalarValue = textValue(value)

  if (scalarValue) {
    return scalarValue
  }

  const record = recordValue(value)

  if (!record) {
    return ''
  }

  const directId = mainBannerOrderBannerId(record.id)

  if (directId) {
    return directId
  }

  return mainBannerOrderBannerId(record.value)
}
