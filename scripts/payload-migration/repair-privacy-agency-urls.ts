import configPromise from '@payload-config'
import { getPayload } from 'payload'

const replacements = new Map([
  [
    '기관: 개인정보 분쟁조정위원회 / 연락처: 1833-6972 / 웹사이트:',
    '기관: 개인정보 분쟁조정위원회 / 연락처: 1833-6972 / 웹사이트: www.kopico.go.kr',
  ],
  [
    '기관: 대검찰청 / 연락처: 국번 없이 1301 / 웹사이트:',
    '기관: 대검찰청 / 연락처: 국번 없이 1301 / 웹사이트: www.spo.go.kr',
  ],
])

type RichTextNode = {
  children?: RichTextNode[]
  text?: string
  type?: string
  [key: string]: unknown
}

function repairNode(node: RichTextNode): number {
  let repaired = 0

  if (node.type === 'text' && typeof node.text === 'string') {
    const replacement = replacements.get(node.text.trim())

    if (replacement) {
      node.text = node.text.replace(node.text.trim(), replacement)
      repaired += 1
    }
  }

  for (const child of node.children ?? []) {
    repaired += repairNode(child)
  }

  return repaired
}

async function main() {
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'terms',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        documentType: {
          equals: 'privacy',
        },
      },
    })

    const doc = result.docs[0]
    if (!doc) {
      console.log(JSON.stringify({ repaired: 0, reason: 'privacy document not found' }, null, 2))
      return
    }

    const repaired = repairNode(doc.body.root)
    if (repaired > 0) {
      await payload.update({
        collection: 'terms',
        data: {
          body: doc.body,
        },
        depth: 0,
        id: doc.id,
        overrideAccess: true,
      })
    }

    console.log(JSON.stringify({ repaired }, null, 2))
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
