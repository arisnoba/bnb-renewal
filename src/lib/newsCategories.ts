import type { CenterSlug } from './centers'

export type NewsCategory = {
  key: string
  label: string
  match: readonly string[]
  matchMode?: 'contains' | 'exact'
  legacyKeys?: readonly string[]
  value: string
}

export const defaultNewsCategories = [
  {
    key: 'audition-casting',
    label: '오디션 · 캐스팅공지',
    match: ['오디션', '캐스팅공지', '캐스팅진행'],
    value: '오디션ㆍ캐스팅공지',
  },
  {
    key: 'casting-confirmed',
    label: '캐스팅 확정',
    match: ['캐스팅확정'],
    value: '캐스팅확정',
  },
  {
    key: 'casting-onair',
    label: '캐스팅 OnAir',
    match: ['OnAir'],
    value: '캐스팅OnAir',
  },
  {
    key: 'education-news',
    label: '교육 · 운영 · 소식',
    match: ['교육', '운영', '소식'],
    value: '교육ㆍ운영ㆍ소식',
  },
] as const satisfies readonly NewsCategory[]

export const examNewsCategories = [
  {
    key: 'pass-results',
    label: '합격현황',
    match: ['합격현황', '대학합격현황', '예고합격현황'],
    matchMode: 'exact',
    legacyKeys: ['university-results', 'arts-high-results'],
    value: '합격현황',
  },
  {
    key: 'admission-schedule',
    label: '수시·정시 일정',
    match: ['수시·정시 일정', '수시ㆍ정시일정공지', '수시전형일정', '정시전형일정'],
    matchMode: 'exact',
    value: '수시·정시 일정',
  },
  {
    key: 'education-news',
    label: '교육·운영·소식',
    match: ['교육·운영·소식', '교육', '운영', '교육ㆍ운영ㆍ소식', '공지'],
    matchMode: 'exact',
    value: '교육·운영·소식',
  },
] as const satisfies readonly NewsCategory[]

const newsCategoriesByCenter: Partial<Record<CenterSlug, readonly NewsCategory[]>> = {
  exam: examNewsCategories,
}

export function getNewsCategoriesForCenter(center: string): readonly NewsCategory[] {
  return newsCategoriesByCenter[center as CenterSlug] ?? defaultNewsCategories
}

export function getNewsCategoriesForCenters(centers: readonly string[]) {
  if (centers.length === 0 || centers.includes('all')) {
    return uniqueNewsCategories([...defaultNewsCategories, ...examNewsCategories])
  }

  return uniqueNewsCategories(centers.flatMap((center) => getNewsCategoriesForCenter(center)))
}

export function getNewsCategoryOptions(categories: readonly NewsCategory[]) {
  return categories.map(({ label, value }) => ({ label, value }))
}

export const newsCategoryOptions = getNewsCategoryOptions(
  uniqueNewsCategories([...defaultNewsCategories, ...examNewsCategories]),
)

export function getNewsCategoryByKey(
  value: string | null | undefined,
  newsCategories: readonly NewsCategory[],
) {
  return (
    newsCategories.find(
      (category) => category.key === value || category.legacyKeys?.includes(value ?? ''),
    ) ?? null
  )
}

export function normalizeNewsCategory(
  value: string | null | undefined,
  newsCategories: readonly NewsCategory[],
) {
  if (!value) {
    return null
  }

  const normalizedValue = normalizeNewsCategoryText(value)

  return (
    newsCategories.find((category) => categoryMatchesNewsCategory(normalizedValue, category)) ??
    null
  )
}

export function getNewsCategoryLabel(
  value: string | null | undefined,
  newsCategories: readonly NewsCategory[],
) {
  const category = normalizeNewsCategory(value, newsCategories)

  return category?.label
}

export function categoryMatchesNewsCategory(
  value: string | null | undefined,
  category: NewsCategory,
) {
  const normalizedValue = normalizeNewsCategoryText(value ?? '')

  return category.match.some((categoryValue) => {
    const normalizedCategory = normalizeNewsCategoryText(categoryValue)

    return category.matchMode === 'exact'
      ? normalizedValue === normalizedCategory
      : normalizedValue.includes(normalizedCategory)
  })
}

export function normalizeNewsCategoryText(value: string) {
  return value.replace(/[\s·ㆍ・.]+/g, '').toLowerCase()
}

function uniqueNewsCategories(categories: readonly NewsCategory[]) {
  const seen = new Set<string>()
  const unique: NewsCategory[] = []

  for (const category of categories) {
    if (seen.has(category.value)) {
      continue
    }

    seen.add(category.value)
    unique.push(category)
  }

  return unique
}
