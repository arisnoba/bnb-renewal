export type ReviewId = number | string
export type ReviewRow = {
  id?: string | null
  review?: unknown
}

function relationshipId(value: unknown): ReviewId | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value !== 'object') {
    return undefined
  }

  const record = value as { id?: unknown; value?: unknown }

  return relationshipId(record.value) ?? relationshipId(record.id)
}

function uniqueRelationshipIds(value: unknown): ReviewId[] {
  const values = Array.isArray(value) ? value : [value]
  const seen = new Set<string>()
  const ids: ReviewId[] = []

  for (const item of values) {
    const id = relationshipId(item)

    if (id === undefined) {
      continue
    }

    const key = String(id)

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    ids.push(id)
  }

  return ids
}

function reviewRows(value: unknown): ReviewRow[] {
  return Array.isArray(value) ? (value as ReviewRow[]) : []
}

export function reviewIdsFromRows(value: unknown): ReviewId[] {
  return uniqueRelationshipIds(reviewRows(value).map((row) => row.review))
}

export function reviewIdsFromPickerValue(value: unknown): ReviewId[] {
  return uniqueRelationshipIds(value)
}

export function reviewRowsFromPickerValue(value: unknown, currentRows: unknown): ReviewRow[] {
  const existingRows = reviewRows(currentRows)
  const existingByReviewId = new Map(
    existingRows
      .map((row) => [relationshipId(row.review), row] as const)
      .filter(([id]) => id !== undefined)
      .map(([id, row]) => [String(id), row] as const),
  )

  return uniqueRelationshipIds(value).map((id) => ({
    ...(existingByReviewId.get(String(id)) ?? {}),
    review: id,
  }))
}

export function reviewPickerSignature(ids: ReviewId[]) {
  return ids.map((id) => String(id)).join('|')
}
