import { assertCenter, getCenterLabel } from '@/lib/centers'

export default async function CenterLandingPage({
  params,
}: {
  params: Promise<{ center: string }>
}) {
  const { center } = await params
  const centerSlug = assertCenter(center)

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">Center</span>
        <h1>{getCenterLabel(centerSlug)}</h1>
        <p>
          센터별 랜딩 라우트가 정상적으로 생성된 상태입니다. 이후 Payload 컬렉션과
          연결되면 센터 소개, 대표 프로그램, 공지, 상담 CTA를 이 페이지에 배치합니다.
        </p>
      </section>
    </main>
  )
}
