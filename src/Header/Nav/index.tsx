'use client'

import React, { useEffect, useState } from 'react'

import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { getHeaderMenu, headerCenterFromPathname, type HeaderMenuGroup } from './menu'

export const HeaderNav: React.FC = () => {
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
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsMegaOpen(false)
          }
        }}
        onMouseEnter={() => setIsMegaOpen(true)}
        onMouseLeave={() => setIsMegaOpen(false)}
      >
        <nav aria-label="주요 메뉴" className="site-header__nav">
          {menuGroups.map((item) => (
            <Link
              className="site-header__nav-link"
              href={item.href}
              key={item.key}
              onFocus={() => setIsMegaOpen(true)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <MegaMenu
          groups={menuGroups}
          isOpen={isMegaOpen}
          onLinkClick={() => setIsMegaOpen(false)}
        />
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

function MegaMenu({
  groups,
  isOpen,
  onLinkClick,
}: {
  groups: HeaderMenuGroup[]
  isOpen: boolean
  onLinkClick: () => void
}) {
  return (
    <div
      aria-hidden={!isOpen}
      className="site-header__mega"
      data-open={isOpen ? 'true' : 'false'}
    >
      <MenuColumns groups={groups} onLinkClick={onLinkClick} />
    </div>
  )
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

function MenuColumns({
  groups,
  onLinkClick,
}: {
  groups: HeaderMenuGroup[]
  onLinkClick: () => void
}) {
  return (
    <nav aria-label="전체 메뉴" className="site-header__mega-grid">
      {groups.map((group) => (
        <section className="site-header__mega-group" key={group.key}>
          <Link className="site-header__mega-title" href={group.href} onClick={onLinkClick}>
            {group.label}
          </Link>
          <ul className="site-header__mega-list">
            {group.items.map((item) => (
              <li key={`${group.key}-${item.href}-${item.label}`}>
                <Link className="site-header__mega-link" href={item.href} onClick={onLinkClick}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
