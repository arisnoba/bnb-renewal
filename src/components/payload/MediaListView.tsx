'use client'

import type { ListViewClientProps } from 'payload'

import { DefaultListView } from '@payloadcms/ui'

export function MediaListView(props: ListViewClientProps) {
  return <DefaultListView {...props} disableBulkDelete />
}
