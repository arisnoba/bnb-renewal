'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { useForm, type Control, type FieldErrors, type FieldPath } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import FileUpload, {
  DropZone,
  FileError,
  FileList,
  type FileInfo,
} from '@/components/ui/file-upload'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { centerSlugFromPathname } from '@/Footer/centerInfo'
import { cn } from '@/utilities/ui'
import { inquiryTypeValues, type InquiryType } from './inquiryTypeParams'

const inquiryTypes = [
  { label: '아트센터', value: 'art' },
  { label: '입시센터', value: 'admission' },
  { label: '하이틴센터', value: 'highteen' },
  { label: '키즈센터', value: 'kids' },
  { label: '애비뉴센터', value: 'avenue' },
  { label: '제휴문의', value: 'partnership' },
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

const preferredTimes = ['11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

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

const inflowSources = [
  '포털 사이트(구글, 네이버)',
  'SNS(인스타그램, 스레드 등)',
  '유튜브',
  '네이버카페',
  '지인소개',
  'AI(GPT, gemini, claude)',
  '기타',
]

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const optionalString = z.string().optional()
const preferredDateTooEarlyMessage = '예약 희망일은 내일부터 선택해 주세요.'
const turnstileRequiredMessage = '자동 제출 방지 확인을 완료해 주세요.'
const birthDateFormatMessage = '생년월일은 19870725 형식의 숫자 8자로 입력해 주세요.'
const birthDateInvalidMessage = '실제 생년월일을 입력해 주세요.'
const birthDateFutureMessage = '생년월일은 오늘 이후 날짜를 입력할 수 없습니다.'
const koreanPhoneMessage = '연락처는 국내 전화번호 형식으로 입력해 주세요.'
const phoneFieldNames = new Set(['guardianPhone', 'partnerPhone', 'phone'])

declare global {
  interface Window {
    consultTurnstileError?: () => void
    consultTurnstileExpired?: () => void
    consultTurnstileSuccess?: (token: string) => void
    turnstile?: {
      reset?: () => void
    }
  }
}

function requiresActingMajor(inquiryType: InquiryType | undefined) {
  return inquiryType === 'art' || inquiryType === 'admission' || inquiryType === 'highteen'
}

function requiresOccupation(inquiryType: InquiryType | undefined) {
  return inquiryType === 'art' || inquiryType === 'admission'
}

const consultationFormSchema = z
  .object({
    actingMajor: optionalString,
    applicantName: optionalString,
    attachment: z.any().optional(),
    birthDate: optionalString,
    companyName: optionalString,
    companyWebsite: optionalString,
    contactPersonName: optionalString,
    gender: optionalString,
    guardianPhone: optionalString,
    hasPerformance: optionalString,
    hasTraining: optionalString,
    inflowSource: optionalString,
    inflowSourceOther: optionalString,
    inquiryType: z.enum(inquiryTypeValues),
    jobTitle: optionalString,
    occupation: optionalString,
    partnerEmail: optionalString,
    partnerPhone: optionalString,
    partnershipContent: optionalString,
    phone: optionalString,
    preferredDate: optionalString,
    preferredTime: optionalString,
    privacyConsent: z.boolean().optional(),
    region: optionalString,
    schoolLevel: optionalString,
  })
  .superRefine((values, context) => {
    if (!values.privacyConsent) {
      addIssue(context, 'privacyConsent', '개인정보 수집 및 이용 방침에 동의해 주세요.')
    }

    if (values.inquiryType === 'partnership') {
      addRequiredIssue(context, values.companyName, 'companyName', '회사명을 입력해 주세요.')
      addRequiredIssue(context, values.jobTitle, 'jobTitle', '직책/지위를 입력해 주세요.')
      addRequiredIssue(
        context,
        values.contactPersonName,
        'contactPersonName',
        '담당자 성명을 입력해 주세요.',
      )
      addRequiredIssue(context, values.partnerPhone, 'partnerPhone', '연락처를 입력해 주세요.')
      addRequiredIssue(context, values.partnerEmail, 'partnerEmail', '이메일을 입력해 주세요.')
      addRequiredIssue(
        context,
        values.partnershipContent,
        'partnershipContent',
        '제휴 내용을 입력해 주세요.',
      )

      if (hasValue(values.partnerEmail) && !isValidEmail(values.partnerEmail)) {
        addIssue(context, 'partnerEmail', '올바른 이메일 주소를 입력해 주세요.')
      }

      if (hasValue(values.partnerPhone) && !isValidKoreanPhoneNumber(values.partnerPhone)) {
        addIssue(context, 'partnerPhone', koreanPhoneMessage)
      }

      if (hasValue(values.companyWebsite) && !isValidUrl(values.companyWebsite)) {
        addIssue(context, 'companyWebsite', '올바른 홈페이지 주소를 입력해 주세요.')
      }

      return
    }

    addRequiredIssue(context, values.preferredDate, 'preferredDate', '희망일을 선택해 주세요.')
    if (
      hasValue(values.preferredDate) &&
      isDateInputBefore(values.preferredDate, getEarliestPreferredDateValue())
    ) {
      addIssue(context, 'preferredDate', preferredDateTooEarlyMessage)
    }
    addRequiredIssue(context, values.preferredTime, 'preferredTime', '희망 시간을 선택해 주세요.')
    addRequiredIssue(context, values.applicantName, 'applicantName', '이름을 입력해 주세요.')
    addRequiredIssue(context, values.gender, 'gender', '성별을 선택해 주세요.')
    addRequiredIssue(context, values.birthDate, 'birthDate', '생년월일을 입력해 주세요.')
    addRequiredIssue(
      context,
      values.inquiryType === 'kids' ? values.guardianPhone : values.phone,
      values.inquiryType === 'kids' ? 'guardianPhone' : 'phone',
      values.inquiryType === 'kids' ? '보호자 연락처를 입력해 주세요.' : '연락처를 입력해 주세요.',
    )
    addRequiredIssue(context, values.region, 'region', '사는 지역을 선택해 주세요.')
    addRequiredIssue(context, values.hasTraining, 'hasTraining', '트레이닝 경험을 선택해 주세요.')
    addRequiredIssue(context, values.inflowSource, 'inflowSource', '유입경로를 선택해 주세요.')

    const birthDateMessage = getBirthDateValidationMessage(values.birthDate)
    if (birthDateMessage) {
      addIssue(context, 'birthDate', birthDateMessage)
    }

    const contactPath = values.inquiryType === 'kids' ? 'guardianPhone' : 'phone'
    const contactValue = values.inquiryType === 'kids' ? values.guardianPhone : values.phone
    if (hasValue(contactValue) && !isValidKoreanPhoneNumber(contactValue)) {
      addIssue(context, contactPath, koreanPhoneMessage)
    }

    if (requiresOccupation(values.inquiryType)) {
      addRequiredIssue(context, values.occupation, 'occupation', '직업 구분을 선택해 주세요.')
    }

    if (values.inquiryType === 'highteen') {
      addRequiredIssue(context, values.schoolLevel, 'schoolLevel', '학교 구분을 선택해 주세요.')
    }

    if (requiresActingMajor(values.inquiryType)) {
      addRequiredIssue(
        context,
        values.actingMajor,
        'actingMajor',
        '연기 전공/비전공을 선택해 주세요.',
      )
    }

    if (values.inquiryType === 'kids') {
      addRequiredIssue(
        context,
        values.hasPerformance,
        'hasPerformance',
        '작품 출연 경험을 선택해 주세요.',
      )
    }

    if (values.inflowSource === '기타') {
      addRequiredIssue(
        context,
        values.inflowSourceOther,
        'inflowSourceOther',
        '기타 유입경로를 입력해 주세요.',
      )
    }
  })

type ConsultationFormValues = z.infer<typeof consultationFormSchema>
type ValidationErrorMessages = Partial<Record<FieldPath<ConsultationFormValues>, string>>

const ValidationFeedbackContext = createContext<{
  clearFieldError: (name: FieldPath<ConsultationFormValues>) => void
  errors: ValidationErrorMessages
  setFieldError: (name: FieldPath<ConsultationFormValues>, message: string) => void
}>({
  clearFieldError: () => {},
  errors: {},
  setFieldError: () => {},
})

export function ConsultationForm({ initialInquiryType }: { initialInquiryType: InquiryType }) {
  const pathname = usePathname()
  const center = centerSlugFromPathname(pathname) ?? 'art'
  const privacyHref = `/${center}/privacy`
  const earliestPreferredDate = useMemo(() => getEarliestPreferredDateValue(), [])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formResetKey, setFormResetKey] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrorMessages>({})
  const form = useForm<ConsultationFormValues>({
    defaultValues: getDefaultValues(initialInquiryType),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: zodResolver(consultationFormSchema),
    shouldFocusError: true,
    shouldUnregister: true,
  })
  const inquiryType = form.watch('inquiryType') ?? initialInquiryType
  const inflowSource = form.watch('inflowSource')
  const isPartnership = inquiryType === 'partnership'
  const needsActingMajor = requiresActingMajor(inquiryType)
  const clearFieldError = useCallback((name: FieldPath<ConsultationFormValues>) => {
    setValidationErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[name]

      return nextErrors
    })
  }, [])
  const setFieldError = useCallback((name: FieldPath<ConsultationFormValues>, message: string) => {
    setValidationErrors((currentErrors) => {
      if (currentErrors[name] === message) {
        return currentErrors
      }

      return {
        ...currentErrors,
        [name]: message,
      }
    })
  }, [])
  const validationFeedback = useMemo(
    () => ({
      clearFieldError,
      errors: validationErrors,
      setFieldError,
    }),
    [clearFieldError, setFieldError, validationErrors],
  )

  useEffect(() => {
    form.reset(getDefaultValues(initialInquiryType))
    setSubmitError(null)
    setValidationErrors({})
  }, [form, initialInquiryType])

  useEffect(() => {
    window.consultTurnstileSuccess = (token: string) => {
      setTurnstileToken(token)
      setSubmitError((currentError) =>
        currentError === turnstileRequiredMessage ? null : currentError,
      )
    }
    window.consultTurnstileExpired = () => {
      setTurnstileToken('')
    }
    window.consultTurnstileError = () => {
      setTurnstileToken('')
      setSubmitError('자동 제출 방지 확인 중 오류가 발생했습니다. 다시 시도해 주세요.')
    }

    return () => {
      delete window.consultTurnstileSuccess
      delete window.consultTurnstileExpired
      delete window.consultTurnstileError
    }
  }, [])

  const resetTurnstile = useCallback(() => {
    setTurnstileToken('')
    window.turnstile?.reset?.()
  }, [])

  const handleValidSubmit = async (values: ConsultationFormValues) => {
    setSubmitError(null)
    setValidationErrors({})

    if (!turnstileSiteKey) {
      setSubmitError('자동 제출 방지 설정이 준비되지 않았습니다. 관리자에게 문의해 주세요.')
      return
    }

    if (!turnstileToken.trim()) {
      setSubmitError(turnstileRequiredMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/consult', {
        body: toConsultFormData(values, turnstileToken),
        method: 'POST',
      })

      if (!response.ok) {
        setSubmitError('상담 신청 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        resetTurnstile()
        return
      }

      form.reset(getDefaultValues(initialInquiryType))
      setFormResetKey((currentKey) => currentKey + 1)
      setValidationErrors({})
      setSubmitError(null)
      resetTurnstile()
      toast.success('상담 신청이 접수되었습니다.', {
        description: '담당자가 확인 후 연락드리겠습니다.',
      })
    } catch {
      setSubmitError('상담 신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
      resetTurnstile()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInvalidSubmit = (errors: FieldErrors<ConsultationFormValues>) => {
    const visibleMessages = getVisibleValidationMessages(form.getValues())
    const parsedValues = consultationFormSchema.safeParse(form.getValues())

    setValidationErrors(
      Object.keys(visibleMessages).length > 0
        ? visibleMessages
        : parsedValues.success
        ? toValidationErrorMessages(errors)
        : toZodValidationErrorMessages(parsedValues.error),
    )
    setSubmitError('입력값을 확인해 주세요. 빨간색으로 표시된 항목을 수정하면 됩니다.')
  }

  const resetSubmitFeedback = () => {
    if (submitError) {
      setSubmitError(null)
    }
  }

  return (
    <ValidationFeedbackContext.Provider value={validationFeedback}>
      <Form {...form}>
        <form
          className="space-y-14"
          encType="multipart/form-data"
          noValidate
          onChange={resetSubmitFeedback}
          onSubmit={form.handleSubmit(handleValidSubmit, handleInvalidSubmit)}
        >
      <section className="grid gap-5">
        <SectionHeading index="1" title={isPartnership ? '문의 유형' : '상담 예약'} />
        <FormField
          control={form.control}
          name="inquiryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">센터 및 문의 선택</FormLabel>
              <div className="lg:hidden">
                <Select
                  name={field.name}
                  onValueChange={(value: InquiryType) => {
                    field.onChange(value)
                    resetSubmitFeedback()
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className={controlClassName}>
                      <SelectValue placeholder="센터 및 문의 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {inquiryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden grid-cols-6 gap-2 lg:grid" role="radiogroup">
                {inquiryTypes.map((type) => {
                  const id = `inquiryType-${type.value}`

                  return (
                    <div className="grid" key={type.value}>
                      <input
                        checked={field.value === type.value}
                        className="peer sr-only"
                        id={id}
                        name={field.name}
                        onBlur={field.onBlur}
                        onChange={() => {
                          field.onChange(type.value)
                          resetSubmitFeedback()
                        }}
                        ref={field.ref}
                        type="radio"
                        value={type.value}
                      />
                      <Label
                        className={cn(
                          controlClassName,
                          radioButtonClassName,
                          'px-3',
                        )}
                        htmlFor={id}
                      >
                        {type.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </FormItem>
          )}
        />
        {!isPartnership && (
          <div className="grid items-start gap-5 md:grid-cols-2">
            <TextInputField
              control={form.control}
              label="희망일"
              min={earliestPreferredDate}
              name="preferredDate"
              placeholder="방문 가능한 날짜를 선택해 주세요."
              required
              type="date"
            />

            <SelectField
              control={form.control}
              label="희망 시간"
              name="preferredTime"
              onValueChange={resetSubmitFeedback}
              options={preferredTimes}
              placeholder="상담 가능 시간 선택"
              required
            />
          </div>
        )}
      </section>

      {isPartnership ? (
        <section className="grid gap-5">
          <SectionHeading index="2" title="제휴 신청" />
          <div className="grid items-start gap-5 md:grid-cols-2">
            <TextInputField
              control={form.control}
              label="회사명"
              name="companyName"
              placeholder="회사명"
              required
            />

            <TextInputField
              control={form.control}
              inputMode="url"
              label="홈페이지"
              name="companyWebsite"
              placeholder="https://domain.com"
              type="url"
            />

            <TextInputField
              control={form.control}
              label="직책/지위"
              name="jobTitle"
              placeholder="직책/지위"
              required
            />

            <TextInputField
              autoComplete="name"
              control={form.control}
              label="담당자 성명"
              name="contactPersonName"
              placeholder="담당자 성명"
              required
            />

            <TextInputField
              autoComplete="tel"
              control={form.control}
              inputMode="tel"
              label="연락처"
              name="partnerPhone"
              placeholder="01012345678"
              required
              type="tel"
            />

            <TextInputField
              autoComplete="email"
              control={form.control}
              label="이메일"
              name="partnerEmail"
              placeholder="contact@email.com"
              required
              type="email"
            />

            <FileInputField
              key={`attachment-${formResetKey}`}
              className="md:col-span-2"
              control={form.control}
              label="첨부파일"
              name="attachment"
            />

            <TextareaField
              className="md:col-span-2"
              control={form.control}
              label="제휴 내용"
              name="partnershipContent"
              placeholder="제휴 목적, 제안 내용, 희망 진행 방식을 입력해 주세요."
              required
            />
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-5">
            <SectionHeading index="2" title="신청자 정보" />
            <div className="grid items-start gap-5 md:grid-cols-2">
              <TextInputField
                autoComplete="name"
                control={form.control}
                label="이름"
                name="applicantName"
                placeholder="이름"
                required
              />

              <RadioButtonGroup
                control={form.control}
                label="성별"
                name="gender"
                options={genderOptions}
                required
              />

              <TextInputField
                autoComplete="bday"
                control={form.control}
                inputMode="numeric"
                label="생년월일"
                maxLength={8}
                name="birthDate"
                pattern="[0-9]{8}"
                placeholder="19870725"
                required
              />

              <TextInputField
                autoComplete="tel"
                control={form.control}
                inputMode="tel"
                label={inquiryType === 'kids' ? '보호자 연락처' : '연락처'}
                name={inquiryType === 'kids' ? 'guardianPhone' : 'phone'}
                placeholder="01012345678"
                required
                type="tel"
              />

              <SelectField
                control={form.control}
                label="사는 지역"
                name="region"
                onValueChange={resetSubmitFeedback}
                options={regions}
                placeholder="사는 지역 선택"
                required
              />

              {requiresOccupation(inquiryType) && (
                <RadioButtonGroup
                  control={form.control}
                  label="직업 구분"
                  name="occupation"
                  options={occupationOptions}
                  required
                />
              )}

              {inquiryType === 'highteen' && (
                <RadioButtonGroup
                  control={form.control}
                  label="학교 구분"
                  name="schoolLevel"
                  options={schoolLevelOptions}
                  required
                />
              )}
            </div>
          </section>

          <section className="grid gap-5">
            <SectionHeading index="3" title="연기 경험 정보" />
            <div className="grid items-start gap-5 md:grid-cols-2">
              {needsActingMajor && (
                <RadioButtonGroup
                  control={form.control}
                  label="연기 전공/비전공"
                  name="actingMajor"
                  options={actingMajorOptions}
                  required
                />
              )}

              <RadioButtonGroup
                control={form.control}
                label="트레이닝 경험"
                name="hasTraining"
                options={yesNoOptions}
                required
              />

              {inquiryType === 'kids' && (
                <RadioButtonGroup
                  control={form.control}
                  label="작품 출연 경험"
                  name="hasPerformance"
                  options={yesNoOptions}
                  required
                />
              )}

              <SelectField
                className="md:col-span-2"
                control={form.control}
                label="유입경로"
                name="inflowSource"
                onValueChange={resetSubmitFeedback}
                options={inflowSources}
                placeholder="알게 된 경로 선택"
                required
              />

              {inflowSource === '기타' && (
                <TextInputField
                  className="md:col-span-2"
                  control={form.control}
                  label="기타 유입경로"
                  name="inflowSourceOther"
                  placeholder="유입경로를 입력해 주세요."
                  required
                />
              )}
            </div>
          </section>
        </>
      )}

      <section className="grid gap-5">
        <SectionHeading index={isPartnership ? '3' : '4'} title="개인정보 수집 및 이용 방침" />
        <div className="max-h-40 overflow-y-auto rounded-md border bg-background p-4 type-body-s leading-6 text-muted-foreground">
          상담 신청 확인과 안내를 위해 이름, 생년월일, 연락처, 거주지역, 문의 유형,
          예약 희망일, 연기 경험 정보 또는 제휴 신청 정보를 수집합니다. 수집된 정보는 상담
          안내 및 문의 처리 목적으로만 사용되며, 이용 목적 달성 후 내부 보관 정책에 따라 파기됩니다.{' '}
          <Link
            aria-label="개인정보처리방침 보기 새 창으로 열기"
            className="font-medium text-foreground underline underline-offset-4"
            href={privacyHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            개인정보처리방침 보기
          </Link>
        </div>
        <FormField
          control={form.control}
          name="privacyConsent"
          render={({ field, fieldState }) => (
            <FormItem
              className="gap-3"
              data-invalid={
                getFieldMessage(validationErrors, 'privacyConsent') || fieldState.invalid
                  ? ''
                  : undefined
              }
            >
              <div className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    aria-invalid={Boolean(
                      getFieldMessage(validationErrors, 'privacyConsent') || fieldState.invalid,
                    )}
                    checked={field.value}
                    className={cn(
                      'size-5',
                      getFieldMessage(validationErrors, 'privacyConsent') && invalidControlClassName,
                    )}
                    name={field.name}
                    onCheckedChange={(checked) => {
                      field.onChange(checked === true)
                      clearFieldError('privacyConsent')
                      resetSubmitFeedback()
                    }}
                  />
                </FormControl>
                <FormLabel className="type-label-m leading-5">
                  개인정보 수집 및 이용 방침에 동의합니다. <RequiredMark />
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
      </section>

      <section className="flex flex-col items-center justify-center gap-3">
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
              data-callback="consultTurnstileSuccess"
              data-error-callback="consultTurnstileError"
              data-expired-callback="consultTurnstileExpired"
              data-language="ko"
              data-sitekey={turnstileSiteKey}
              data-theme="light"
            />
          </>
        ) : (
          <p className="type-body-s text-destructive">
            자동 제출 방지 설정이 준비되지 않았습니다.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            'type-body-m leading-6',
            submitError ? 'font-medium text-destructive' : 'text-muted-foreground',
          )}
          role={submitError ? 'alert' : undefined}
        >
          {submitError ??
            '방문 예약 일정을 체크 후, 확인차 연락드립니다.'}
        </p>
        <Button className="h-12 px-8 type-label-l" disabled={isSubmitting} type="submit">
          {isSubmitting ? '접수 중' : '상담 신청 접수'}
        </Button>
      </div>
        </form>
      </Form>
    </ValidationFeedbackContext.Provider>
  )
}

function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono type-label-m bg-brand px-3 py-2 rounded-full text-white">{index}</span>
      <h2 className="type-title-l font-semibold tracking-normal">{title}</h2>
    </div>
  )
}

type ControlledFieldProps = {
  className?: string
  control: Control<ConsultationFormValues>
  label: string
  name: FieldPath<ConsultationFormValues>
  required?: boolean
}

function TextInputField({
  className,
  control,
  label,
  name,
  required = false,
  ...inputProps
}: ControlledFieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const { clearFieldError, errors, setFieldError } = useValidationFeedback()
  const isDateInput = inputProps.type === 'date'

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const fieldMessage = getFieldMessage(errors, name)

        return (
        <FormItem
          className={className}
          data-invalid={fieldMessage ? '' : undefined}
        >
          <FormLabel>
            {label} {required && <RequiredMark />}
          </FormLabel>
          <FormControl>
            <Input
              {...inputProps}
              {...field}
              aria-invalid={Boolean(fieldMessage)}
              className={cn(
                controlClassName,
                isDateInput && dateInputClassName,
                fieldMessage && invalidControlClassName,
              )}
              onBlur={(event) => {
                field.onBlur()
                const message = getSoftInputValidationMessage(name, event.currentTarget.value)

                if (message) {
                  setFieldError(name, message)
                }
              }}
              onChange={(event) => {
                field.onChange(event)
                clearFieldError(name)
              }}
              value={typeof field.value === 'string' ? field.value : ''}
            />
          </FormControl>
          <FormMessage>{fieldMessage}</FormMessage>
        </FormItem>
        )
      }}
    />
  )
}

function FileInputField({
  className,
  control,
  label,
  name,
  required = false,
}: ControlledFieldProps) {
  const { clearFieldError, errors } = useValidationFeedback()
  const [uploadFiles, setUploadFiles] = useState<FileInfo[]>([])

  const updateSelectedFiles = (
    fieldOnChange: (value: File[] | undefined) => void,
    files: FileInfo[],
  ) => {
    setUploadFiles(files)
    fieldOnChange(files.length > 0 ? files.map((fileInfo) => fileInfo.file) : undefined)
    clearFieldError(name)
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ fieldState, field }) => (
        <FormItem
          className={className}
          data-invalid={getFieldMessage(errors, name) || fieldState.invalid ? '' : undefined}
        >
          <FormLabel>
            {label} {required && <RequiredMark />}
          </FormLabel>
          <FileUpload
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
            files={uploadFiles}
            maxCount={1}
            maxSize={10}
            onFileSelectChange={(files) => updateSelectedFiles(field.onChange, files)}
          >
            <FormControl>
              <DropZone
                className={cn(
                  getFieldMessage(errors, name) && invalidControlClassName,
                  (getFieldMessage(errors, name) || fieldState.invalid) &&
                    'border-destructive/60',
                )}
                inputName={field.name}
                onBlur={field.onBlur}
                prompt="회사소개서, 제안서 등 파일 첨부"
              />
            </FormControl>
            <FileError />
            <FileList
              onClear={() => updateSelectedFiles(field.onChange, [])}
              onRemove={(fileId) => {
                updateSelectedFiles(
                  field.onChange,
                  uploadFiles.filter((file) => file.id !== fileId),
                )
              }}
            />
          </FileUpload>
          <FormMessage>{getFieldMessage(errors, name)}</FormMessage>
        </FormItem>
      )}
    />
  )
}

