'use client'

type RowData = {
  content?: string
  year?: string
}

export function DirectCastingWorkItemRowLabel({ data }: { data?: RowData }) {
  const year = data?.year?.trim()
  const content = data?.content?.trim()

  if (year && content) {
    return `${year} - ${content.slice(0, 40)}`
  }

  return year || content?.slice(0, 40) || '이력'
}
