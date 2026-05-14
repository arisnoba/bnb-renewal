'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/ui'

const regions = [
  '서울',
  '부산',
  '대구',
  '대전',
  '광주',
  '울산',
  '인천',
  '경기',
  '경남',
  '경북',
  '강원',
  '전남',
  '전북',
  '제주',
  '충남',
  '충북',
  '세종',
]

const genderOptions = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]

const agencyOptions = [
  { label: '무', value: 'none' },
  { label: '유', value: 'signed' },
]

export function AuditionForm() {
  const [submitted, setSubmitted] = useState(false)
  const [agencyStatus, setAgencyStatus] = useState<string | null>(null)

  return (
    <form
      className="grid gap-10"
      encType="multipart/form-data"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
      }}
    >
      {submitted && (
        <div
          className="rounded-lg border border-success bg-success/30 px-4 py-3 text-sm font-medium"
          role="status"
        >
          지원서 입력값이 확인되었습니다. 저장 API 연결 후 실제 접수로 전환됩니다.
        </div>
      )}

      <section className="grid gap-5">
        <SectionHeading index="01" title="기본 정보" />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="이름" required>
            <Input autoComplete="name" className={controlClassName} name="applicantName" required />
          </Field>

          <RadioButtonGroup label="성별" name="gender" options={genderOptions} required />

          <Field className="md:col-span-2" label="생년월일" required>
            <Input
              className={controlClassName}
              inputMode="numeric"
              maxLength={8}
              name="birthDate"
              pattern="[0-9]{7,8}"
              placeholder="예: 1980725"
              required
            />
          </Field>

          <Field className="md:col-span-2" label="연락처" required>
            <Input
              className={controlClassName}
              inputMode="tel"
              maxLength={13}
              name="phone"
              placeholder="예: 01012345678"
              required
              type="tel"
            />
          </Field>

          <Field label="사는지역" required>
            <Select name="region" required>
              <SelectTrigger className={controlClassName}>
                <SelectValue placeholder="도시선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field className="md:col-span-2" label="소속사" required>
            <RadioButtonGroup
              name="agencyStatus"
              onValueChange={setAgencyStatus}
              options={agencyOptions}
              required
            />
            {agencyStatus === 'signed' && (
              <Input
                className={cn(controlClassName, 'mt-2')}
                name="agencyName"
                placeholder="소속사명을 입력해 주세요."
                required
              />
            )}
          </Field>
        </div>
      </section>

      <section className="grid gap-5">
        <SectionHeading index="02" title="프로필 정보" />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="신장">
            <Input
              className={controlClassName}
              inputMode="decimal"
              name="height"
              placeholder="cm"
              type="number"
            />
          </Field>

          <Field label="체중">
            <Input
              className={controlClassName}
              inputMode="decimal"
              name="weight"
              placeholder="kg"
              type="number"
            />
          </Field>

          <Field className="md:col-span-2" label="특기">
            <Input className={controlClassName} name="specialty" placeholder="액션, 댄스, 보컬 등" />
          </Field>

          <Field className="md:col-span-2" label="경력사항" required>
            <Textarea
              className="min-h-44"
              name="career"
              placeholder="작품명, 배역, 활동 이력을 입력해 주세요."
              required
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-5">
        <SectionHeading index="03" title="자료 첨부" />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="사진">
            <Input accept="image/*" className={controlClassName} name="photo" type="file" />
          </Field>

          <Field label="유튜브영상" required>
            <Input
              className={controlClassName}
              inputMode="url"
              name="youtubeUrl"
              placeholder="youtube.com/mBm5Dn5PM6M"
              required
              type="url"
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">개인정보 수집 및 이용 방침</h2>
        <div className="max-h-40 overflow-y-auto rounded-md border bg-background p-4 text-sm leading-6 text-muted-foreground">
          회사는 상담, 서비스 신청 및 오디션 지원 확인을 위해 이름, 생년월일, 연락처,
          거주지역, 프로필 정보, 첨부 자료를 수집합니다. 수집된 정보는 지원 검토와 안내
          목적으로만 사용되며, 이용 목적 달성 후 내부 보관 정책에 따라 파기됩니다.
        </div>
        <div className="flex items-center gap-3">
          <Checkbox className="size-5" id="privacyConsent" name="privacyConsent" required />
          <Label className="text-sm leading-5" htmlFor="privacyConsent">
            개인정보 수집 및 이용 방침에 동의합니다. <RequiredMark />
          </Label>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">
          1차 서류전형 합격자는 개별 연락으로 안내됩니다.
        </p>
        <Button className="h-12 px-8 text-base" type="submit">
          지원서 입력 확인
        </Button>
      </div>
    </form>
  )
}

function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b pb-3">
      <span className="font-mono text-sm text-muted-foreground">{index}</span>
      <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
    </div>
  )
}

function Field({
  children,
  className,
  label,
  required = false,
}: {
  children: React.ReactNode
  className?: string
  label: string
  required?: boolean
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label>
        {label} {required && <RequiredMark />}
      </Label>
      {children}
    </div>
  )
}

function RadioButtonGroup({
  label,
  name,
  onValueChange,
  options,
  required = false,
}: {
  label?: string
  name: string
  onValueChange?: (value: string) => void
  options: Array<{ label: string; value: string }>
  required?: boolean
}) {
  return (
    <div className="grid gap-2">
      {label && (
        <Label>
          {label} {required && <RequiredMark />}
        </Label>
      )}
      <div className="grid grid-cols-2 gap-2" role="radiogroup">
        {options.map((option) => {
          const id = `${name}-${option.value}`

          return (
            <div className="grid" key={option.value}>
              <input
                className="peer sr-only"
                id={id}
                name={name}
                onChange={() => onValueChange?.(option.value)}
                required={required}
                type="radio"
                value={option.value}
              />
              <Label
                className={cn(
                  controlClassName,
                  'flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:outline-1',
                )}
                htmlFor={id}
              >
                {option.label}
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const controlClassName = 'h-12'

function RequiredMark() {
  return (
    <span aria-label="필수" className="text-destructive">
      *
    </span>
  )
}
