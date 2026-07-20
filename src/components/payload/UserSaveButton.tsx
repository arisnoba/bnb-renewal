'use client'

import type { SaveButtonClientProps } from 'payload'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  FormSubmit,
  useDocumentInfo,
  useForm,
  useFormModified,
  useOperation,
  useTranslation,
} from '@payloadcms/ui'

function InlinePasswordSaveButton({ label: labelProp }: SaveButtonClientProps) {
  const { uploadStatus } = useDocumentInfo()
  const { submit } = useForm()
  const modified = useFormModified()
  const operation = useOperation()
  const { t } = useTranslation()

  const disabled = (operation === 'update' && !modified) || uploadStatus === 'uploading'
  const label = labelProp || t('general:save')

  const handleSubmit = () => {
    if (uploadStatus === 'uploading') {
      return
    }

    void submit()
  }

  return (
    <FormSubmit
      buttonId="password-action-save"
      disabled={disabled}
      onClick={handleSubmit}
      size="medium"
      type="button"
    >
      {label}
    </FormSubmit>
  )
}

function findPasswordControls() {
  const cancelButton = document.querySelector('#cancel-change-password')
  const controls = cancelButton?.closest('.auth-fields__controls')

  return controls instanceof HTMLElement ? controls : null
}

export function UserPasswordSaveAction() {
  const [passwordControls, setPasswordControls] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const syncPasswordControls = () => {
      setPasswordControls(findPasswordControls())
    }

    const observer = new MutationObserver(syncPasswordControls)
    const editView = document.querySelector('.collection-edit')

    observer.observe(editView ?? document.body, {
      childList: true,
      subtree: true,
    })

    syncPasswordControls()

    return () => {
      observer.disconnect()
    }
  }, [])

  return passwordControls
    ? createPortal(<InlinePasswordSaveButton />, passwordControls)
    : null
}
