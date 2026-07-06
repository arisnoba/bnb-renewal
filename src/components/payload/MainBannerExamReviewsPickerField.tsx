'use client'

import type { RelationshipFieldClientComponent } from 'payload'

import { RelationshipField, useField } from '@payloadcms/ui'
import { useEffect, useMemo, useRef } from 'react'

import {
  reviewIdsFromPickerValue,
  reviewIdsFromRows,
  reviewPickerSignature,
  reviewRowsFromPickerValue,
  type ReviewRow,
} from './MainBannerExamReviewsPickerField.utils'

type ReviewRowsField = {
  setValue: (value: ReviewRow[]) => void
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
  const reviewsPath = siblingPath(props.path, 'reviews')
  const { setValue: setPickerValue, value: pickerValue } = useField<unknown[]>({
    potentiallyStalePath: props.path,
  })
  const { setValue: setReviewsValue, value: reviewsValue } = useField<ReviewRow[]>({
    hasRows: true,
    path: reviewsPath,
  }) as ReviewRowsField
  const initializedRef = useRef(false)
  const pickerIds = useMemo(() => reviewIdsFromPickerValue(pickerValue), [pickerValue])
  const rowIds = useMemo(() => reviewIdsFromRows(reviewsValue), [reviewsValue])
  const pickerSignature = reviewPickerSignature(pickerIds)
  const rowSignature = reviewPickerSignature(rowIds)

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
      initializedRef.current = true

      return
    }

    setReviewsValue(reviewRowsFromPickerValue(pickerValue, reviewsValue))
    initializedRef.current = true
  }, [
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
