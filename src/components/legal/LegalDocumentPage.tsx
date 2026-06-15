import RichText from '@/components/RichText'
import type { LegalTermPageData } from '@/lib/legalTerms'

import { LegalVersionSelect } from './LegalVersionSelect'

const documentDescriptions = {
  privacy: '(주)비앤비 인더스트리가 운영하는 배우앤배움 웹사이트의 개인정보 처리 기준입니다.',
  terms: '배우앤배움 웹사이트 이용 조건과 이용자 및 회사의 권리, 의무를 정한 약관입니다.',
} satisfies Record<LegalTermPageData['documentType'], string>

export function LegalDocumentPage({ document }: { document: LegalTermPageData }) {
  return (
    <main className="min-h-screen bg-neutral-950 pb-24 text-white page-top-offset">
      <section className="border-b border-white/10">
        <div className="container-sm flex min-h-75 flex-col justify-end pb-12">
          <div className="max-w-3xl">
            <h1 className="type-display-m font-extrabold tracking-normal text-white md:type-display-l">
              {document.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
              {documentDescriptions[document.documentType]}
            </p>
          </div>

          <div className="mt-10">
            <LegalVersionSelect
              label="시행일"
              options={document.versions}
              value={document.selectedVersion}
            />
          </div>
        </div>
      </section>

      <section className="container-sm section-p-t-xs">
          <RichText
            className="legal-richtext text-white/70 prose-headings:text-white prose-h2:mt-10 prose-h2:text-xl prose-p:leading-8 prose-p:text-white/65 prose-a:text-white prose-a:underline prose-a:decoration-white/35 prose-a:underline-offset-4 prose-a:transition-colors hover:prose-a:text-white hover:prose-a:decoration-white"
            data={document.body}
            enableGutter={false}
          />
      </section>
    </main>
  )
}
