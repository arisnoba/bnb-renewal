'use client'

import React, { useEffect, useState } from 'react'

import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { getHeaderMenu, headerCenterFromPathname, type HeaderMenuGroup } from './menu'

type HeaderNavProps = {
  onMegaOpenChange?: (isOpen: boolean) => void
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onMegaOpenChange }) => {
  const pathname = usePathname()
  const center = headerCenterFromPathname(pathname)
  const menuGroups = getHeaderMenu(center)
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
              <Link
                className="site-header__nav-link"
                href={group.href}
                onFocus={() => setIsMegaOpen(true)}
              >
                {group.label}
              </Link>
              <div className="site-header__desktop-submenu-frame">
                <ul className="site-header__desktop-submenu">
                  {group.items.map((item) => (
                    <li key={`${group.key}-${item.href}-${item.label}`}>
                      <Link
                        className="site-header__submenu-link"
                        href={item.href}
                        onClick={() => setIsMegaOpen(false)}
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
        <Link className="site-header__consult" href="/consult">
          온라인상담
        </Link>
        <Link className="site-header__family" href="/">
          <span>Family Site</span>
          <ChevronDown aria-hidden="true" size={16} strokeWidth={2.4} />
        </Link>
      </div>
      <div className="site-header__mobile-actions">
        <Link className="site-header__mobile-consult" href="/consult">
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
        groups={menuGroups}
        isOpen={isMobileOpen}
        onBack={() => setActiveMobileGroupKey(null)}
        onGroupSelect={setActiveMobileGroupKey}
        onLinkClick={closeMenus}
      />
    </>
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
  groups,
  isOpen,
  onBack,
  onGroupSelect,
  onLinkClick,
}: {
  activeGroupKey: string | null
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
                <ChevronRight aria-hidden="true" size={22} strokeWidth={2.4} />
              </button>
            ))}
            <Link className="site-header__mobile-root-link" href="/consult" onClick={onLinkClick}>
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
                <Link
                  className="site-header__mobile-detail-title"
                  href={activeGroup.href}
                  onClick={onLinkClick}
                >
                  {activeGroup.label}
                </Link>
                <ul className="site-header__mobile-detail-list">
                  {activeGroup.items.map((item) => (
                    <li key={`${activeGroup.key}-${item.href}-${item.label}`}>
                      <Link
                        className="site-header__mobile-detail-link"
                        href={item.href}
                        onClick={onLinkClick}
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
