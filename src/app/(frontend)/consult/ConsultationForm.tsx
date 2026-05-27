'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Script from 'next/script'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type BaseSyntheticEvent,
  type InputHTMLAttributes,
} from 'react'
import { useForm, type Control, type FieldErrors, type FieldPath } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { cn } from '@/utilities/ui'
import { inquiryTypeValues, type InquiryType } from './inquiryTypeParams'

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

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const optionalString = z.string().optional()

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

      if (hasValue(values.companyWebsite) && !isValidUrl(values.companyWebsite)) {
        addIssue(context, 'companyWebsite', '올바른 홈페이지 주소를 입력해 주세요.')
      }

      return
    }

    addRequiredIssue(context, values.preferredDate, 'preferredDate', '희망일을 선택해 주세요.')
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

    if (hasValue(values.birthDate) && !/^[0-9]{8}$/.test(values.birthDate)) {
      addIssue(context, 'birthDate', '생년월일은 19870725 형식의 숫자 8자로 입력해 주세요.')
    }

    if (values.inquiryType === 'admission') {
      addRequiredIssue(context, values.occupation, 'occupation', '직업 구분을 선택해 주세요.')
    }

    if (values.inquiryType === 'highteen') {
      addRequiredIssue(context, values.schoolLevel, 'schoolLevel', '학교 구분을 선택해 주세요.')
    }

    if (['art', 'admission', 'highteen'].includes(values.inquiryType)) {
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
}>({
  clearFieldError: () => {},
  errors: {},
})