function TextareaField({
  className,
  control,
  label,
  name,
  required = false,
  ...textareaProps
}: ControlledFieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>) {
  const { clearFieldError, errors } = useValidationFeedback()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem
          className={className}
          data-invalid={getFieldMessage(errors, name) || fieldState.invalid ? '' : undefined}
        >
          <FormLabel>
            {label} {required && <RequiredMark />}
          </FormLabel>
          <FormControl>
            <Textarea
              {...textareaProps}
              {...field}
              aria-invalid={Boolean(getFieldMessage(errors, name) || fieldState.invalid)}
              className={cn(
                'min-h-40',
                getFieldMessage(errors, name) && invalidControlClassName,
              )}
              onChange={(event) => {
                field.onChange(event)
                clearFieldError(name)
              }}
              value={typeof field.value === 'string' ? field.value : ''}
            />
          </FormControl>
          <FormMessage>{getFieldMessage(errors, name)}</FormMessage>
        </FormItem>
      )}
    />
  )
}

function SelectField({
  className,
  control,
  label,
  name,
  onValueChange,
  options,
  placeholder,
  required = false,
}: ControlledFieldProps & {
  onValueChange?: () => void
  options: string[]
  placeholder: string
}) {
  const { clearFieldError, errors } = useValidationFeedback()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem
          className={className}
          data-invalid={getFieldMessage(errors, name) || fieldState.invalid ? '' : undefined}
        >
          <FormLabel>
            {label} {required && <RequiredMark />}
          </FormLabel>
          <Select
            name={field.name}
            onValueChange={(value) => {
              field.onChange(value)
              clearFieldError(name)
              onValueChange?.()
            }}
            value={typeof field.value === 'string' ? field.value : ''}
          >
            <FormControl>
              <SelectTrigger
                aria-invalid={Boolean(getFieldMessage(errors, name) || fieldState.invalid)}
                className={cn(
                  controlClassName,
                  getFieldMessage(errors, name) && invalidControlClassName,
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage>{getFieldMessage(errors, name)}</FormMessage>
        </FormItem>
      )}
    />
  )
}

