# Payload Admin UX 인터뷰 노트

이 문서는 긴 작성 폼 대신, 에이전트가 짧은 질문으로 사용자의 의도를 좁혀가며 구현 계획을 확정하기 위한 인터뷰 노트다.

## 현재 확정된 우선순위

1. 저장 버튼을 `posts`, `pages` 템플릿처럼 눈에 띄게 개선한다.
2. 관리자 사이드바 필드를 정리한다.
   - 발행일
   - 작성자
   - slug
   - 센터 선택
3. Lexical rich text를 순차 적용한다.
   - 뉴스
   - 출신 아티스트
   - 드라마/광고 출연장면
   - 합격후기

## 현재 후보 컬렉션

| 우선순위 | 컬렉션 | slug | 현재 본문 필드 | 현재 이미지 필드 | 메모 |
| --- | --- | --- | --- | --- | --- |
| 1 | 뉴스 | `news` | `bodyHtml` | `thumbnailPath` | 최우선 적용 대상 |
| 2 | 출신 아티스트 | `artist-press` | `bodyHtml` | `thumbnailPath`, `agencyLogoPath` | SEO 필요 가능성 높음 |
| 3 | 드라마/광고 출연장면 | `screen-appearances` | `bodyHtml` | `profileImagePath`, `thumbnailPath` | 미디어 필드가 2개 |
| 4 | 합격후기 | `exam-passed-reviews` | `bodyHtml` | `studentImagePath`, `schoolLogoPath` | 입시 관리자 권한 조건 있음 |

## 적용 방식 초안

### 공통 관리자 UX

모든 대상 컬렉션에 공통 적용할 가능성이 높은 항목이다.

- `title`은 탭 밖 최상단에 둔다.
- 사이드바는 발행/식별/권한 관련 필드만 둔다.
- 사이드바 후보:
  - `publishedAt`
  - `authorName`
  - `slug`
  - `centers`
- 저장 버튼은 Payload 기본 버튼보다 더 눈에 띄게 보이도록 admin style을 조정한다.
- 기존 레거시 필드는 삭제하지 않고 레거시 영역으로 이동한다.

### Lexical 적용

기본 원칙:

- 기존 `bodyHtml`은 유지한다.
- 신규 Lexical 필드를 추가한다.
- 신규 작성은 Lexical 필드를 사용한다.
- 프론트는 `Lexical 필드 -> bodyHtml` 순서로 fallback한다.

필드명 후보:

- `body`
- `content`
- `richTextBody`

현재 추천:

- `body`

이유:

- 짧고 읽기 쉽다.
- 템플릿 `posts`의 작성 경험과 가깝다.
- 프론트 fallback 코드도 단순해진다.

### Media 적용

기본 원칙:

- 기존 이미지 path 필드는 유지한다.
- 신규 media 관계 필드를 추가한다.
- 프론트는 `media 관계 -> 기존 path` 순서로 fallback한다.

필드명 후보:

| 용도 | 추천 필드명 | fallback |
| --- | --- | --- |
| 대표 썸네일 | `thumbnailMedia` | `thumbnailPath` |
| 출연자/학생 이미지 | `profileMedia` 또는 `studentMedia` | `profileImagePath`, `studentImagePath` |
| 소속사 로고 | `agencyLogoMedia` | `agencyLogoPath` |
| 학교 로고 | 기존 `school` 관계 우선 | `schoolLogoPath` |

### SEO 적용

적용 후보:

- 뉴스
- 출신 아티스트
- 합격후기
- 필요하면 드라마/광고 출연장면

기본 필드:

- `meta.title`
- `meta.description`
- `meta.image`

보류:

- `noindex`
- `canonicalUrl`

현재 추천:

- 처음에는 `noindex`, `canonicalUrl`을 넣지 않는다.
- 중복 URL이나 외부 원문 링크 정책이 정해진 뒤 추가한다.

### Versions / Draft

현재 의견:

