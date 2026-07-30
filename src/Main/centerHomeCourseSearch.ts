import type { CenterSlug } from '@/lib/centers'

export type SearchableHomeCurriculumCenter = Extract<CenterSlug, 'art'>

const searchableHomeCurriculumCenters = new Set<CenterSlug>(['art'])

export function hasSearchableHomeCurriculum(
  center: CenterSlug,
): center is SearchableHomeCurriculumCenter {
  return searchableHomeCurriculumCenters.has(center)
}
