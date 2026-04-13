import { assertCenter, getCenterLabel } from '@/lib/centers'

export default async function CenterFacultyPage({
  params,
}: {
  params: Promise<{ center: string }>
}) {
  const { center } = await params
  const centerSlug = assertCenter(center)

  return (
    <main>
      <section className="surface hero">
        <span className="eyebrow">Faculty</span>
        <h1>{getCenterLabel(centerSlug)} 강사진</h1>
        <p>
          <code>faculty</code> 컬렉션과 연결될 자리입니다. P0 적재가 끝나면 레거시
          강사진 데이터 샘플을 먼저 렌더링해 slug, 정렬, 이미지 경로를 검증합니다.
        </p>
      </section>
    </main>
  )
}
