import { HeroArchiveLoadingSkeleton } from '../../_components/RouteLoadingSkeletons'

export default function Loading() {
  return <HeroArchiveLoadingSkeleton kind="direct-castings" cardCount={16} showTabs />
}
