'use client'

import React, { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import type { CenterSlug } from '@/lib/centers'
import { centers } from '@/lib/centers'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getHeaderMenu, headerCenterFromPathname, type HeaderMenuGroup } from './menu'

type HeaderNavProps = {
  onMegaOpenChange?: (isOpen: boolean) => void
}

const headerCenterOptions: CenterSlug[] = ['art', 'exam', 'highteen', 'kids', 'avenue']

export const HeaderNav: React.FC<HeaderNavProps> = ({ onMegaOpenChange }) => {
  const pathname = usePathname()
  const center = headerCenterFromPathname(pathname)
  const menuGroups = getHeaderMenu(center)
  const consultHref = `/${center}/consult`
  const navZoneRef = useRef<HTMLDivElement | null>(null)
  const [isMegaOpen, setIsMegaOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeMobileGroupKey, setActiveMobileGroupKey] = useState<string | null>(null)

  const closeMenus = () => {
    setIsMegaOpen(false)
    setIsMobileOpen(false)
    setActiveMobileGroupKey(null)
  }

  useEffect(() => {
    onMegaOpenChange?.(isMegaOpen)
  }, [isMegaOpen, onMegaOpenChange])

  useEffect(() => {
    if (!isMegaOpen) return

    const closeMegaOnOutsidePointerDown = (event: PointerEvent) => {
      const navZone = navZoneRef.current
      const target = event.target

      if (navZone && target instanceof Node && navZone.contains(target)) {
        return
      }

      setIsMegaOpen(false)
    }

    document.addEventListener('pointerdown', closeMegaOnOutsidePointerDown, true)

    return () => {
      document.removeEventListener('pointerdown', closeMegaOnOutsidePointerDown, true)
    }
  }, [isMegaOpen])

  useEffect(() => {
    if (!isMobileOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileOpen])

  return (
    <>
      <div
        ref={navZoneRef}
        className="site-header__nav-zone"
        data-mega-open={isMegaOpen ? 'true' : undefined}
        style={navZoneStyle(menuGroups)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsMegaOpen(false)
          }
        }}
        onMouseEnter={() => setIsMegaOpen(true)}
        onMouseLeave={() => setIsMegaOpen(false)}
      >
        <nav aria-label="주요 메뉴" className="site-header__nav">
          {menuGroups.map((group) => (
            <div className="site-header__desktop-item" key={group.key}>
              <button
                aria-expanded={isMegaOpen}
                aria-haspopup="true"
                className="site-header__nav-link text-base"
                onClick={() => setIsMegaOpen(true)}
                onFocus={() => setIsMegaOpen(true)}
                onPointerDown={(event) => {
                  if (event.pointerType !== 'mouse') {
                    setIsMegaOpen(true)
                  }
                }}
                type="button"
              >
                {group.label}
              </button>
              <div className="site-header__desktop-submenu-frame">
                <ul className="site-header__desktop-submenu">
                  {group.items.map((item) => (
                    <li key={`${group.key}-${item.href}-${item.label}`}>
                      <Link
                        className="site-header__submenu-link"
                        href={item.href}
                        onClick={() => setIsMegaOpen(false)}
                        prefetch={false}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="site-header__actions">
        <Link className="site-header__consult" href={consultHref} prefetch={false}>
          온라인상담
        </Link>
        <HeaderCenterSelect currentCenter={center} />
      </div>
      <div className="site-header__mobile-actions">
        <Link className="site-header__mobile-consult" href={consultHref} prefetch={false}>
          상담
        </Link>
        <button
          aria-expanded={isMobileOpen}
          aria-label={isMobileOpen ? '전체 메뉴 닫기' : '전체 메뉴 열기'}
          className="site-header__mobile-menu-button"
          onClick={() => {
            setIsMobileOpen((current) => {
              if (current) {
                setActiveMobileGroupKey(null)
              }

              return !current
            })
          }}
          type="button"
        >
          {isMobileOpen ? (
            <X aria-hidden="true" size={20} strokeWidth={2.4} />
          ) : (
            <Menu aria-hidden="true" size={20} strokeWidth={2.4} />
          )}
        </button>
      </div>
      <MobileMenu
        activeGroupKey={activeMobileGroupKey}
        consultHref={consultHref}
        groups={menuGroups}
        isOpen={isMobileOpen}
        onBack={() => setActiveMobileGroupKey(null)}
        onGroupSelect={setActiveMobileGroupKey}
        onLinkClick={closeMenus}
      />
    </>
  )
}

function HeaderCenterSelect({ currentCenter }: { currentCenter: CenterSlug }) {
  const router = useRouter()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="센터 선택"
        className="site-header__center-select-trigger"
        type="button"
      >
        <span className="site-header__center-select-label">센터 선택</span>
        <ChevronDown aria-hidden="true" size={16} strokeWidth={2.4} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="site-header__center-select-content">
        <DropdownMenuGroup>
          <DropdownMenuLabel>센터 선택</DropdownMenuLabel>
          {headerCenterOptions.map((option) => (
            <DropdownMenuCheckboxItem
              checked={option === currentCenter}
              key={option}
              onSelect={() => {
                if (option === currentCenter) return

                router.push(`/${option}`)
              }}
            >
              {centers[option]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type NavZoneStyle = React.CSSProperties & {
  '--site-header-submenu-panel-height': string
}

function navZoneStyle(groups: HeaderMenuGroup[]): NavZoneStyle {
  const rowCount = Math.max(1, ...groups.map((group) => group.items.length))

  return {
    '--site-header-submenu-panel-height': `${rowCount * 33 + 44}px`,
  }
}

function MobileMenu({
  activeGroupKey,
  consultHref,
  groups,
  isOpen,
  onBack,
  onGroupSelect,
  onLinkClick,
}: {
  activeGroupKey: string | null
  consultHref: string
  groups: HeaderMenuGroup[]
  isOpen: boolean
  onBack: () => void
  onGroupSelect: (groupKey: string) => void
  onLinkClick: () => void
}) {
  const activeGroup = groups.find((group) => group.key === activeGroupKey) ?? null

  return (
    <div
      aria-hidden={!isOpen}
      className="site-header__mobile-panel"
      data-open={isOpen ? 'true' : 'false'}
    >
      <div className="site-header__mobile-panel-inner">
        <div className="site-header__mobile-stage" data-view={activeGroup ? 'detail' : 'root'}>
          <nav aria-label="전체 메뉴" className="site-header__mobile-root">
            {groups.map((group) => (
              <button
                className="site-header__mobile-root-button"
                key={group.key}
                onClick={() => onGroupSelect(group.key)}
                type="button"
              >
                <span>{group.label}</span>
                <ChevronRight aria-hidden="true" size={24} strokeWidth={2.4} />
              </button>
            ))}
            <Link
              className="site-header__mobile-root-link"
              href={consultHref}
              onClick={onLinkClick}
              prefetch={false}
            >
              온라인상담
            </Link>
          </nav>
          <nav
            aria-label={activeGroup ? `${activeGroup.label} 하위 메뉴` : undefined}
            className="site-header__mobile-detail"
          >
            {activeGroup && (
              <>
                <button className="site-header__mobile-back" onClick={onBack} type="button">
                  <ChevronLeft aria-hidden="true" size={20} strokeWidth={2.4} />
                  <span>전체 메뉴</span>
                </button>
                <div className="site-header__mobile-detail-title">
                  {activeGroup.label}
                </div>
                <ul className="site-header__mobile-detail-list">
                  {activeGroup.items.map((item) => (
                    <li key={`${activeGroup.key}-${item.href}-${item.label}`}>
                      <Link
                        className="site-header__mobile-detail-link"
                        href={item.href}
                        onClick={onLinkClick}
                        prefetch={false}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}
