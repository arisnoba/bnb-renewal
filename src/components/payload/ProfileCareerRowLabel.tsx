'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type ProfileCareer = {
  title?: string | null
}

export const ProfileCareerRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<ProfileCareer>()
  const title = String(data?.title ?? '').trim()
  const fallback = rowNumber !== undefined ? `경력 ${rowNumber + 1}` : '경력'

  return <div>{title || fallback}</div>
}
