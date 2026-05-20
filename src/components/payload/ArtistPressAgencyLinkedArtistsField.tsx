'use client'

import type { DefaultCellComponentProps, UIFieldClientComponent } from 'payload'

import type { FC } from 'react'

import { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

type ArtistPressDoc = {
  actorName?: string | null
  generation?: string | null
  id: number | string
  slug?: string | null
  title?: string | null
}

type ArtistPressResponse = {
  docs?: ArtistPressDoc[]
  totalDocs?: number
}

function linkedArtistsParams(agencyId: number | string, limit: string) {
  const params = new URLSearchParams({
    depth: '0',
    limit,
  })

  params.set('where[agency][equals]', String(agencyId))

  return params
}

function docHref(doc: ArtistPressDoc) {
  return `/admin/collections/artist-press/${doc.id}`
}

export const ArtistPressAgencyLinkedArtistsCell: FC<DefaultCellComponentProps> = ({
  rowData,
}) => {
  const agencyId = rowData?.id
  const [totalDocs, setTotalDocs] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!agencyId) {
      setTotalDocs(0)
      return
    }

    const controller = new AbortController()

    async function loadLinkedArtistCount() {
      try {
        const response = await fetch(
          `/api/artist-press?${linkedArtistsParams(agencyId, '1').toString()}`,
          {
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          return
        }

        const body = (await response.json()) as ArtistPressResponse

        setTotalDocs(Number(body.totalDocs ?? body.docs?.length ?? 0))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    void loadLinkedArtistCount()

    return () => controller.abort()
  }, [agencyId])

  return <span>{totalDocs ?? '-'}</span>
}

export const ArtistPressAgencyLinkedArtistsField: UIFieldClientComponent = () => {
  const { id } = useDocumentInfo()
  const [docs, setDocs] = useState<ArtistPressDoc[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!id) {
      setDocs([])
      setTotalDocs(0)
      return
    }

    const agencyId = id
    const controller = new AbortController()

    async function loadLinkedArtists() {
      setIsLoading(true)

      try {
        const params = linkedArtistsParams(agencyId, '100')
        params.set('pagination', 'false')
        params.set('sort', 'actorName')

        const response = await fetch(`/api/artist-press?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          return
        }

        const body = (await response.json()) as ArtistPressResponse

        setDocs(Array.isArray(body.docs) ? body.docs : [])
        setTotalDocs(Number(body.totalDocs ?? body.docs?.length ?? 0))
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadLinkedArtists()

    return () => controller.abort()
  }, [id])

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--base) / 2)' }}>
      <div
        style={{
          alignItems: 'baseline',
          display: 'flex',
          gap: 'calc(var(--base) / 2)',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            color: 'var(--theme-text)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          연결된 출신 아티스트
        </div>
        <div style={{ color: 'var(--theme-elevation-600)', fontSize: 12 }}>
          {isLoading ? '불러오는 중' : `${totalDocs}건`}
        </div>
      </div>
      <div
        style={{
          border: '1px solid var(--theme-border-color)',
          borderRadius: 'var(--style-radius-s)',
          overflow: 'hidden',
        }}
      >
        {docs.length > 0 ? (
          <div style={{ display: 'grid' }}>
            {docs.map((doc) => {
              const meta = [doc.actorName, doc.generation].filter(Boolean).join(' | ')

              return (
                <a
                  href={docHref(doc)}
                  key={doc.id}
                  style={{
                    borderBottom: '1px solid var(--theme-border-color)',
                    color: 'var(--theme-text)',
                    display: 'grid',
                    gap: 4,
                    padding: '10px 12px',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {doc.actorName || doc.title || `출신 아티스트 ${doc.id}`}
                  </span>
                  <span style={{ color: 'var(--theme-elevation-600)', fontSize: 12 }}>
                    {[meta, doc.title].filter(Boolean).join(' / ')}
                  </span>
                </a>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              color: 'var(--theme-elevation-600)',
              fontSize: 13,
              padding: '12px',
            }}
          >
            연결된 출신 아티스트가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
