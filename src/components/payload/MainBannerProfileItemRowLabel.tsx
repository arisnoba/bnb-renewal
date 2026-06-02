'use client'

import { useEffect, useState } from 'react'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type ProfileSummary = {
  englishName?: string | null
  id?: number | string | null
  name?: string | null
}

type MainBannerProfileItem = {
  profile?: ProfileSummary | number | string | null
}

function profileName(value: MainBannerProfileItem['profile']) {
  if (!value || typeof value !== 'object') {
    return ''
  }

  return String(value.name || value.englishName || '').trim()
}

function profileId(value: MainBannerProfileItem['profile']) {
  if (!value) {
    return ''
  }

  if (typeof value === 'object') {
    return String(value.id ?? '').trim()
  }

  return String(value).trim()
}

const profileNameCache = new Map<string, string>()

export const MainBannerProfileItemRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<MainBannerProfileItem>()
  const loadedName = profileName(data?.profile)
  const id = profileId(data?.profile)
  const [fetchedProfile, setFetchedProfile] = useState<{
    id: string
    name: string
  } | null>(null)
  const cachedName = id ? (profileNameCache.get(id) ?? '') : ''
  const fallback = rowNumber !== undefined ? `프로필 ${rowNumber + 1}` : '프로필'

  useEffect(() => {
    if (loadedName || !id) {
      return
    }

    const cachedName = profileNameCache.get(id)

    if (cachedName) {
      return
    }

    const controller = new AbortController()

    void fetch(
      `/api/profiles/${encodeURIComponent(id)}?depth=0&select[name]=true&select[englishName]=true`,
      {
        credentials: 'include',
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          return ''
        }

        const profile = (await response.json()) as ProfileSummary

        return profileName(profile)
      })
      .then((name) => {
        if (!name) {
          return
        }

        profileNameCache.set(id, name)
        setFetchedProfile({ id, name })
      })
      .catch(() => undefined)

    return () => {
      controller.abort()
    }
  }, [id, loadedName])

  const fetchedName = fetchedProfile?.id === id ? fetchedProfile.name : ''
  const name = loadedName || cachedName || fetchedName

  return <div>{name || fallback}</div>
}
