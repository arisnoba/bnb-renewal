'use client'

import { usePathname } from 'next/navigation'

import {
  CurriculumLoadingSkeleton,
  resolveLoadingCenter,
  RookiesLoadingSkeleton,
  ScheduleLoadingSkeleton,
} from '../../_components/RouteLoadingSkeletons'

function useCurrentLoadingCenter() {
  const pathname = usePathname()
  const slug = pathname.split('/').filter(Boolean)[0]

  return resolveLoadingCenter(slug)
}

export function CenterCurriculumLoadingSkeleton() {
  return <CurriculumLoadingSkeleton center={useCurrentLoadingCenter()} />
}

export function CenterRookiesLoadingSkeleton() {
  return <RookiesLoadingSkeleton center={useCurrentLoadingCenter()} />
}

export function CenterScheduleLoadingSkeleton() {
  return <ScheduleLoadingSkeleton center={useCurrentLoadingCenter()} />
}
