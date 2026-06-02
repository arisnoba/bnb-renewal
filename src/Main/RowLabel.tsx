'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useConfig, useRowLabel } from '@payloadcms/ui'
import { useEffect, useState, type FC } from 'react'

import {
  mainBannerOrderBannerId,
  mainBannerOrderBannerTitle,
} from './rowLabelHelpers'

type MainBannerOrder = {
  banner?: unknown
}

export const MainBannerOrderRowLabel: FC<RowLabelProps> = () => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const { data, rowNumber } = useRowLabel<MainBannerOrder>()
  const directTitle = mainBannerOrderBannerTitle(data?.banner)
  const bannerId = mainBannerOrderBannerId(data?.banner)
  const [loadedTitle, setLoadedTitle] = useState<{ id: string; title: string } | null>(null)
  const title = directTitle || (loadedTitle?.id === bannerId ? loadedTitle.title : '')
  const fallback = rowNumber !== undefined ? `배너 ${rowNumber + 1}` : '배너'

  useEffect(() => {
    if (directTitle || !bannerId) {
      return
    }

    const controller = new AbortController()
    const params = new URLSearchParams({
      depth: '0',
      draft: 'true',
      'select[title]': 'true',
    })

    async function loadTitle() {
      try {
        const response = await fetch(
          `${api}/main-banners/${encodeURIComponent(bannerId)}?${params.toString()}`,
          {
            credentials: 'include',
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          return
        }

        const doc = (await response.json()) as { title?: unknown }
        const title = mainBannerOrderBannerTitle(doc)

        if (title) {
          setLoadedTitle({ id: bannerId, title })
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    void loadTitle()

    return () => {
      controller.abort()
    }
  }, [api, bannerId, directTitle])

  if (title) {
    return <div>{title}</div>
  }

  return <div>{fallback}</div>
}
