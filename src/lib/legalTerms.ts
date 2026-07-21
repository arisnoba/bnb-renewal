import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Term } from '@/payload-types'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import type { TypeWithVersion } from 'payload'

import { legalDocumentToRichText } from '@/components/legal/legalRichText'
import {
  privacyPolicyDocument,
  termsOfServiceDocument,
  type LegalDocument,
} from '@/components/legal/legalDocuments'
import type { LegalVersionOption } from '@/components/legal/LegalVersionSelect'
import {
  formatLegalDate,
  legalDateKey,
  sortByLegalDateDescending,
} from '@/lib/legalDates'

export type LegalDocumentType = 'privacy' | 'terms'

export type LegalTermPageData = {
  body: DefaultTypedEditorState
  documentType: LegalDocumentType
  effectiveDate: string | null
  selectedVersion: string
  title: string
  updatedAt: string | null
  versions: LegalVersionOption[]
}

const fallbackDocuments = {
  privacy: privacyPolicyDocument,
  terms: termsOfServiceDocument,
} satisfies Record<LegalDocumentType, LegalDocument>

export async function getLegalTermPageData(
  documentType: LegalDocumentType,
  requestedVersion: string | undefined,
): Promise<LegalTermPageData> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'terms',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: {
      documentType: {
        equals: documentType,
      },
    },
  })

  const current = result.docs[0] as Term | undefined
  if (!current) {
    const fallback = fallbackDocuments[documentType]

    return {
      body: legalDocumentToRichText(fallback),
      documentType,
      effectiveDate: fallback.effectiveAt,
      selectedVersion: '',
      title: fallback.title,
      updatedAt: fallback.updatedAt,
      versions: [{ label: fallback.effectiveAt, value: '' }],
    }
  }

  const versionsResult = await payload.findVersions({
    collection: 'terms',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    sort: '-updatedAt',
    where: {
      parent: {
        equals: current.id,
      },
    },
  })

  const versions = sortByLegalDateDescending(
    versionsResult.docs as TypeWithVersion<Term>[],
    (version) => version.version.effectiveDate ?? version.updatedAt,
  )
  const selectableVersions = getSelectableVersions(current, versions)
  const selectedVersion = requestedVersion
    ? selectableVersions.find((version) => String(version.id) === requestedVersion)
    : undefined
  const selectedDocument = selectedVersion?.version ?? current
  const selectedVersionValue = selectedVersion ? String(selectedVersion.id) : ''

  return {
    body: selectedDocument.body,
    documentType,
    effectiveDate: selectedDocument.effectiveDate ?? null,
    selectedVersion: selectedVersionValue,
    title: selectedDocument.title,
    updatedAt: selectedDocument.updatedAt ?? null,
    versions: buildVersionOptions(current, selectableVersions),
  }
}

function buildVersionOptions(current: Term, versions: TypeWithVersion<Term>[]): LegalVersionOption[] {
  const options = [
    {
      date: current.effectiveDate ?? current.updatedAt,
      label: formatLegalDate(current.effectiveDate ?? current.updatedAt),
      value: '',
    },
    ...versions.map((version) => ({
      date: version.version.effectiveDate ?? version.updatedAt,
      label: formatLegalDate(version.version.effectiveDate ?? version.updatedAt),
      value: String(version.id),
    })),
  ]

  return sortByLegalDateDescending(options, (option) => option.date).map((option) => ({
    label: option.label,
    value: option.value,
  }))
}

function getSelectableVersions(current: Term, versions: TypeWithVersion<Term>[]) {
  const seenEffectiveDates = new Set([legalDateIdentity(current.effectiveDate ?? current.updatedAt)])

  return versions.filter((version) => {
    if (isCurrentSnapshot(current, version)) {
      return false
    }

    const key = legalDateIdentity(version.version.effectiveDate ?? version.updatedAt)
    if (seenEffectiveDates.has(key)) {
      return false
    }

    seenEffectiveDates.add(key)
    return true
  })
}

function isCurrentSnapshot(current: Term, version: TypeWithVersion<Term>) {
  return (
    version.version.title === current.title &&
    version.version.documentType === current.documentType &&
    version.version.effectiveDate === current.effectiveDate &&
    version.version.updatedAt === current.updatedAt
  )
}

function legalDateIdentity(value: string | null | undefined) {
  return legalDateKey(value) ?? value ?? 'unknown'
}

export { formatLegalDate } from '@/lib/legalDates'