function RadioButtonGroup({
  control,
  label,
  name,
  options,
  required = false,
}: {
  control: Control<ConsultationFormValues>
  label: string
  name: FieldPath<ConsultationFormValues>
  options: Array<{ label: string; value: string }>
  required?: boolean
}) {
  const { clearFieldError, errors } = useValidationFeedback()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem data-invalid={getFieldMessage(errors, name) || fieldState.invalid ? '' : undefined}>
          <FormLabel>
            {label} {required && <RequiredMark />}
          </FormLabel>
          <div
            aria-invalid={Boolean(getFieldMessage(errors, name) || fieldState.invalid)}
            aria-required={required || undefined}
            className="flex gap-2 flex-row flex-nowrap"
            role="radiogroup"
          >
            {options.map((option) => {
              const id = `${name}-${option.value}`

              return (
                <div className="grid min-w-0 flex-1" key={option.value}>
                  <input
                    checked={field.value === option.value}
                    className="peer sr-only"
                    id={id}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={() => {
                      field.onChange(option.value)
                      clearFieldError(name)
                    }}
                    ref={field.ref}
                    required={required}
                    type="radio"
                    value={option.value}
                  />
                  <Label
                    className={cn(
                      controlClassName,
                      radioButtonClassName,
                      'w-full px-4',
                      (getFieldMessage(errors, name) || fieldState.invalid) &&
                        'border-destructive/60 text-destructive',
                    )}
                    htmlFor={id}
                  >
                    {option.label}
                  </Label>
                </div>
              )
            })}
          </div>
          <FormMessage>{getFieldMessage(errors, name)}</FormMessage>
        </FormItem>
      )}
    />
  )
}

