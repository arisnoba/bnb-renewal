import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { legalDocumentToRichText } from '@/components/legal/legalRichText'
import {
  privacyPolicyDocument,
  termsOfServiceDocument,
  type LegalDocument,
} from '@/components/legal/legalDocuments'

const legalDocuments = [
  {
    documentType: 'privacy' as const,
    source: privacyPolicyDocument,
  },
  {
    documentType: 'terms' as const,
    source: termsOfServiceDocument,
  },
]

function toEffectiveDate(document: LegalDocument) {
  const match = document.effectiveAt.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
  if (!match) {
    return undefined
  }

  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000+09:00`
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  let created = 0
  let updated = 0

  try {
    for (const { documentType, source } of legalDocuments) {
      const data = {
        body: legalDocumentToRichText(source),
        documentType,
        effectiveDate: toEffectiveDate(source),
        title: source.title,
      }

      const existing = await payload.find({
        collection: 'terms',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          documentType: {
            equals: documentType,
          },
        },
      })

      if (existing.docs[0]) {
        await payload.update({
          collection: 'terms',
          data,
          depth: 0,
          id: existing.docs[0].id,
          overrideAccess: true,
        })
        updated += 1
      } else {
        await payload.create({
          collection: 'terms',
          data,
          depth: 0,
          overrideAccess: true,
        })
        created += 1
      }
    }

    console.log(JSON.stringify({ created, updated }, null, 2))
  } finally {
    await payload.destroy()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
