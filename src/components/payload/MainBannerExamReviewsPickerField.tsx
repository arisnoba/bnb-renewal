'use client'

import type { RelationshipFieldClientComponent } from 'payload'

import { RelationshipField, useField, useFormFields } from '@payloadcms/ui'
import { useEffect, useMemo, useRef } from 'react'

import {
  reviewIdsFromPickerValue,
  reviewIdsFromRows,
  reviewPickerSignature,
  reviewRowsFromPickerValue,
  type ReviewRow,
} from './MainBannerExamReviewsPickerField.utils'

type ReviewRowsField = {
  rows?: { id?: string }[]
  setValue: (value: ReviewRow[]) => void
  value?: unknown
}
type FormFieldState = {
  value?: unknown
}

function siblingPath(path: string, siblingName: string) {
  const suffix = '.reviewPicker'

  if (path.endsWith(suffix)) {
    return `${path.slice(0, -suffix.length)}.${siblingName}`
  }

  return siblingName
}

export const MainBannerExamReviewsPickerField: RelationshipFieldClientComponent = (props) => {
  const {
    path: pickerPath,
    setValue: setPickerValue,
    value: pickerValue,
  } = useField<unknown[]>({
    potentiallyStalePath: props.path,
  })
  const reviewsPath = siblingPath(pickerPath, 'reviews')
  const {
    rows = [],
    setValue: setReviewsValue,
    value: reviewsValue,
  } = useField<ReviewRow[]>({
    hasRows: true,
    path: reviewsPath,
  }) as ReviewRowsField
  const fallbackRows = Array.isArray(reviewsValue) ? reviewsValue : []
  const currentRows = useFormFields(([fields]) =>
    rows.map((row, index): ReviewRow => {
      const idField = fields[`${reviewsPath}.${index}.id`] as FormFieldState | undefined
      const reviewField = fields[`${reviewsPath}.${index}.review`] as FormFieldState | undefined
      const fallbackRow = fallbackRows[index]

      return {
        id:
          typeof idField?.value === 'string'
            ? idField.value
            : (fallbackRow?.id ?? row.id),
        review: reviewField?.value ?? fallbackRow?.review,
      }
    }),
  )
  const initializedRef = useRef(false)
  const pickerIds = useMemo(() => reviewIdsFromPickerValue(pickerValue), [pickerValue])
  const rowIds = useMemo(
    () => reviewIdsFromRows(currentRows.length > 0 ? currentRows : reviewsValue),
    [currentRows, reviewsValue],
  )
  const pickerSignature = reviewPickerSignature(pickerIds)
  const rowSignature = reviewPickerSignature(rowIds)
  const lastSyncedPickerSignatureRef = useRef('')

  useEffect(() => {
    if (initializedRef.current || pickerIds.length > 0 || rowIds.length === 0) {
      return
    }

    setPickerValue(rowIds)
    initializedRef.current = true
  }, [pickerIds.length, rowIds, setPickerValue])

  useEffect(() => {
    if (!initializedRef.current && pickerIds.length === 0 && rowIds.length > 0) {
      return
    }

    if (pickerSignature === rowSignature) {
      lastSyncedPickerSignatureRef.current = pickerSignature
      initializedRef.current = true

      return
    }

    if (lastSyncedPickerSignatureRef.current === pickerSignature) {
      initializedRef.current = true

      return
    }

    setReviewsValue(
      reviewRowsFromPickerValue(
        pickerValue,
        currentRows.length > 0 ? currentRows : reviewsValue,
      ),
    )
    lastSyncedPickerSignatureRef.current = pickerSignature
    initializedRef.current = true
  }, [
    currentRows,
    pickerIds.length,
    pickerValue,
    pickerSignature,
    rowIds.length,
    rowSignature,
    reviewsValue,
    setReviewsValue,
  ])

  return <RelationshipField {...props} />
}
