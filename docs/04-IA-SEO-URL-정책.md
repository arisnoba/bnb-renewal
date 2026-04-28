# IA SEO URL 정책

> 목적: 센터별 URL, SEO, canonical, sitemap, redirect 기준을 한 문서로 관리한다.
> 마지막 갱신: 2026-04-28

## 기본 결론

센터별 페이지는 쿼리 파라미터가 아니라 독립 URL로 운영한다.

권장:

```text
/art/news
/exam/curriculums
/kids/casting
```

비권장:

```text
/news?center=art
/programs?center=exam
```

독립 URL을 쓰는 이유는 센터별 검색 의도와 브랜드 키워드를 별도 랜딩 페이지로 인덱싱하기 위해서다.

## 센터 slug

| 센터       | slug       |
| ---------- | ---------- |
| 아트센터   | `art`      |
| 애비뉴센터 | `avenue`   |
| 입시센터   | `exam`     |
| 하이틴센터 | `highteen` |
| 키즈센터   | `kids`     |

## URL 기준

브랜드 공통:

```text
/
/about
/news
/news/[slug]
/artist-press
/artist-press/[slug]
/privacy
/terms
```

센터별:

```text
/[center]
/[center]/about
/[center]/curriculums
/[center]/curriculums/[slug]
/[center]/news
/[center]/news/[slug]
/[center]/results
/[center]/results/[slug]
/[center]/casting
/[center]/casting/[slug]
/[center]/guide
/[center]/faq
```

서브도메인형은 클라이언트 선택 시 가능한 옵션으로만 둔다. 선택하더라도 내부 IA, center slug, 템플릿 구조는 유지하고 canonical/sitemap/redirect 기준만 바꾼다.

## SEO 렌더링 기준

- 검색 노출이 필요한 페이지는 서버에서 본문, 제목, 설명, canonical을 만들 수 있어야 한다.
- 목록/상세 페이지는 신규 CMS 필드 우선, 레거시 필드 fallback으로 렌더링한다.
- SEO 제목은 `meta.title` -> 대표 제목 순서다.
- SEO 설명은 `meta.description` -> excerpt/요약 가능 필드 순서다.
- SEO 이미지는 `meta.image` -> 대표 media -> legacy path 순서다.
- legacy path는 신규 필드가 비어 있을 때만 fallback으로 사용한다.

## Redirect/Sitemap 기준

- 기존 도메인/경로에서 새 URL로의 301 이전은 센터별 slug 기준으로 관리한다.
- sitemap은 실제 공개 URL 기준으로 생성한다.
- canonical은 sitemap과 같은 URL 체계를 사용한다.
- 동일 콘텐츠가 공통/센터 경로에 중복될 경우 대표 URL 하나를 canonical로 지정한다.

## 상세 기록

- SEO URL 상세 전략: [archive/planning/SEO-URL-전략.md](./archive/planning/SEO-URL-전략.md)
- IA 비교안: [archive/planning/IA-대안-비교안-v2.md](./archive/planning/IA-대안-비교안-v2.md)
- 사이트 구조 분석: [archive/planning/IA-사이트구조분석.md](./archive/planning/IA-사이트구조분석.md)
- 전체 메뉴 구조도: [archive/planning/전체-메뉴-구조도.md](./archive/planning/전체-메뉴-구조도.md)
