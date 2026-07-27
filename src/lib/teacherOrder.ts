import type { CenterSlug } from './centers'

export const teacherOrderFieldByCenter = {
  art: 'artDisplayOrder',
  avenue: 'avenueDisplayOrder',
  exam: 'examDisplayOrder',
  highteen: 'highteenDisplayOrder',
  kids: 'kidsDisplayOrder',
} as const satisfies Record<CenterSlug, string>

export type TeacherOrderFieldName =
  (typeof teacherOrderFieldByCenter)[keyof typeof teacherOrderFieldByCenter]

export type TeacherOrderDocument = {
  centers?: unknown
  displayOrder?: unknown
} & Partial<Record<TeacherOrderFieldName, unknown>>

export function teacherOrderFieldName(center: CenterSlug): TeacherOrderFieldName {
  return teacherOrderFieldByCenter[center]
}

export function teacherBelongsToOrderCenter(centers: unknown, center: CenterSlug) {
  if (!Array.isArray(centers)) {
    return false
  }

  return centers.includes('all') || centers.includes(center)
}

export function teacherOrderValue(doc: TeacherOrderDocument, center: CenterSlug) {
  const centerOrder = doc[teacherOrderFieldName(center)]

  if (typeof centerOrder === 'number' && Number.isFinite(centerOrder)) {
    return centerOrder
  }

  return typeof doc.displayOrder === 'number' && Number.isFinite(doc.displayOrder)
    ? doc.displayOrder
    : null
}

export function moveTeacherOrderItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items
  }

  const nextItems = [...items]
  const [movedItem] = nextItems.splice(fromIndex, 1)

  nextItems.splice(toIndex, 0, movedItem)

  return nextItems
}
