'use client'

import { Cookie, Settings2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/utilities/ui'

const storageKey = 'bnb-cookie-consent-v1'

type CookieConsent = {
  analytics: boolean
  necessary: true
  savedAt: string
}

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsOpen(!window.localStorage.getItem(storageKey))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  if (!isOpen) {
    return null
  }

  function save(nextAnalytics: boolean) {
    const consent: CookieConsent = {
      analytics: nextAnalytics,
      necessary: true,
      savedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(storageKey, JSON.stringify(consent))
    setIsOpen(false)
  }

  return (
    <section
      aria-label="쿠키 설정"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-4 text-foreground shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Cookie aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-normal">쿠키 사용 안내</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              배우앤배움은 보안, 상담 제출 방지, 화면 설정 유지 등 서비스 운영에 필요한
              쿠키와 저장소를 사용합니다. 선택 항목은 동의한 경우에만 사용합니다.
            </p>

            <div className={cn('mt-4 grid gap-3', showSettings ? 'block' : 'hidden')}>
              <label className="flex items-start gap-3 text-sm leading-6">
                <Checkbox checked disabled className="mt-0.5" />
                <span>
                  <strong className="font-semibold text-foreground">필수 쿠키</strong>
                  <span className="block text-muted-foreground">
                    보안, 관리자 인증, 상담 제출 방지, 테마 설정 유지에 필요합니다.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm leading-6">
                <Checkbox
                  checked={analytics}
                  className="mt-0.5"
                  onCheckedChange={(checked) => setAnalytics(checked === true)}
                />
                <span>
                  <strong className="font-semibold text-foreground">분석 쿠키</strong>
                  <span className="block text-muted-foreground">
                    방문 흐름과 서비스 품질을 확인하기 위한 선택 항목입니다.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
          <Button onClick={() => setShowSettings((value) => !value)} type="button" variant="outline">
            <Settings2 aria-hidden="true" className="size-4" />
            설정
          </Button>
          <Button onClick={() => save(false)} type="button" variant="outline">
            <X aria-hidden="true" className="size-4" />
            거부
          </Button>
          <Button onClick={() => save(showSettings ? analytics : true)} type="button">
            동의
          </Button>
        </div>
      </div>
    </section>
  )
}
