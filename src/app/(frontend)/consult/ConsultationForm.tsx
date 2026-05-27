'use client'

import type { FormEvent } from 'react'
import Script from 'next/script'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

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

type InquiryType = 'art' | 'admission' | 'highteen' | 'kids' | 'avenue' | 'partnership'

const inquiryTypes = [
  { label: '아트', value: 'art' },
  { label: '입시', value: 'admission' },
  { label: '하이틴', value: 'highteen' },
  { label: '키즈', value: 'kids' },
  { label: '애비뉴', value: 'avenue' },
  { label: '제휴', value: 'partnership' },
] satisfies Array<{ label: string; value: InquiryType }>

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

const preferredTimes = ['오전', '오후', '저녁', '상담 후 조율']

const genderOptions = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]

const occupationOptions = [
  { label: '학생', value: 'student' },
  { label: '직장인', value: 'worker' },
  { label: '기타', value: 'other' },
]

const schoolLevelOptions = [
  { label: '중학생', value: 'middle' },
  { label: '고등학생', value: 'high' },
  { label: '기타', value: 'other' },
]

const actingMajorOptions = [
  { label: '전공', value: 'major' },
  { label: '비전공', value: 'nonMajor' },
]

const yesNoOptions = [
  { label: '있음', value: 'yes' },
  { label: '없음', value: 'no' },
]

const inflowSources = ['랜딩', '포털', 'SNS', '네이버카페', '지인소개', 'AI', '기타']

