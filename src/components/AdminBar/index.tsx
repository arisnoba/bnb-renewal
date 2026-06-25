'use client'

import type { PayloadAdminBarProps, PayloadMeUser } from '@payloadcms/admin-bar'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React, { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import './index.scss'

import { getClientSideURL } from '@/utilities/getURL'
import { adminBarCenterHref, adminBarCenterLinks } from './centerLinks'

const baseClass = 'admin-bar'

const Title: React.FC = () => <span>Dashboard</span>

export const AdminBar: React.FC<{
  adminBarProps?: PayloadAdminBarProps
}> = (props) => {
  const { adminBarProps } = props || {}
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [show, setShow] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const preview = Boolean(adminBarProps?.preview) || hasPreviewCookie()

  const onAuthChange = React.useCallback((user: PayloadMeUser) => {
    setShow(Boolean(user?.id))
  }, [])

  useEffect(() => {
    const root = document.documentElement

    if (!show || !rootRef.current) {
      root.style.setProperty('--admin-bar-height', '0px')
      root.removeAttribute('data-admin-bar')
      return
    }

    const element = rootRef.current
    const updateHeight = () => {
      root.style.setProperty('--admin-bar-height', `${element.offsetHeight}px`)
      root.setAttribute('data-admin-bar', 'true')
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(element)

    return () => {
      observer.disconnect()
      root.style.setProperty('--admin-bar-height', '0px')
      root.removeAttribute('data-admin-bar')
    }
  }, [show])

  return (
    <div
      ref={rootRef}
      className={cn(baseClass, 'bg-black text-white', {
        block: show,
        hidden: !show,
      })}
    >
      <div className="container-fluid flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 py-2">
        <nav aria-label="센터 바로가기" className="flex flex-wrap items-center gap-2 text-xs">
          {adminBarCenterLinks.map((link) => (
            <Link
              className="rounded border border-white/30 px-2 py-1 text-white no-underline transition hover:border-white hover:bg-white/10"
              href={adminBarCenterHref(pathname, link.slug)}
              key={link.slug}
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
          preview={preview}
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

function hasPreviewCookie() {
  if (typeof document === 'undefined') {
    return false
  }

  return document.cookie
    .split(';')
    .some((cookie) => {
      const name = cookie.trim().split('=')[0]

      return name === '__prerender_bypass' || name === '__next_preview_data'
    })
}
