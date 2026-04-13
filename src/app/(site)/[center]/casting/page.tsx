import { assertCenter, getCenterLabel } from '@/lib/centers'

export default async function CenterCastingPage({
  params,
}: {
  params: Promise<{ center: string }>
}) {
  const { center } = await params
  const centerSlug = assertCenter(center)

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">Casting</span>
        <h1>{getCenterLabel(centerSlug)} 캐스팅</h1>
        <p>
          현재는 P1 이전 공개 라우트 스캐폴딩만 제공합니다. P0 이후 캐스팅 컬렉션 모델과
          연결하는 단계로 확장할 예정입니다.
        </p>
      </section>
    </main>
  )
}
