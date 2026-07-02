'use client'

import { useId } from 'react'

import { LoadingOverlayToggle, useFormProcessing } from '@payloadcms/ui'

export function AdminSaveLoadingOverlay() {
  const isProcessing = useFormProcessing()
  const overlayId = useId()

  return (
    <LoadingOverlayToggle
      loadingText="저장 중입니다."
      name={`admin-save-${overlayId}`}
      show={isProcessing}
      type="withoutNav"
    />
  )
}
