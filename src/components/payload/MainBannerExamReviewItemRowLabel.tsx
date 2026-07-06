'use client'

import { useEffect, useState } from 'react'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type SchoolSummary = {
  id?: number | string | null
  schoolName?: string | null
}

type MainBannerExamReviewItem = {
  resultLabel?: string | null
  reviews?: unknown
  school?: SchoolSummary | number | string | null
}

function schoolName(value: MainBannerExamReviewItem['school']) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  return String(value.schoolName || '').trim()
}

function schoolId(value: MainBannerExamReviewItem['school']) {
  if (!value) {
    return ''
  }

  if (typeof value === 'object') {
    return String(value.id ?? '').trim()
  }

  return String(value).trim()
}

function reviewCountLabel(value: MainBannerExamReviewItem['reviews']) {
  const count = Array.isArray(value) ? value.length : 0

  return count > 0 ? `후기 ${count}개` : ''
}

const schoolNameCache = new Map<string, string>()

export const MainBannerExamReviewItemRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<MainBannerExamReviewItem>()
  const loadedName = schoolName(data?.school)
  const id = schoolId(data?.school)
  const [fetchedSchool, setFetchedSchool] = useState<{
    id: string
    name: string
  } | null>(null)
  const cachedName = id ? (schoolNameCache.get(id) ?? '') : ''
  const manualLabel = String(data?.resultLabel ?? '').trim()
  const fallback = rowNumber !== undefined ? `대학교 그룹 ${rowNumber + 1}` : '대학교 그룹'
  const countLabel = reviewCountLabel(data?.reviews)

  useEffect(() => {
    if (loadedName || !id) {
      return
    }

    const cachedName = schoolNameCache.get(id)

    if (cachedName) {
      return
    }

    const controller = new AbortController()

    void fetch(`/api/exam-school-logos/${encodeURIComponent(id)}?depth=0&select[schoolName]=true`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          return ''
        }

        const result = (await response.json()) as SchoolSummary

        return schoolName(result)
      })
      .then((name) => {
        if (!name) {
          return
        }

        schoolNameCache.set(id, name)
        setFetchedSchool({ id, name })
      })
      .catch(() => undefined)

    return () => {
      controller.abort()
    }
  }, [id, loadedName])

  const fetchedName = fetchedSchool?.id === id ? fetchedSchool.name : ''
  const name = manualLabel || loadedName || cachedName || fetchedName
  const parts = [name, countLabel].filter(Boolean)

  return <div>{parts.join(' | ') || fallback}</div>
}