export function ConsultationForm({ initialInquiryType }: { initialInquiryType: InquiryType }) {
  const today = useMemo(() => toDateInputValue(new Date()), [])
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrorMessages>({})
  const form = useForm<ConsultationFormValues>({
    defaultValues: getDefaultValues(initialInquiryType, today),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: zodResolver(consultationFormSchema),
    shouldFocusError: true,
    shouldUnregister: true,
  })
  const inquiryType = form.watch('inquiryType') ?? initialInquiryType
  const inflowSource = form.watch('inflowSource')
  const isPartnership = inquiryType === 'partnership'
  const needsActingMajor = ['art', 'admission', 'highteen'].includes(inquiryType)
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
  const validationFeedback = useMemo(
    () => ({
      clearFieldError,
      errors: validationErrors,
    }),
    [clearFieldError, validationErrors],
  )

  useEffect(() => {
    form.reset(getDefaultValues(initialInquiryType, today))
    setSubmitted(false)
    setSubmitError(null)
    setValidationErrors({})
  }, [form, initialInquiryType, today])

  const handleValidSubmit = async (
    _values: ConsultationFormValues,
    event?: BaseSyntheticEvent,
  ) => {
    setSubmitted(false)
    setSubmitError(null)
    setValidationErrors({})

    if (!turnstileSiteKey) {
      setSubmitError('자동 제출 방지 설정이 준비되지 않았습니다. 관리자에게 문의해 주세요.')
      return
    }

    const formElement = event?.currentTarget as HTMLFormElement | undefined
    const formData = formElement ? new FormData(formElement) : null
    const turnstileToken = formData?.get('cf-turnstile-response')

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

  const handleInvalidSubmit = (errors: FieldErrors<ConsultationFormValues>) => {
    const visibleMessages = getVisibleValidationMessages(form.getValues())
    const parsedValues = consultationFormSchema.safeParse(form.getValues())

    setSubmitted(false)
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
    if (submitted) {
      setSubmitted(false)
    }

    if (submitError) {
      setSubmitError(null)
    }
  }

  return (
    <ValidationFeedbackContext.Provider value={validationFeedback}>
      <Form {...form}>
        <form
          className="grid gap-10"
          encType="multipart/form-data"
          noValidate
          onChange={resetSubmitFeedback}
          onSubmit={form.handleSubmit(handleValidSubmit, handleInvalidSubmit)}
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
                    form.setValue('inquiryType', type.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    resetSubmitFeedback()
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
            <TextInputField control={form.control} label="회사명" name="companyName" required />

            <TextInputField
              control={form.control}
              inputMode="url"
              label="홈페이지"
              name="companyWebsite"
              placeholder="https://"
              type="url"
            />

            <TextInputField control={form.control} label="직책/지위" name="jobTitle" required />

            <TextInputField
              autoComplete="name"
              control={form.control}
              label="담당자 성명"
              name="contactPersonName"
              required
            />

            <TextInputField
              autoComplete="tel"
              control={form.control}
              inputMode="tel"
              label="연락처"
              name="partnerPhone"
              required
              type="tel"
            />

            <TextInputField
              autoComplete="email"
              control={form.control}
              label="이메일"
              name="partnerEmail"
              required
              type="email"
            />

            <FileInputField
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
              required
            />
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-5">
            <SectionHeading index="02" title="상담 예약" />
            <div className="grid gap-5 md:grid-cols-2">
              <TextInputField
                control={form.control}
                label="희망일"
                name="preferredDate"
                required
                type="date"
              />

              <SelectField
                control={form.control}
                label="희망 시간"
                name="preferredTime"
                onValueChange={resetSubmitFeedback}
                options={preferredTimes}
                placeholder="시간 선택"
                required
              />
            </div>
          </section>

          <section className="grid gap-5">
            <SectionHeading index="03" title="신청자 정보" />
            <div className="grid gap-5 md:grid-cols-2">
              <TextInputField
                autoComplete="name"
                control={form.control}
                label="이름"
                name="applicantName"
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
                control={form.control}
                inputMode="numeric"
                label="생년월일"
                maxLength={8}
                name="birthDate"
                pattern="[0-9]{8}"
                placeholder="예: 19870725"
                required
              />

              <TextInputField
                autoComplete="tel"
                control={form.control}
                inputMode="tel"
                label={inquiryType === 'kids' ? '보호자 연락처' : '연락처'}
                name={inquiryType === 'kids' ? 'guardianPhone' : 'phone'}
                placeholder="예: 01012345678"
                required
                type="tel"
              />

              <SelectField
                control={form.control}
                label="사는 지역"
                name="region"
                onValueChange={resetSubmitFeedback}
                options={regions}
                placeholder="지역 선택"
                required
              />

              {inquiryType === 'admission' && (
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
            <SectionHeading index="04" title="연기 경험 정보" />
            <div className="grid gap-5 md:grid-cols-2">
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
                placeholder="유입경로 선택"
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

      <section className="grid gap-4 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-normal">개인정보 수집 및 이용 방침</h2>
        <div className="max-h-40 overflow-y-auto rounded-md border bg-background p-4 text-sm leading-6 text-muted-foreground">
          회사는 상담 신청 확인과 안내를 위해 이름, 생년월일, 연락처, 거주지역, 문의 유형,
          예약 희망일, 연기 경험 정보 또는 제휴 신청 정보를 수집합니다. 수집된 정보는 상담
          안내 및 문의 처리 목적으로만 사용되며, 이용 목적 달성 후 내부 보관 정책에 따라
          파기됩니다.
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
              <div className="flex items-center gap-3">
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
                <FormLabel className="text-sm leading-5">
                  개인정보 수집 및 이용 방침에 동의합니다. <RequiredMark />
                </FormLabel>
              </div>
              <FormMessage>{getFieldMessage(validationErrors, 'privacyConsent')}</FormMessage>
            </FormItem>
          )}
        />
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
      </Form>
    </ValidationFeedbackContext.Provider>
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
            <Input
              {...inputProps}
              {...field}
              aria-invalid={Boolean(getFieldMessage(errors, name) || fieldState.invalid)}
              className={cn(
                controlClassName,
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

function FileInputField({
  className,
  control,
  label,
  name,
  required = false,
}: ControlledFieldProps) {
  const { clearFieldError, errors } = useValidationFeedback()

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
          <FormControl>
            <Input
              aria-invalid={Boolean(getFieldMessage(errors, name) || fieldState.invalid)}
              className={cn(
                controlClassName,
                getFieldMessage(errors, name) && invalidControlClassName,
              )}
              name={field.name}
              onBlur={field.onBlur}
              onChange={(event) => {
                field.onChange(event.target.files)
                clearFieldError(name)
              }}
              type="file"
            />
          </FormControl>
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
}: ControlledFieldProps) {
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
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
          >
            {options.map((option) => {
              const id = `${name}-${option.value}`

              return (
                <div className="grid" key={option.value}>
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
                    type="radio"
                    value={option.value}
                  />
                  <Label
                    className={cn(
                      controlClassName,
                      'flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-4 peer-focus-visible:outline-1',
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
const invalidControlClassName = 'border-destructive/60 outline-destructive/60 ring-destructive/20'

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

    if (hasValue(values.companyWebsite) && !isValidUrl(values.companyWebsite)) {
      messages.companyWebsite = '올바른 홈페이지 주소를 입력해 주세요.'
    }

    return messages
  }

  setVisibleMessage(messages, values.preferredDate, 'preferredDate', '희망일을 선택해 주세요.')
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

  if (hasValue(values.birthDate) && !/^[0-9]{8}$/.test(values.birthDate)) {
    messages.birthDate = '생년월일은 19870725 형식의 숫자 8자로 입력해 주세요.'
  }

  if (values.inquiryType === 'admission') {
    setVisibleMessage(messages, values.occupation, 'occupation', '직업 구분을 선택해 주세요.')
  }

  if (values.inquiryType === 'highteen') {
    setVisibleMessage(messages, values.schoolLevel, 'schoolLevel', '학교 구분을 선택해 주세요.')
  }

  if (['art', 'admission', 'highteen'].includes(values.inquiryType)) {
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

function getDefaultValues(inquiryType: InquiryType, today: string): ConsultationFormValues {
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
    preferredDate: today,
    preferredTime: '',
    privacyConsent: false,
    region: '',
    schoolLevel: '',
  }
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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