const controlClassName = 'h-12'
const dateInputClassName =
  'appearance-none [-webkit-appearance:none] py-0 leading-[1.2] text-left [font:inherit] [&::-webkit-date-and-time-value]:m-0 [&::-webkit-date-and-time-value]:min-h-0 [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:[font:inherit] [&::-webkit-date-and-time-value]:leading-[1.2]'
const invalidControlClassName = 'border-destructive/60 outline-destructive/60 ring-destructive/20'
const radioButtonClassName =
  'flex cursor-pointer items-center justify-center rounded-md border border-input bg-background type-label-m font-medium text-foreground shadow-xs outline-ring/50 ring-ring/10 transition-[background-color,border-color,color,box-shadow] hover:bg-accent hover:text-accent-foreground peer-checked:border-foreground/60 peer-checked:bg-muted peer-checked:text-foreground peer-focus-visible:ring-4 peer-focus-visible:outline-1 peer-focus-visible:ring-ring/10 peer-focus-visible:outline-ring/50'

function useValidationFeedback() {
  return useContext(ValidationFeedbackContext)
}

function getFieldMessage(
  errors: ValidationErrorMessages,
  name: FieldPath<ConsultationFormValues>,
) {
  return errors[name]
}

function toValidationErrorMessages(errors: FieldErrors<ConsultationFormValues>) {
  const messages: ValidationErrorMessages = {}

  for (const [name, error] of Object.entries(errors)) {
    if (!error || !('message' in error) || !error.message) {
      continue
    }

    messages[name as FieldPath<ConsultationFormValues>] = String(error.message)
  }

  return messages
}

