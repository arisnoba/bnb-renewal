import type { CenterSlug } from '@/lib/centers'

export type SearchableHomeCurriculumCenter = Extract<CenterSlug, 'art' | 'highteen'>

const searchableHomeCurriculumCenters = new Set<CenterSlug>(['art', 'highteen'])

export function hasSearchableHomeCurriculum(
  center: CenterSlug,
): center is SearchableHomeCurriculumCenter {
  return searchableHomeCurriculumCenters.has(center)
}
