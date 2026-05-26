'use client'

import type { DefaultCellComponentProps } from 'payload'
import type { FC } from 'react'

import { useEffect, useState } from 'react'

type ProfileSummary = {
  name?: string | null
}

type ScreenAppearanceResponse = {
  linkedProfiles?: Array<number | string | ProfileSummary> | null
  performerName?: string | null
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function profileNames(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((profile) =>
      profile && typeof profile === 'object' ? textValue((profile as ProfileSummary).name) : '',
    )
    .filter(Boolean)
}

function displayNameFromDoc(doc: ScreenAppearanceResponse | null) {
  const manualName = textValue(doc?.performerName)

  if (manualName) {
    return manualName
  }

  const names = profileNames(doc?.linkedProfiles)

  return names.length > 0 ? names.join(', ') : ''
}

export const ScreenAppearancePerformerCell: FC<DefaultCellComponentProps> = ({
  cellData,
  rowData,
}) => {
  const immediateName = textValue(cellData) || displayNameFromDoc(rowData as ScreenAppearanceResponse)
  const [displayName, setDisplayName] = useState(immediateName)
  const docId = rowData?.id

  useEffect(() => {
    if (displayName || !docId) {
      return
    }

    const controller = new AbortController()

    async function loadPerformerName() {
      try {
        const response = await fetch(`/api/screen-appearances/${encodeURIComponent(String(docId))}?depth=1`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          return
        }

        const doc = (await response.json()) as ScreenAppearanceResponse
        const nextDisplayName = displayNameFromDoc(doc)

        if (nextDisplayName) {
          setDisplayName(nextDisplayName)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    void loadPerformerName()

    return () => controller.abort()
  }, [displayName, docId])

  return <span>{displayName || '<출연자 없음>'}</span>
}