function toZodValidationErrorMessages(error: z.ZodError<ConsultationFormValues>) {
  const messages: ValidationErrorMessages = {}

  for (const issue of error.issues) {
    const [name] = issue.path

    if (typeof name !== 'string') {
      continue
    }

    messages[name as FieldPath<ConsultationFormValues>] = issue.message
  }

  return messages
}

function getVisibleValidationMessages(values: ConsultationFormValues) {
  const messages: ValidationErrorMessages = {}

  if (!values.privacyConsent) {
    messages.privacyConsent = '개인정보 수집 및 이용 방침에 동의해 주세요.'
  }

  if (values.inquiryType === 'partnership') {
    setVisibleMessage(messages, values.companyName, 'companyName', '회사명을 입력해 주세요.')
    setVisibleMessage(messages, values.jobTitle, 'jobTitle', '직책/지위를 입력해 주세요.')
    setVisibleMessage(
      messages,
      values.contactPersonName,
      'contactPersonName',
      '담당자 성명을 입력해 주세요.',
    )
    setVisibleMessage(messages, values.partnerPhone, 'partnerPhone', '연락처를 입력해 주세요.')
    setVisibleMessage(messages, values.partnerEmail, 'partnerEmail', '이메일을 입력해 주세요.')
    setVisibleMessage(
      messages,
      values.partnershipContent,
      'partnershipContent',
      '제휴 내용을 입력해 주세요.',
    )

    if (hasValue(values.partnerEmail) && !isValidEmail(values.partnerEmail)) {
      messages.partnerEmail = '올바른 이메일 주소를 입력해 주세요.'
    }

    if (hasValue(values.partnerPhone) && !isValidKoreanPhoneNumber(values.partnerPhone)) {
      messages.partnerPhone = koreanPhoneMessage
    }

    if (hasValue(values.companyWebsite) && !isValidUrl(values.companyWebsite)) {
      messages.companyWebsite = '올바른 홈페이지 주소를 입력해 주세요.'
    }

    return messages
  }

  setVisibleMessage(messages, values.preferredDate, 'preferredDate', '희망일을 선택해 주세요.')
  if (
    hasValue(values.preferredDate) &&
    isDateInputBefore(values.preferredDate, getEarliestPreferredDateValue())
  ) {
    messages.preferredDate = preferredDateTooEarlyMessage
  }
  setVisibleMessage(messages, values.preferredTime, 'preferredTime', '희망 시간을 선택해 주세요.')
  setVisibleMessage(messages, values.applicantName, 'applicantName', '이름을 입력해 주세요.')
  setVisibleMessage(messages, values.gender, 'gender', '성별을 선택해 주세요.')
  setVisibleMessage(messages, values.birthDate, 'birthDate', '생년월일을 입력해 주세요.')
  setVisibleMessage(
    messages,
    values.inquiryType === 'kids' ? values.guardianPhone : values.phone,
    values.inquiryType === 'kids' ? 'guardianPhone' : 'phone',
    values.inquiryType === 'kids' ? '보호자 연락처를 입력해 주세요.' : '연락처를 입력해 주세요.',
  )
  setVisibleMessage(messages, values.region, 'region', '사는 지역을 선택해 주세요.')
  setVisibleMessage(messages, values.hasTraining, 'hasTraining', '트레이닝 경험을 선택해 주세요.')
  setVisibleMessage(messages, values.inflowSource, 'inflowSource', '유입경로를 선택해 주세요.')

  const birthDateMessage = getBirthDateValidationMessage(values.birthDate)
  if (birthDateMessage) {
    messages.birthDate = birthDateMessage
  }

  const contactPath = values.inquiryType === 'kids' ? 'guardianPhone' : 'phone'
  const contactValue = values.inquiryType === 'kids' ? values.guardianPhone : values.phone
  if (hasValue(contactValue) && !isValidKoreanPhoneNumber(contactValue)) {
    messages[contactPath] = koreanPhoneMessage
  }

  if (requiresOccupation(values.inquiryType)) {
    setVisibleMessage(messages, values.occupation, 'occupation', '직업 구분을 선택해 주세요.')
  }

  if (values.inquiryType === 'highteen') {
    setVisibleMessage(messages, values.schoolLevel, 'schoolLevel', '학교 구분을 선택해 주세요.')
  }

  if (requiresActingMajor(values.inquiryType)) {
    setVisibleMessage(
      messages,
      values.actingMajor,
      'actingMajor',
      '연기 전공/비전공을 선택해 주세요.',
    )
  }

  if (values.inquiryType === 'kids') {
    setVisibleMessage(
      messages,
      values.hasPerformance,
      'hasPerformance',
      '작품 출연 경험을 선택해 주세요.',
    )
  }

  if (values.inflowSource === '기타') {
    setVisibleMessage(
      messages,
      values.inflowSourceOther,
      'inflowSourceOther',
      '기타 유입경로를 입력해 주세요.',
    )
  }

  return messages
}

