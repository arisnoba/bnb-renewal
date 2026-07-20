'use client'

import { List, Printer, X } from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

import guide from '../../../deliverables/admin-guide/admin-guide.generated.json'

type GuideImageStatus = {
  failed: number
  loaded: number
  total: number
}

const articleHtml = guide.articleHtml
  .replace(
    /data-src="\.\/images\/([^"]+)"/g,
    'src="/api/admin-guide/images/$1" data-src="/api/admin-guide/images/$1"',
  )
  .replaceAll('loading="lazy"', 'loading="eager"')

function navigationLabel(label: string, index: number) {
  const matchedNumber = label.match(/^\d+/)?.[0]

  return {
    label: label.replace(/^\d+\.\s*/, ''),
    number: (matchedNumber ?? String(index + 1)).padStart(2, '0'),
  }
}

function waitForGuideImage(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve()

  return new Promise<void>((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener('error', () => resolve(), { once: true })
  })
}

const AdminGuideArticle = memo(function AdminGuideArticle() {
  return (
    <article
      className="guide-article"
      dangerouslySetInnerHTML={{ __html: articleHtml }}
    />
  )
})

export function AdminGuideClient() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState(guide.navigationItems[0]?.id ?? '')
  const [imageStatus, setImageStatus] = useState<GuideImageStatus>({
    failed: 0,
    loaded: 0,
    total: 0,
  })
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false)
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)
  const navigationItems = useMemo(
    () =>
      guide.navigationItems.map((item, index) => ({
        ...item,
        ...navigationLabel(item.label, index),
      })),
    [],
  )

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    const images = [...root.querySelectorAll<HTMLImageElement>('[data-guide-image]')]
    let failed = 0
    let loaded = 0

    setImageStatus({ failed, loaded, total: images.length })

    const updateStatus = () => {
      setImageStatus({ failed, loaded, total: images.length })
    }

    const cleanups = images.map((image) => {
      let isSettled = false
      const handleLoad = () => {
        if (isSettled) return

        isSettled = true
        loaded += 1
        image.closest('[data-guide-shot]')?.classList.add('has-image')
        updateStatus()
      }
      const handleError = () => {
        if (isSettled) return

        isSettled = true
        failed += 1
        updateStatus()
      }

      image.addEventListener('load', handleLoad, { once: true })
      image.addEventListener('error', handleError, { once: true })
      image.src = image.dataset.src ?? ''

      if (image.complete) {
        if (image.naturalWidth > 0) handleLoad()
        else handleError()
      }

      return () => {
        image.removeEventListener('load', handleLoad)
        image.removeEventListener('error', handleError)
      }
    })

    let animationFrame = 0

    const updateActiveSection = () => {
      const sections = navigationItems
        .map(({ id }) => document.getElementById(id))
        .filter((section): section is HTMLElement => Boolean(section))
      const currentSection = [...sections]
        .reverse()
        .find((section) => section.getBoundingClientRect().top <= 160)

      if (currentSection) setActiveSection(currentSection.id)
    }
    const handleScroll = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(updateActiveSection)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateActiveSection()

    return () => {
      cleanups.forEach((cleanup) => cleanup())
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [navigationItems])

  useEffect(() => {
    if (!isMobileNavigationOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileNavigationOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileNavigationOpen])

  const handlePrint = async () => {
    const images = [
      ...(rootRef.current?.querySelectorAll<HTMLImageElement>('[data-guide-image]') ?? []),
    ]

    setIsPreparingPrint(true)
    images.forEach((image) => {
      image.loading = 'eager'
    })
    await Promise.all(images.map(waitForGuideImage))
    setIsPreparingPrint(false)
    window.print()
  }

  const imageStatusLabel = (() => {
    if (imageStatus.total === 0) return '이미지 확인 중'
    if (imageStatus.failed > 0) return `이미지 ${imageStatus.failed}개 확인 필요`
    if (imageStatus.loaded === imageStatus.total) {
      return `화면 이미지 ${imageStatus.loaded}개 연결됨`
    }

    return `화면 이미지 ${imageStatus.loaded}/${imageStatus.total} 불러오는 중`
  })()

  const renderNavigation = (isMobile = false) => (
    <nav aria-label={isMobile ? '모바일 가이드 목차' : '가이드 목차'}>
      <ol>
        {navigationItems.map(({ id, label, number }) => (
          <li key={`${isMobile ? 'mobile-' : ''}${id}`}>
            <a
              aria-current={activeSection === id ? 'true' : undefined}
              className={activeSection === id ? 'is-active' : undefined}
              href={`#${id}`}
              onClick={() => {
                setActiveSection(id)
                setIsMobileNavigationOpen(false)
              }}
            >
              <span>{number}</span>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )

  return (
    <div className="guide-page guide-page--admin" ref={rootRef}>
      <a className="skip-link" href="#guide-content">
        본문으로 바로가기
      </a>

      <header className="guide-hero">
        <div className="guide-hero__top">
          <div className="guide-brand">
            <span>BNB</span>
            <strong>OPERATOR MANUAL</strong>
          </div>
          <div className="guide-hero__actions">
            <span
              className={`image-status${imageStatus.loaded === imageStatus.total && imageStatus.total > 0 ? ' is-complete' : ''}`}
            >
              {imageStatusLabel}
            </span>
            <button
              className="print-button"
              disabled={isPreparingPrint}
              onClick={handlePrint}
              type="button"
            >
              <Printer aria-hidden="true" size={15} strokeWidth={2} />
              {isPreparingPrint ? 'PDF 준비 중…' : 'PDF로 저장'}
            </button>
          </div>
        </div>

        <div className="guide-hero__body">
          <p className="guide-kicker">PAYLOAD CMS · ADMIN GUIDE</p>
          <h1>{guide.metadata.title}</h1>
          <p className="guide-summary">
            콘텐츠 등록부터 공개 확인까지, 실제 운영 흐름을 한 문서에서 빠르게 찾아보세요.
          </p>
          <dl className="guide-meta">
            <div>
              <dt>대상</dt>
              <dd>{guide.metadata.audience}</dd>
            </div>
            <div>
              <dt>관리자</dt>
              <dd>{guide.metadata.adminUrl}</dd>
            </div>
            <div>
              <dt>버전</dt>
              <dd>{guide.metadata.version}</dd>
            </div>
            <div>
              <dt>갱신</dt>
              <dd>{guide.metadata.updatedAt}</dd>
            </div>
          </dl>
        </div>

        <div className="guide-hero__rule">
          <span />
        </div>
      </header>

      <div className="guide-shell">
        <aside className="guide-rail" aria-label="가이드 목차">
          <div className="guide-rail__sticky">
            <p className="guide-rail__label">CONTENTS</p>
            {renderNavigation()}
            <div className="guide-rail__help">
              <strong>화면이 다른가요?</strong>
              <p>계정 권한과 담당 센터에 따라 메뉴가 다르게 보일 수 있습니다.</p>
            </div>
          </div>
        </aside>

        <main className="guide-content" id="guide-content">
          <AdminGuideArticle />

          <footer className="guide-footer">
            <span>BNB OPERATOR MANUAL</span>
            <p>
              {guide.metadata.version} · {guide.metadata.updatedAt}
            </p>
          </footer>
        </main>
      </div>

      <button
        aria-controls="mobile-navigation"
        aria-expanded={isMobileNavigationOpen}
        className="mobile-contents"
        onClick={() => setIsMobileNavigationOpen(true)}
        type="button"
      >
        <List aria-hidden="true" size={16} strokeWidth={2} />
        목차
      </button>

      {isMobileNavigationOpen ? (
        <div className="mobile-navigation" id="mobile-navigation">
          <div className="mobile-navigation__header">
            <strong>목차</strong>
            <button
              aria-label="목차 닫기"
              onClick={() => setIsMobileNavigationOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} strokeWidth={2} />
            </button>
          </div>
          {renderNavigation(true)}
        </div>
      ) : null}
    </div>
  )
}
