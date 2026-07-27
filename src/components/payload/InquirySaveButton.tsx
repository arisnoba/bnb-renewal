'use client'

import type { SaveButtonClientProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

import {
  FormSubmit,
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useForm,
  useFormModified,
  useHotkey,
  useOperation,
  useRouteTransition,
  useTranslation,
} from '@payloadcms/ui'

import { shouldRedirectAfterInquirySave } from './inquirySaveResult'

export function InquirySaveButton({ label: labelProp }: SaveButtonClientProps) {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const { uploadStatus } = useDocumentInfo()
  const editDepth = useEditDepth()
  const { submit } = useForm()
  const modified = useFormModified()
  const operation = useOperation()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { t } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const disabled = (operation === 'update' && !modified) || uploadStatus === 'uploading'
  const label = labelProp || t('general:save')

  useHotkey(
    {
      cmdCtrlKey: true,
      editDepth,
      keyCodes: ['s'],
    },
    (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (!disabled) {
        buttonRef.current?.click()
      }
    },
  )

  const handleSubmit = async () => {
    if (uploadStatus === 'uploading') {
      return
    }

    const result = await submit()

    if (!shouldRedirectAfterInquirySave(result)) {
      return
    }

    startRouteTransition(() => {
      router.push(
        formatAdminURL({
          adminRoute,
          path: '/collections/inquiries',
        }),
      )
    })
  }

  return (
    <FormSubmit
      buttonId="action-save"
      disabled={disabled}
      onClick={() => void handleSubmit()}
      ref={buttonRef}
      size="medium"
      type="button"
    >
      {label}
    </FormSubmit>
  )
}