function setVisibleMessage(
  messages: ValidationErrorMessages,
  value: string | undefined,
  path: FieldPath<ConsultationFormValues>,
  message: string,
) {
  if (!hasValue(value)) {
    messages[path] = message
  }
}

function getDefaultValues(inquiryType: InquiryType): ConsultationFormValues {
  return {
    actingMajor: '',
    applicantName: '',
    attachment: undefined,
    birthDate: '',
    companyName: '',
    companyWebsite: '',
    contactPersonName: '',
    gender: '',
    guardianPhone: '',
    hasPerformance: '',
    hasTraining: '',
    inflowSource: '',
    inflowSourceOther: '',
    inquiryType,
    jobTitle: '',
    occupation: '',
    partnerEmail: '',
    partnerPhone: '',
    partnershipContent: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    privacyConsent: false,
    region: '',
    schoolLevel: '',
  }
}

function toConsultFormData(values: ConsultationFormValues, turnstileToken: string) {
  const formData = new FormData()
  const attachments = Array.isArray(values.attachment) ? values.attachment : []

  formData.set('cf-turnstile-response', turnstileToken)

  for (const [key, value] of Object.entries(values)) {
    if (key === 'attachment' || value === undefined || value === null) {
      continue
    }

    if (typeof value === 'boolean') {
      formData.set(key, String(value))
      continue
    }

    if (typeof value === 'string' && value.trim()) {
      formData.set(key, phoneFieldNames.has(key) ? normalizePhoneNumber(value) : value.trim())
    }
  }

  for (const file of attachments) {
    if (file instanceof File) {
      formData.append('attachment', file)
    }
  }

  return formData
}

