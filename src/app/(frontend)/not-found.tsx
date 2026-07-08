import Link from 'next/link'
import { headers } from 'next/headers'
import React from 'react'
import { Home } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { notFoundViewFromPathname } from './notFoundRouting'

export default async function NotFound() {
  const requestHeaders = await headers()
  const pathname = requestHeaders.get('x-pathname')
  const view = notFoundViewFromPathname(pathname)

  return (
    <main
      className={cn(
        'page page-light page-not-found',
        view.scope === 'center' && 'page-top-offset',
      )}
      data-center={view.scope === 'center' ? view.center : undefined}
      data-not-found-scope={view.scope}
    >
      <section
        aria-labelledby="not-found-title"
        className="section-not-found section-p-block-base bg-white"
      >
        <div className="container-sm flex min-h-[420px] flex-col items-center justify-center text-center">
          <p className="section-not-found__code type-label-l font-bold text-muted-foreground">
            404 · {view.label}
          </p>
          <h1
            className="section-not-found__title mt-5 type-headline-l font-bold text-foreground"
            id="not-found-title"
          >
            페이지를 찾을 수 없습니다.
          </h1>
          <p className="section-not-found__description mt-5 max-w-[520px] type-body-m leading-normal text-muted-foreground">
            {view.description}
          </p>
          <Button asChild className="section-not-found__action mt-10 h-12 px-6" variant="default">
            <Link href={view.href}>
              <Home aria-hidden="true" className="size-4" strokeWidth={2.2} />
              {view.actionLabel}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
