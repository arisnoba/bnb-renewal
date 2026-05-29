'use client'

import type { PayloadAdminBarProps, PayloadMeUser } from '@payloadcms/admin-bar'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import './index.scss'

import { getClientSideURL } from '@/utilities/getURL'

const baseClass = 'admin-bar'

const centerLinks = [
  { href: '/art', label: '아트' },
  { href: '/exam', label: '입시' },
  { href: '/kids', label: '키즈' },
  { href: '/highteen', label: '하이틴' },
  { href: '/avenue', label: '애비뉴' },
]

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = (props) => {
  const { adminBarProps } = props || {}
  const [show, setShow] = useState(false)
  const router = useRouter()

  const onAuthChange = React.useCallback((user: PayloadMeUser) => {
    setShow(Boolean(user?.id))
  }, [])

  return (
    <div
      className={cn(baseClass, 'py-2 bg-black text-white', {
        block: show,
        hidden: !show,
      })}
    >
      <div className="container flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label="센터 바로가기" className="flex flex-wrap items-center gap-2 text-xs">
          {centerLinks.map((link) => (
            <Link
              className="rounded border border-white/30 px-2 py-1 text-white no-underline transition hover:border-white hover:bg-white/10"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <PayloadAdminBar
          {...adminBarProps}
          className="min-w-0 flex-1 py-2 text-white"
          classNames={{
            controls: 'font-medium text-white',
            logo: 'text-white',
            user: 'text-white',
          }}
          cmsURL={getClientSideURL()}
          collectionSlug={undefined}
          logo={<Title />}
          onAuthChange={onAuthChange}
          onPreviewExit={() => {
            fetch('/next/exit-preview').then(() => {
              router.push('/')
              router.refresh()
            })
          }}
          style={{
            backgroundColor: 'transparent',
            padding: 0,
            position: 'relative',
            zIndex: 'unset',
          }}
        />
      </div>
    </div>
  )
}