function getEarliestPreferredDateValue(date = new Date()) {
  return toDateInputValue(addDays(date, 1))
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)

  nextDate.setDate(nextDate.getDate() + days)

  return nextDate
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isDateInputBefore(value: string, minValue: string) {
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) && value < minValue
}

function getSoftInputValidationMessage(name: FieldPath<ConsultationFormValues>, value: string) {
  if (!hasValue(value)) {
    return null
  }

  if (name === 'birthDate') {
    const digits = normalizePhoneNumber(value)

    return digits.length >= 8 ? getBirthDateValidationMessage(value) : null
  }

  if (phoneFieldNames.has(name)) {
    const digits = normalizePhoneNumber(value)

    return digits.length >= 8 && !isValidKoreanPhoneNumber(value) ? koreanPhoneMessage : null
  }

  return null
}

function getBirthDateValidationMessage(value: string | undefined) {
  if (!hasValue(value)) {
    return null
  }

  if (!/^[0-9]{8}$/.test(value)) {
    return birthDateFormatMessage
  }

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))

  if (year < 1900 || !isValidDateParts(year, month, day)) {
    return birthDateInvalidMessage
  }

  const birthDate = new Date(year, month - 1, day)
  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (birthDate > todayDate) {
    return birthDateFutureMessage
  }

  return null
}