- 이력은 유용하다.
- 모든 컬렉션에 무제한 적용하지 않는다.

현재 추천:

- 1차는 `versions: { maxPerDoc: 15 }`만 적용한다.
- draft는 바로 켜지 않는다.

이유:

- 변경 이력은 남길 수 있다.
- draft 워크플로우, preview, 발행 승인 절차를 당장 설계하지 않아도 된다.
- DB row 증가를 제한할 수 있다.

### Slug

현재 요구:

- SEO 콘텐츠에는 slug가 필요하다.
- 숫자만 있는 slug는 선호하지 않는다.
- 제목 입력 시 자동 생성되면 좋다.
- 수동 수정 가능해야 한다.

현재 추천:

- 한글 제목은 그대로 slug로 쓰지 않는다.
- 제목에서 영문/숫자가 있으면 최대한 살린다.
- 한글만 있으면 컬렉션 prefix + 날짜 + 짧은 suffix로 생성한다.
- 예: `news-20260428-a1b2`
- 관리자가 오른쪽 사이드바에서 수정 가능하게 둔다.

## 인터뷰 질문 목록

아래 질문을 사용자가 먼저 채울 필요는 없다. 에이전트가 한 번에 하나씩 묻고, 답변을 바탕으로 계획과 TODO를 갱신한다.

### 질문 1. News 1차 적용 범위

`news`를 최우선 대상으로 두고, 1차 적용 범위를 어디까지 할지 결정한다.

추천:

- `news`에 저장 버튼, 사이드바, Lexical, media, SEO, slug, versions를 먼저 적용한다.

이유:

- 저장 버튼, 사이드바, Lexical, media, SEO, slug, versions가 모두 들어가는 대표 사례다.
- migration과 프론트 fallback 위험을 작게 볼 수 있다.
- 패턴이 확정되면 나머지 컬렉션에 복제하기 쉽다.

### 질문 2. 저장 버튼 범위

저장 버튼 개선을 Payload 관리자 전체에 적용할지, 콘텐츠 작성 화면에만 적용할지 결정한다.

추천:

- 관리자 전체에 적용하되, Payload 기본 동작은 건드리지 않고 CSS로 시각 강조만 한다.

### 질문 3. 사이드바 필드 순서

사이드바 필드 순서를 확정한다.

추천 순서:

1. 센터 선택
2. 발행일
3. 작성자
4. slug

대안:

1. slug
2. 센터 선택
3. 발행일
4. 작성자

### 질문 4. Lexical 필드명

신규 rich text 필드명을 정한다.

추천:

- `body`

### 질문 5. 기존 `bodyHtml` 위치

기존 `bodyHtml`을 어디에 둘지 정한다.

추천:

- 레거시 탭 또는 접힘 영역으로 이동한다.

### 질문 6. Draft 적용 여부

이력만 필요한지, draft까지 필요한지 정한다.

추천:

- 1차는 versions만 적용한다.
- draft는 나중에 검토한다.

### 질문 7. Slug 생성 규칙

숫자만 피하면서 한글 제목을 어떻게 처리할지 정한다.

추천:

- 컬렉션 prefix + 날짜 + 짧은 suffix를 기본값으로 사용한다.
- 예: `news-20260428-a1b2`

### 질문 8. SEO 범위

SEO 탭을 어떤 컬렉션에 넣을지 정한다.

현재 후보:

- `news`
- `artist-press`
- `exam-passed-reviews`
- `screen-appearances`는 필요 여부 확인

## 인터뷰 진행 기록

### 2026-04-28

사용자 우선순위:

- 저장 버튼을 더 눈에 띄게 변경
- 사이드바 필드 정리: 발행일, 작성자, slug, 센터 선택
- Lexical 적용: 뉴스, 출신 아티스트, 드라마/광고 출연장면, 합격후기

현재 다음 질문:

- `news` 1차 적용 범위를 전체 패턴 검증으로 볼지, 저장 버튼/사이드바/Lexical까지만 볼지 결정