const validInquiryTypeValues = new Set(inquiryTypes.map((type) => type.value))
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function ConsultationForm() {
  const searchParams = useSearchParams()
  const today = useMemo(() => toDateInputValue(new Date()), [])
  const initialInquiryType = useMemo(() => {
    const center = searchParams.get('center')
    const normalizedCenter = center === 'exam' ? 'admission' : center

    return validInquiryTypeValues.has(normalizedCenter as InquiryType)
      ? (normalizedCenter as InquiryType)
      : 'art'
  }, [searchParams])

  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inquiryType, setInquiryType] = useState<InquiryType>(initialInquiryType)
  const [inflowSource, setInflowSource] = useState<string | null>(null)
  const isPartnership = inquiryType === 'partnership'
  const needsActingMajor = ['art', 'admission', 'highteen'].includes(inquiryType)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(false)
    setSubmitError(null)

    if (!turnstileSiteKey) {
      setSubmitError('자동 제출 방지 설정이 준비되지 않았습니다. 관리자에게 문의해 주세요.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const turnstileToken = formData.get('cf-turnstile-response')

    if (typeof turnstileToken !== 'string' || !turnstileToken.trim()) {
      setSubmitError('자동 제출 방지 확인을 완료해 주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/turnstile', {
        body: JSON.stringify({ token: turnstileToken }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        setSubmitError('자동 제출 방지 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      setSubmitted(true)
    } catch {
      setSubmitError('자동 제출 방지 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="grid gap-10"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
    >
      {submitted && (
        <div
          className="rounded-lg border border-success bg-success/30 px-4 py-3 text-sm font-medium"
          role="status"
        >
          상담 신청 입력값이 확인되었습니다. 저장 API 연결 후 실제 접수로 전환됩니다.
        </div>
      )}

      <section className="grid gap-5">
        <SectionHeading index="01" title="문의 유형" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="radiogroup">
          {inquiryTypes.map((type) => {
            const id = `inquiryType-${type.value}`

            return (
              <div className="grid" key={type.value}>
                <input
                  checked={inquiryType === type.value}
                  className="peer sr-only"
                  id={id}
                  name="inquiryType"
                  onChange={() => {
                    setInquiryType(type.value)
                    setSubmitted(false)
                    setSubmitError(null)
                  }}
                  type="radio"
                  value={type.value}
                />
                <Label
                  className={cn(
                    controlClassName,
                    'flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:outline-1',
                  )}
                  htmlFor={id}
                >
                  {type.label}
                </Label>
              </div>
            )
          })}
        </div>
      </section>

      {isPartnership ? (
        <section className="grid gap-5">
          <SectionHeading index="02" title="제휴 신청" />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="회사명" required>
              <Input className={controlClassName} name="companyName" required />
            </Field>

            <Field label="홈페이지">
              <Input
                className={controlClassName}
                inputMode="url"
                name="companyWebsite"
                placeholder="https://"
                type="url"
              />
            </Field>

            <Field label="직책/지위" required>
              <Input className={controlClassName} name="jobTitle" required />
            </Field>

            <Field label="담당자 성명" required>
              <Input
                autoComplete="name"
                className={controlClassName}
                name="contactPersonName"
                required
              />
            </Field>

            <Field label="연락처" required>
              <Input
                autoComplete="tel"
                className={controlClassName}
                inputMode="tel"
                name="partnerPhone"
                required
                type="tel"
              />
            </Field>

            <Field label="이메일" required>
              <Input
                autoComplete="email"
                className={controlClassName}
                name="partnerEmail"
                required
                type="email"
              />
            </Field>

            <Field className="md:col-span-2" label="첨부파일">
              <Input className={controlClassName} name="attachment" type="file" />
            </Field>

            <Field className="md:col-span-2" label="제휴 내용" required>
              <Textarea className="min-h-40" name="partnershipContent" required />
            </Field>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-5">
            <SectionHeading index="02" title="상담 예약" />
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="희망일" required>
                <Input
                  className={controlClassName}
                  defaultValue={today}
                  name="preferredDate"
                  required
                  type="date"
                />
              </Field>

              <Field label="희망 시간" required>
                <Select name="preferredTime" required>
                  <SelectTrigger className={controlClassName}>
                    <SelectValue placeholder="시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {preferredTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          <section className="grid gap-5">
            <SectionHeading index="03" title="신청자 정보" />
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="이름" required>
                <Input
                  autoComplete="name"
                  className={controlClassName}
                  name="applicantName"
                  required
                />
              </Field>

              <RadioButtonGroup label="성별" name="gender" options={genderOptions} required />

              <Field label="생년월일" required>
                <Input
                  className={controlClassName}
                  inputMode="numeric"
                  maxLength={8}
                  name="birthDate"
                  pattern="[0-9]{8}"
                  placeholder="예: 19870725"
                  required
                />
              </Field>

              <Field label={inquiryType === 'kids' ? '보호자 연락처' : '연락처'} required>
                <Input
                  autoComplete="tel"
                  className={controlClassName}
                  inputMode="tel"
                  name={inquiryType === 'kids' ? 'guardianPhone' : 'phone'}
                  placeholder="예: 01012345678"
                  required
                  type="tel"
                />
              </Field>

              <Field label="사는 지역" required>
                <Select name="region" required>
                  <SelectTrigger className={controlClassName}>
                    <SelectValue placeholder="지역 선택" />
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

              {inquiryType === 'admission' && (
                <RadioButtonGroup
                  label="직업 구분"
                  name="occupation"
                  options={occupationOptions}
                  required
                />
              )}

              {inquiryType === 'highteen' && (
                <RadioButtonGroup
                  label="학교 구분"
                  name="schoolLevel"
                  options={schoolLevelOptions}
                  required
                />
              )}
            </div>
          </section>

          <section className="grid gap-5">
            <SectionHeading index="04" title="연기 경험 정보" />
            <div className="grid gap-5 md:grid-cols-2">
              {needsActingMajor && (
                <RadioButtonGroup
                  label="연기 전공/비전공"
                  name="actingMajor"
                  options={actingMajorOptions}
                  required
                />
              )}

              <RadioButtonGroup
                label="트레이닝 경험"
                name="hasTraining"
                options={yesNoOptions}
                required
              />

              {inquiryType === 'kids' && (
                <RadioButtonGroup
                  label="작품 출연 경험"
                  name="hasPerformance"
                  options={yesNoOptions}
                  required
                />
              )}

              <Field className="md:col-span-2" label="유입경로" required>
                <Select
                  name="inflowSource"
                  onValueChange={(value) => {
                    setInflowSource(value)
                    setSubmitted(false)
                    setSubmitError(null)
                  }}
                  required
                >
                  <SelectTrigger className={controlClassName}>
                    <SelectValue placeholder="유입경로 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {inflowSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {inflowSource === '기타' && (
                <Field className="md:col-span-2" label="기타 유입경로" required>
                  <Input
                    className={controlClassName}
                    name="inflowSourceOther"
                    placeholder="유입경로를 입력해 주세요."
                    required
                  />
                </Field>
              )}
            </div>
          </section>
        </>
      )}

      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">개인정보 수집 및 이용 방침</h2>
        <div className="max-h-40 overflow-y-auto rounded-md border bg-background p-4 text-sm leading-6 text-muted-foreground">
          회사는 상담 신청 확인과 안내를 위해 이름, 생년월일, 연락처, 거주지역, 문의 유형,
          예약 희망일, 연기 경험 정보 또는 제휴 신청 정보를 수집합니다. 수집된 정보는 상담
          안내 및 문의 처리 목적으로만 사용되며, 이용 목적 달성 후 내부 보관 정책에 따라
          파기됩니다.
        </div>
        <div className="flex items-center gap-3">
          <Checkbox className="size-5" id="privacyConsent" name="privacyConsent" required />
          <Label className="text-sm leading-5" htmlFor="privacyConsent">
            개인정보 수집 및 이용 방침에 동의합니다. <RequiredMark />
          </Label>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">자동 제출 방지</h2>
        {turnstileSiteKey ? (
          <>
            <Script
              async
              defer
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="afterInteractive"
            />
            <div
              className="cf-turnstile min-h-16"
              data-language="ko"
              data-sitekey={turnstileSiteKey}
              data-theme="light"
            />
          </>
        ) : (
          <p className="text-sm text-destructive">
            자동 제출 방지 설정이 준비되지 않았습니다.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            'text-sm leading-6',
            submitError ? 'font-medium text-destructive' : 'text-muted-foreground',
          )}
          role={submitError ? 'alert' : undefined}
        >
          {submitError ??
            '저장 API 연결 전 입력 흐름을 검증하며, 제출 전 자동 제출 방지 확인을 진행합니다.'}
        </p>
        <Button className="h-12 px-8 text-base" disabled={isSubmitting} type="submit">
          {isSubmitting ? '확인 중' : '상담 신청 입력 확인'}
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
  options,
  required = false,
}: {
  label: string
  name: string
  options: Array<{ label: string; value: string }>
  required?: boolean
}) {
  return (
    <div className="grid gap-2">
      <Label>
        {label} {required && <RequiredMark />}
      </Label>
      <div className="grid grid-cols-2 gap-2" role="radiogroup">
        {options.map((option) => {
          const id = `${name}-${option.value}`

          return (
            <div className="grid" key={option.value}>
              <input
                className="peer sr-only"
                id={id}
                name={name}
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

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function RequiredMark() {
  return (
    <span aria-label="필수" className="text-destructive">
      *
    </span>
  )
}
