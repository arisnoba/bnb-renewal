import { assertCenter, getCenterLabel } from '@/lib/centers'

export default async function CenterContactPage({
  params,
}: {
  params: Promise<{ center: string }>
}) {
  const { center } = await params
  const centerSlug = assertCenter(center)

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">Contact</span>
        <h1>{getCenterLabel(centerSlug)} 상담</h1>
        <p>
          상담 데이터는 개인정보가 포함되어 있어 P2로 남겨두고, 지금은 라우트와 운영 흐름만
          먼저 준비합니다.
        </p>
      </section>
    </main>
  )
}