function isValidDateParts(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, '')
}

function isValidKoreanPhoneNumber(value: string) {
  const trimmedValue = value.trim()

  if (!/^[0-9\s-]+$/.test(trimmedValue)) {
    return false
  }

  const digits = normalizePhoneNumber(trimmedValue)

  return (
    /^01[016789][0-9]{7,8}$/.test(digits) ||
    /^02[0-9]{7,8}$/.test(digits) ||
    /^0(?:3[1-3]|4[1-4]|5[1-5]|6[1-4])[0-9]{7,8}$/.test(digits) ||
    /^0(?:50[0-9]|70|80)[0-9]{7,8}$/.test(digits) ||
    /^1[568][0-9]{6}$/.test(digits)
  )
}

function hasValue(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function addRequiredIssue(
  context: z.RefinementCtx,
  value: string | undefined,
  path: FieldPath<ConsultationFormValues>,
  message: string,
) {
  if (!hasValue(value)) {
    addIssue(context, path, message)
  }
}

function addIssue(
  context: z.RefinementCtx,
  path: FieldPath<ConsultationFormValues>,
  message: string,
) {
  context.addIssue({
    code: 'custom',
    message,
    path: [path],
  })
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value)

    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function RequiredMark() {
  return (
    <span aria-label="필수" className="text-destructive">
      *
    </span>
  )
}
