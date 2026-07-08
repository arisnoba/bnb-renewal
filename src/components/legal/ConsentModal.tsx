'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { centerSlugFromPathname } from '@/Footer/centerInfo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function ConsentModal({
  onAgree,
  triggerLabel = '약관 동의',
}: {
  onAgree?: () => void
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const pathname = usePathname()
  const center = centerSlugFromPathname(pathname) ?? 'art'
  const canSubmit = termsChecked && privacyChecked

  function agree() {
    if (!canSubmit) {
      return
    }

    onAgree?.()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[520px] p-6">
        <DialogHeader>
          <DialogTitle>필수 약관 동의</DialogTitle>
          <DialogDescription>
            서비스 이용에 필요한 약관과 개인정보 처리 내용을 확인해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <label className="flex items-start gap-3 text-sm leading-6">
            <Checkbox
              checked={termsChecked}
              className="mt-0.5"
              onCheckedChange={(checked) => setTermsChecked(checked === true)}
            />
            <span>
              <span className="font-semibold">이용약관 동의</span>
              <Link className="ml-2 text-primary underline underline-offset-4" href={`/${center}/terms`}>
                보기
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm leading-6">
            <Checkbox
              checked={privacyChecked}
              className="mt-0.5"
              onCheckedChange={(checked) => setPrivacyChecked(checked === true)}
            />
            <span>
              <span className="font-semibold">개인정보처리방침 동의</span>
              <Link className="ml-2 text-primary underline underline-offset-4" href={`/${center}/privacy`}>
                보기
              </Link>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button onClick={agree} disabled={!canSubmit} type="button">
            동의 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
