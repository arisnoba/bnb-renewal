'use client'

import type { SelectFieldClientComponent } from 'payload'

import {
  ConfirmationModal,
  SelectField,
  useField,
  useForm,
  useFormFields,
  useModal,
} from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

type ArrayFieldState = {
  rows?: unknown[]
  setValue: (value: unknown[]) => void
  value?: unknown
}
type FormArrayFieldState = {
  rows?: unknown[]
  value?: unknown
}
type RemoveFieldRow = (args: { path: string; rowIndex: number }) => void
type PendingCenterChange = {
  nextCenter: string
  previousCenter: string
} | null

const centerChangeModalSlug = 'main-banner-center-change-confirmation'

function rowCount(field?: FormArrayFieldState) {
  if (Array.isArray(field?.rows)) {
    return field.rows.length
  }

  return Array.isArray(field?.value) ? field.value.length : 0
}

function clearArrayField({
  path,
  removeFieldRow,
  rowCount,
  setValue,
}: {
  path: string
  removeFieldRow: RemoveFieldRow
  rowCount: number
  setValue: (value: unknown[]) => void
}) {
  for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
    removeFieldRow({ path, rowIndex })
  }

  setValue([])
}

export const MainBannerCenterField: SelectFieldClientComponent = (props) => {
  const { setValue: setCenterValue, value: centerValue } = useField<string>({
    potentiallyStalePath: props.path,
  })
  const { removeFieldRow } = useForm()
  const { openModal } = useModal()
  const linkedProfileItemsField = useField<unknown[]>({
    hasRows: true,
    path: 'linkedProfileItems',
  }) as ArrayFieldState
  const linkedExamReviewItemsField = useField<unknown[]>({
    hasRows: true,
    path: 'linkedExamReviewItems',
  }) as ArrayFieldState
  const { linkedExamReviewItemsCount, linkedProfileItemsCount } = useFormFields(([fields]) => ({
    linkedExamReviewItemsCount: rowCount(fields.linkedExamReviewItems as FormArrayFieldState),
    linkedProfileItemsCount: rowCount(fields.linkedProfileItems as FormArrayFieldState),
  }))
  const previousCenterRef = useRef(centerValue)
  const pendingCenterChangeRef = useRef<PendingCenterChange>(null)
  const isRevertingRef = useRef(false)
  const setLinkedProfileItems = linkedProfileItemsField.setValue
  const setLinkedExamReviewItems = linkedExamReviewItemsField.setValue

  useEffect(() => {
    const previousCenter = previousCenterRef.current
    const nextCenter = centerValue

    if (isRevertingRef.current) {
      isRevertingRef.current = false
      previousCenterRef.current = nextCenter

      return
    }

    if (!previousCenter || !nextCenter || previousCenter === nextCenter) {
      previousCenterRef.current = nextCenter

      return
    }

    const hasLinkedContent =
      linkedProfileItemsCount > 0 || linkedExamReviewItemsCount > 0

    if (!hasLinkedContent) {
      previousCenterRef.current = nextCenter

      return
    }

    const pendingCenterChange = pendingCenterChangeRef.current

    if (
      pendingCenterChange?.previousCenter === previousCenter &&
      pendingCenterChange.nextCenter === nextCenter
    ) {
      return
    }

    pendingCenterChangeRef.current = { nextCenter, previousCenter }
    openModal(centerChangeModalSlug)
  }, [
    centerValue,
    linkedExamReviewItemsCount,
    linkedProfileItemsCount,
    openModal,
  ])

  const cancelCenterChange = () => {
    const pendingCenterChange = pendingCenterChangeRef.current

    if (!pendingCenterChange) {
      return
    }

    isRevertingRef.current = true
    setCenterValue(pendingCenterChange.previousCenter)
    pendingCenterChangeRef.current = null
  }

  const confirmCenterChange = () => {
    const pendingCenterChange = pendingCenterChangeRef.current

    clearArrayField({
      path: 'linkedProfileItems',
      removeFieldRow,
      rowCount: linkedProfileItemsCount,
      setValue: setLinkedProfileItems,
    })
    clearArrayField({
      path: 'linkedExamReviewItems',
      removeFieldRow,
      rowCount: linkedExamReviewItemsCount,
      setValue: setLinkedExamReviewItems,
    })

    previousCenterRef.current = pendingCenterChange?.nextCenter ?? centerValue
    pendingCenterChangeRef.current = null
  }

  return (
    <>
      <SelectField {...props} />
      <ConfirmationModal
        body="센터를 변경하면 연결된 프로필과 합격후기가 삭제됩니다."
        cancelLabel="취소"
        confirmLabel="초기화하고 수정 계속"
        heading="연결된 콘텐츠가 초기화 됩니다."
        modalSlug={centerChangeModalSlug}
        onCancel={cancelCenterChange}
        onConfirm={confirmCenterChange}
      />
    </>
  )
}
