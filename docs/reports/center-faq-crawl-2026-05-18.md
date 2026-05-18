# 센터별 FAQ 크롤링 정리

- 작성일: 2026-05-18
- 목적: 추후 Payload DB FAQ 컬렉션 적재를 위한 원문 기반 초안
- 수집 방식: 각 레거시 FAQ 페이지의 `#ctt div.use_q/use_q02` 질문 블록과 다음 `span.submenu .use_answer02` 답변 블록을 추출
- 추가 가공: 각 센터 `스타카드 멤버쉽서비스` 안내 페이지는 공통 FAQ 형식에 맞게 질문/답변으로 재구성
- 센터 slug 기준: `art`, `exam`, `highteen`, `kids`
- 주의: 맞춤법, 띄어쓰기, 원문 문장 오류는 임의 교정하지 않았다. DB 적재 전 운영 문구 검수가 필요하다.
- 질문 통합 기준: 원문 질문은 `sourceQuestion`으로 보존하고, DB 노출/필터용 질문은 `canonicalQuestion`으로 통합했다. 아이/학생처럼 주어만 다른 유사 질문은 `학생` 기준으로 정규화했다.

## DB 적재 권장 구조

| 필드 | 값/용도 |
|---|---|
| `canonicalQuestion` | DB 노출/검색/그룹핑에 사용할 표준 질문 문구 |
| `sourceQuestion` | 레거시 원문 질문 문구 |
| `answer` | FAQ 답변 본문. 표는 rich text table 또는 별도 구조로 변환 필요 |
| `centers` | 복수 센터 필터용 slug 배열. 예: `["art", "kids"]` |
| `sourceCenter` | 원문을 가져온 센터 |
| `sourceUrl` | 레거시 원문 URL. 여러 센터를 통합 가공한 항목은 `sourceUrls`로 원문 URL 목록을 보존 |
| `sourceOrder` | 레거시 페이지 내 노출 순서 |
| `sourceType` | `legacyFaq` 또는 `craftedFromPage` |
| `tags` | FAQ 분류 태그. 스타카드 안내 가공 항목은 `스타카드` |
| `status` | 초안 적재 시 `draft`, 검수 후 `published` 권장 |

### 공통 질문 적재 기준

- 질문 문구는 `canonicalQuestion`으로 통합한다.
- 답변까지 모두 같은 항목은 `centers`에 여러 센터를 넣은 단일 FAQ로 적재할 수 있다.
- 질문은 같지만 답변, 수치, 링크, 대상 연령이 다른 항목은 같은 `canonicalQuestion` 아래 센터별 답변 variant로 관리하는 것을 권장한다. 현재 FAQ 컬렉션이 variant를 지원하지 않는다면 같은 `canonicalQuestion`을 가진 센터별 레코드로 나누고 `centers`를 1개씩 둔다.

## 수집 요약

| 자료 | slug | URL | FAQ 수 |
|---|---|---|---|
| 아트센터 | `art` | https://baewoo.co.kr/web/bbs/content.php?co_id=faq | 17 |
| 입시센터 | `exam` | https://baewoo.kr/web/bbs/content.php?co_id=faq | 12 |
| 하이틴센터 | `highteen` | https://baewoo.me/web/bbs/content.php?co_id=faq | 13 |
| 키즈센터 | `kids` | https://baewoo.net/web/bbs/content.php?co_id=faq | 16 |
| 스타카드 멤버쉽서비스 | `art`, `exam`, `highteen`, `kids` | https://baewoo.co.kr/web/bbs/content.php?co_id=starcard<br>https://baewoo.kr/web/bbs/content.php?co_id=starcard<br>https://baewoo.me/web/bbs/content.php?co_id=starcard<br>https://baewoo.net/web/bbs/content.php?co_id=starcard | 5 |
| 합계 |  |  | 63 |

## 통합 질문 인덱스

유사 질문은 `canonicalQuestion` 기준으로 묶었다. 답변은 센터별 운영 정책과 수치가 달라질 수 있으므로, 아래 상세 항목에서 센터별 답변을 다시 검수해야 한다.

| 표준 질문 | centers | 원문 질문 수 | 답변 상태 | 권장 적재 방식 |
|---|---|---|---|---|
| 연기를 처음 배우는 학생도 많이 있나요? | `art`, `exam`, `highteen`, `kids` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 입학 전에 테스트를 받나요? | `art`, `exam`, `highteen`, `kids` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 연기를 처음 시작하는 학생도 경험이 있는 학생과 함께 수강하나요? | `art`, `highteen`, `kids` | 3 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 처음 입학해서 드라마나 영화에 출연하려면 평균 얼마나 걸리나요? | `art`, `highteen`, `kids` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 청강이 가능한가요? | `art`, `exam`, `highteen`, `kids` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 수강료는 어떻게 되나요? | `art`, `exam`, `highteen`, `kids` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 기본 수업료 외에 추가 비용이 있나요? | `art`, `kids` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 수강료 할인을 받을 수 있는 방법이 있나요? | `art`, `exam`, `kids` | 2 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 수업 이수 과정 중 다른 반, 요일, 시간대로 이동할 수 있나요? | `art`, `highteen`, `kids` | 2 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 반배정 또는 승급 심사 기준이 어떻게 되나요? | `art`, `highteen`, `kids` | 2 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 연기 전공자 학생도 많이 다니나요? | `art`, `highteen` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 엔터테인먼트 위탁배우들이 얼마나 되나요? | `art`, `highteen`, `kids` | 1 | 답변 동일 | 표준 질문 단일화 + `centers` 복수값 단일 답변 가능 |
| 프로필은 꼭 찍어야 하나요? | `art`, `highteen`, `kids` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 몇 세부터 수강할 수 있나요? | `highteen`, `kids` | 2 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |
| 어떤 선생님이 교육을 진행하나요? | `highteen`, `kids` | 1 | 답변 상이 또는 센터별 수치 포함 | 표준 질문 단일화 + 답변은 센터별 variant 권장 |

## 검수 메모

- 하이틴센터 sourceOrder 11은 원문 질문이 `저는 연기 전공자입니다. 전공자들이 많이 다니나요?`이지만 답변은 학원 내부/방송국 오디션 운영 설명이다. DB 적재 전 원문 유지 또는 질문 교체 여부를 검수해야 한다.
- 입시센터 `수강료는 어떻게 되나요?`는 원문 답변에 실제 금액 표가 노출되지 않고 입학안내 참조 문장만 있다.
- 입시센터 `수강료할인을 받을 수 있는 방법이 있나요?`는 질문은 할인 방법이지만 답변 첫 문장은 추가 비용 없음에 가깝다. 장학제도 링크가 함께 있으므로 원문 검수 대상이다.
- 키즈센터 수강료 표는 원문 HTML의 row/colspan 구조가 단순 텍스트 추출 과정에서 완전한 표 구조로 보존되지 않을 수 있다. DB 적재 시 원문 페이지 또는 이미지 기준으로 표를 다시 확인해야 한다.

## DB 적재 후보 상세

### FAQ-01. 연기를 처음 배우는 학생도 많이 있나요?

- canonicalQuestion: 연기를 처음 배우는 학생도 많이 있나요?
- centers: `art`, `exam`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 1
- sourceQuestion: 연기를 처음 배우는 사람들도 많이 있나요?

연기를 처음 배우시는 분들의 많은 오해 중 하나가 자신을 제외한 다른 사람들은 모두 연기를 전공했거나 연기를 잘 할 것 같다는 생각입니다.

하지만 실제 배우앤배움의 입학데이터를 살펴보면 연기를 처음 배우시는 분들이 전공자나 매니지먼트 위탁 교육생보다 많고, 전체 학생의 40%이상이 연기와 전혀 무관한 전공, 직장 , 삶을 살아온 분들입니다.

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 1
- sourceQuestion: 연기를 처음 배우는 사람들도 많이 있나요?

연기를 처음 배우시는 분들의 많은 오해 중 하나가 ‘지금 시작하기에 늦지 않았을까? 나만 처음 시작하는 사람이 아닐까?’라는 생각입니다.

하지만 실제 저희 배우앤배움 입학데이터를 살펴보면 연기를 처음 배우시는 분들의 비중이 40% 정도를 차지합니다. 이미 진로를 선택하여 대학생활을 하던 중에 진로변경을 위하여 연기를 시작하는 경우도 있고, 고등학교3학년이 되고나서 자신의 진로를 연기로 선택하고 시작하는 경우가 많기 때문에 언제 시작했느냐가 중요한 것이 아니라 어디에서 어떻게 시작했는가가 중요하다고 생각합니다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 1
- sourceQuestion: 연기를 처음 배우는 사람들도 많이 있나요?

모든 일의 시작은 처음에서 출발합니다.

연기를 처음 배우시는 분들의 많은 오해 중 하나가 자신을 제외한 다른 학생들은 모두 연기 활동을 하거나 연기를 배운지 오래된 학생들이라고 생각 하기 쉽습니다.

실제 배우앤배움 하이틴센터 입학 데이터를 살펴보면 연기를 처음 배우는 학생들이 전체 수강생의 70%를 차지합니다.

또한 현재 다양한 활동을 하고 있는 학생들의 경우도 처음이라는 단계를 거쳐서 하이틴배우로서 활동을 하고 있습니다.

그래서 언제 시작했느냐가 중요한 것이 아니라 어디에서 처음을 시작 했는가가 중요하다고 생각합니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 1
- sourceQuestion: 연기를 처음 배우는 사람들도 많이 있나요?

모든 일의 시작은 처음에서 출발합니다.

실제 배우앤배움 키즈센터의 입학 데이터를 살펴보면 연기를 처음 배우는 아이들이 전체 수강생의 60%로 활동중인 경력자들보다 많으며, 현재 다양한 활동을 하고 있는경력자들도 처음이라는 단계를 거쳐 아역배우로서 활동을 진행하고 있습니다.

시작이 망설여 지시는 분들은 언제든 상담문의를 남기시면 친절한 안내 도와드리겠습니다 .
온라인 상담신청 바로가기 (/web/bbs/write.php?bo_table=new_counsel)

### FAQ-02. 입학 전에 테스트를 받나요?

- canonicalQuestion: 입학 전에 테스트를 받나요?
- centers: `art`, `exam`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 3
- sourceQuestion: 학원에 입학하기 전에 테스트를 받나요?

고급 U반 이상을 희망하시는 분들은 방문 상담 당일, 학원 측에서 준비된 방송 대본이나 개인적으로 준비된 독백을 통해 간단히 연기 테스트를 보고 있으며 초급 I반/중급 R반을 희망 학생들은 따로 테스트를 보지 않습니다.

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 5
- sourceQuestion: 학원에 입학하기 전에 테스트를 받나요?

테스트를 원하는 학생 또는 원활한 상담을 통해 필요시에 테스트를 진행 할수 있습니다.

테스트에 부담을 가지실 필요는 없습니다.

본인이 지금 어느정도의 실력을 갖추고 있는지 판단하고, 그에 맞는 반으로 반배졍을 할 수도있고, 어떤점을 또 보완하고 발전해야하는지 알려줄수 있는 목적이기 때문입니다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 3
- sourceQuestion: 학원에 입학하기 전에 테스트를 받나요?

입학 전 간단한 카메라 테스트가 진행됩니다.

이는 원할한 반배정을 위한 테스트이며, 연기를 배워본 적이 있거나 활동 경력이 있는 학생들은 준비 되어있는 독백을 통해 진행하며,

연기가 처음인 학생들은 자기소개 정도의 카메라 테스트를 진행합니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 3
- sourceQuestion: 학원에 입학하기 전에 테스트를 받나요?

입학 전 간단한 카메라 테스트가 진행됩니다.

이는 원할한 반배정을 위한 테스트이며, 연기를 배워본 적이 있거나 활동 경력이 있는 아이들을 대상으로 준비된 대본을 통해 진행하며, 연기가 처음인 아이들은 따로 테스트를 보지 않습니다.

### FAQ-03. 연기를 처음 시작하는 학생도 경험이 있는 학생과 함께 수강하나요?

- canonicalQuestion: 연기를 처음 시작하는 학생도 경험이 있는 학생과 함께 수강하나요?
- centers: `art`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 4
- sourceQuestion: 연기를 배워 본 적이 없는데 연기 전공자들하고 같이 수강하나요?

연기를 처음 배우시는 분들은 초급 I Class에서 수업을 받습니다. 초급자 Class는 기초 연기수업을 원하는 분들로 구성되어 있습니다. 자세한 내용은 홈페이지 교육폴더 중 등급제 교육관리시스템에 들어가시면 확인하실 수 있습니다.
등급제 교육관리시스템 바로가기 (/web/bbs/content.php?co_id=grade01)

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 4
- sourceQuestion: 연기를 처음시작하는 경우 활동하는 학생들과 같이 교육을 하게 되나요?

연기를 처음 배우시는 분들은 I Class에서 수업을 받습니다.

그룹 구성은 나이/교육/활동 경력을 반영하여 구성됩니다.

자세한 내용은 홈페이지 교육폴더 중 등급제 교육관리시스템에 들어가시면 확인하실 수 있습니다.
등급제 교육관리시스템 바로가기 (/web/bbs/content.php?co_id=grade01)

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 4
- sourceQuestion: 연기를 처음시작하는 경우 활동하는 아이들과 같이 교육을 하게되나요?

연기를 처음 배우는 아이들은 영재교육(초급) Class에서 수업을 받습니다. 초급자 Class는 기초 연기수업을 원하는 분들로 구성되어 있으며, 그룹 구성은 나이/교육/활동 경력을 반영하여 구성됩니다. 자세한 내용은 홈페이지 교육폴더 중 등급제 교육관리시스템에 들어가시면 확인하실 수 있습니다.
등급제 교육관리시스템 바로가기 (/web/bbs/content.php?co_id=grade01)

### FAQ-04. 처음 입학해서 드라마나 영화에 출연하려면 평균 얼마나 걸리나요?

- canonicalQuestion: 처음 입학해서 드라마나 영화에 출연하려면 평균 얼마나 걸리나요?
- centers: `art`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 5
- sourceQuestion: 처음 입학해서 드라마, 영화에 출연하려면 평균 얼마나 걸리나요?

각 등급별로 소요된 평균 개월을 산정한 결과로는 초급 I Class 첫 입학부터 작품 출연을 하기까지의 기간을 10개월에서~18개월정도로 보고 있습니다.

다만 수강생마다 성장 속도가 다르고 캐스팅 결과에는 연기력과 이미지 이외에도 작품 진행에 따른 변수가 많기 때문에 출연하기까지의 평균 소요기간이 갖는 의미가 절대적이지는 않습니다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 5
- sourceQuestion: 처음 입학해서 드라마, 영화에 출연하려면 평균 얼마나 걸리나요?

각 등급별로 소요된 평균 개월을 산정한 결과로는 I-Class 첫 입학부터 작품 출연을 하기까지의 기간을 10개월에서~18개월 정도로 보고 있습니다.

다만 수강생마다 성장 속도가 다르고 캐스팅 결과에는 연기력과 이미지 이외에도 작품 진행에 따른 변수가 많기 때문에

출연하기까지의 평균 소요기간이 갖는 의미가 절대적이지는 않습니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 11
- sourceQuestion: 처음 입학해서 드라마, 영화에 출연하려면 평균 얼마나 걸리나요?

이미 활동중인 아역배우가 아닌, 처음연기를 시작하여 초급반 부터 작품 출연을 하기 까지의 기간은 3개월에서 12개월 정도로 보고있습니다.

다만 아이들마다 성장 속도가 다르고 캐스팅 결과에는 연기력과 이미지 외에도 작품 진행에 따른 변수가 발생하기 때문에 출연하기 까지의 평균소요 기간이 갖는 의미가 절대적이지는 않습니다.

### FAQ-05. 청강이 가능한가요?

- canonicalQuestion: 청강이 가능한가요?
- centers: `art`, `exam`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 6
- sourceQuestion: 청강이 가능한가요?

‘청강으로 인해 본 원의 학생들이 수업 진행에 불편함을 느낀다’라는 다수의 설문조사 결과로 인해 아쉽게도 청강은 불가합니다. 배우앤배움은 본 원 학생들의 온전한 수업 환경을 조성하는 것이 더 가치 있는 일이라 생각합니다.

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 7
- sourceQuestion: 청강이 가능한가요?

‘청강으로 인해 본원의 학생들이 수업 진행에 불편함을 느낀다.’라는 다수의 설문조사 결과로 인해 아쉽게도 청강은 불가합니다. 저희 배우앤배움은 온전한 수업 환경을 조성하는 것이 본원의 학생들에게 더 가치 있는 일이라 생각합니다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 6
- sourceQuestion: 청강이 가능한가요?

‘청강으로 인해 본 원의 학생들이 수업 진행에 불편함을 느낀다’라는 다수의 설문조사 결과로 인해 아쉽게도 청강은 불가합니다.

배우앤배움 하이틴센터는 본 원의 학생들의 온전한 수업 환경을 조성하는 것이 더 가치 있는 일이라 생각합니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 5
- sourceQuestion: 청강이 가능한가요?

'청강으로 인해 본 원의 아이들이 수업 진행에 불편함을 느낀다’라는 다수의 의견으로 아쉽게도 청강은 불가합니다. 배우앤배움키즈센터는 본 원의 아이들의 온전한 수업 환경을 조성하는 것이 더 가치 있는 일이라 생각합니다.

### FAQ-06. 수강료는 어떻게 되나요?

- canonicalQuestion: 수강료는 어떻게 되나요?
- centers: `art`, `exam`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 7
- sourceQuestion: 수강료는 어떻게 되나요?

회 차 구성에 따라 금액에 차이가 있고 다음과 같습니다. 자세한 내용은 홈페이지 운영폴더 중 입학안내에 들어가시면 확인하실 수 있습니다.

입학안내 바로가기 (/web/bbs/content.php?co_id=enterance)

성인

| 수강기간 | 시간대별 | 월목 / 화금(주 2회) | 월/화/수/목/금/토/일(주 1회) |
| --- | --- | --- | --- |
| 1년미만 | 오전 | 522,500원 | 361,000원 |
| 오후 | 550,000원 | 380,000원 | |
| 1년이상 (장학할인적용) | 오전 | 522,500원 | 361,000원 |
| 오후 | 522,000원 | 361,000원 | |
| 2년이상 (장학할인적용) | 오전 | 495,000원 | 342,000원 |
| 오후 | 495,000원 | 342,000원 | |

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 2
- sourceQuestion: 수강료는 어떻게 되나요?

반구성에 따라 금액에 차이가 있고 다음과 같습니다. 자세한 내용은 홈페이지 운영카테고리 중 입학안내에 들어가시면 확인하실 수 있습니다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 8
- sourceQuestion: 수강료는 어떻게 되나요?

회 차 구성에 따라 금액에 차이가 있고 다음과 같습니다. 자세한 내용은 홈페이지 운영폴더 중 입학안내에 들어가시면 확인하실 수 있습니다.

입학안내 바로가기 (/web/bbs/content.php?co_id=enterance)

청소년

| 시간대별 | 월목(주2회) | 화금(주2회) | 토(주1회) | 일(주1회) |
| --- | --- | --- | --- | --- |
| 오전 | - | - | 350,000원 | 350,000원 |
| 오후 | 450,000원 | 450,000원 | 350,000원 | 350,000원 |

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 7
- sourceQuestion: 수강료는 어떻게 되나요?

배우앤배움 키즈센터의 수강료는 다음과 같습니다. 자세한 내용은 홈페이지 운영폴더 중 입학안내에 들어가시면 확인하실 수 있습니다.

| Class | 수업 요일 | 반편성 | 수업시간 (학부모 피드백 포함) | 수강료 | 수료생 (18개월) | 수료생 (30개월) |
| --- | --- | --- | --- | --- | --- | --- |
| 그룹 레슨 | 화~일 (주1회) | 2-4명 | 2시간 | 40만원 | 38만원 | 36만원 |
| 4-6명 | 2시간 30분 | | | | | |
| 개인 레슨 | 개인 | 1시간 30분 | 60만원 | 57만원 | 54만원 | |

입학안내 바로가기 (/web/bbs/content.php?co_id=enterance)

### FAQ-07. 기본 수업료 외에 추가 비용이 있나요?

- canonicalQuestion: 기본 수업료 외에 추가 비용이 있나요?
- centers: `art`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 8
- sourceQuestion: 기본 수업료 외에 학원 수업에 드는 추가 비용은 없나요?

없습니다. 배우앤배움은 수업료 외의 일체의 초기등록비 등의 금액을 받지 않습니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 8
- sourceQuestion: 기본 수업료 외에 학원 수업에 드는 추가 비용은 없나요?

없습니다. 배우앤배움 키즈센터는 수업료 외의 초기 등록비 및 소속비 등 일체의 금액을 받지 않습니다.

### FAQ-08. 수강료 할인을 받을 수 있는 방법이 있나요?

- canonicalQuestion: 수강료 할인을 받을 수 있는 방법이 있나요?
- centers: `art`, `exam`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 9
- sourceQuestion: 수강료 할인을 받을 수 있는 방법이 있나요?

| Class | 적용대상 | 장학할인 | 중복할인 |
| --- | --- | --- | --- |
| 성인반 | 오전 10:00 Class 수강생 | 해당 Class 5% 장학할인 | 불가 |
| 1년 이상 재학한 수강생 | 전 Class 5% 장학할인 | 불가 | |
| 2년 이상 재학한 수강생 | 전 Class 10% 장학할인 | 불가 | |

※ 수업은 모든 클래스가 동일한 밀도로 진행됩니다. 배우앤배움은 배우로 전업한 수강생들이 많습니다. 이에 수강생들의 경제적 부분을 배려하여 오전 10시 클래스와 1년 이상 수강생들에게 장학혜택이 적용되고 있습니다. 또한, 추가수업을 원하는 경우에는 추가수업분에 한하여 40% 할인된 가격으로 중복 수강이 가능하도록 하였습니다. (2020년 1월 시행)

수강료 안내 바로가기 (https://baewoo.co.kr/web/bbs/content.php?co_id=enter01)

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 4
- sourceQuestion: 수강료할인을 받을 수 있는 방법이 있나요?

없습니다. 배우앤배움은 수업료 외의 일체의 초기등록비 등의 금액을 받지 않습니다.
장학제도 바로가기 (/web/bbs/content.php?co_id=Scholarship)

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 9
- sourceQuestion: 수강료 할인을 받을 수 있는 방법이 있나요?

| 항목 | 적용대상 | 중복할인 |
| --- | --- | --- |
| 수료생 | 18 ~ 30개월 결제 시 장학적용 | 부분가능 |
| 가족등록 | 자녀가 함께 등록 시 1인기준 매월 장학적용 | |

※ 기본 수강료 결제는 3개월 결제로 진행되며, 수료한 아역배우를 대상으로 추가 장학지원이 적용되오니 더 자세한 내용은 홈페이지 운영폴더 중 수강료 장학시스템 상세보기 탭을 클릭하시면 확인하실 수 있습니다.

### FAQ-09. 수업 이수 과정 중 다른 반, 요일, 시간대로 이동할 수 있나요?

- canonicalQuestion: 수업 이수 과정 중 다른 반, 요일, 시간대로 이동할 수 있나요?
- centers: `art`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 10
- sourceQuestion: 수업 이수 과정 중에 다른 반, 다른 요일이나 시간대로 이동 가능 한가요?

결론적으로는 가능합니다. 하지만 이동하는 시점에 희망하는 Class의 인원이 정원 8명 미만이어야 하며, 이동 시 커리큘럼 이수에 문제가 없는지 교육팀 담당자와 함께 의견을 조율하는 과정이 있을 수 있습니다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 7
- sourceQuestion: 수업 이수 과정 중에 다른 반,다른 요일이나 시간대로 이동 가능 한가요?

결론적으로는 가능합니다. 하지만 이동하는 시점에 희망하는 Class의 인원이 정원 8명 미만이어야 하며,

이동 시 커리큘럼 이수에 문제가 없는지 교육팀 담당자와 함께 의견을 조율하는 과정이 있을 수 있습니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 6
- sourceQuestion: 수업 이수 과정 중에 다른 반, 다른 요일이나 시간대로 이동 가능 한가요?

결론적으로는 가능합니다. 하지만 이동하는 시점에 희망하는 Class의 인원이 정원 6명 미만이어야 하며, 이동 시 커리큘럼 이수에 문제가 없는지 교육팀 담당자와 함께 의견을 조율하는 과정이 있을 수 있습니다.

### FAQ-10. 반배정 또는 승급 심사 기준이 어떻게 되나요?

- canonicalQuestion: 반배정 또는 승급 심사 기준이 어떻게 되나요?
- centers: `art`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 12
- sourceQuestion: 승급 심사 기준이 어떻게 되나요?

배우앤배움에서는 2년 전부터 기존 단일 오디션 형태의 승급 평가 방식에서 탈피하여 2달 과정의 커리큘럼에 대한 전반적인 이수 평가를 도입하였습니다. 커리큘럼이 끝나는 짝수 달 마지막 주에는 각 Class의 선생님들이 수강생 평가서를 교육팀에 제출하게 되며, 이를 통해 학생들의 승급 여부와 함께 개인의 연기 성장에 대한 정확한 피드백을 전달해 드립니다.

또한, BnB 멤버쉽 오디션의 결과를 통해 수강생들의 Class 승급이 결정됩니다. 자세한 내용은 홈페이지 매니지먼트 폴더 중 BnB 멤버쉽오디션란의 내용을 참조하시기 바랍니다.
BnB 멤버쉽오디션 바로가기

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 13
- sourceQuestion: 반배정 및 승급 심사 기준이 어떻게 되나요?

연기를 처음 배우는 아이들은 I Class 에 배정되어 수업을 진행합니다. Class 편성 기준은 연기교육 경력과 촬연현장 경험, 그리고 분기별 오디션 및 테스트에서 전반적인 평가를 통해 이루어지며 담당 선생님과 캐스팅 디렉터의 실시간 피드백이 종합평가 되어 편성됩니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 16
- sourceQuestion: 반배정 및 승급 심사 기준이 어떻게 되나요?

연기를 처음 배우는 아이들은 영재 교육과정의 초급 Class 에 배정되어 수업을 진행합니다.

Class 편성 기준은 연기교육 경력과 촬연현장 경험, 그리고 오디션 및 테스트에서 전반적인 평가를 통해 이루어지며 담당 선생님과 캐스팅디렉터의 실시간 피드백이 종합평가 되어 편성됩니다.

### FAQ-11. 연기 전공자 학생도 많이 다니나요?

- canonicalQuestion: 연기 전공자 학생도 많이 다니나요?
- centers: `art`, `highteen`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 13
- sourceQuestion: 저는 연기 전공자입니다. 전공자들이 많이 다니나요?

배우앤배움의 특징 중 하나가 전공자들이 많다는 것입니다. 전체 교육생의 30%정도이며 학교에서 경험한 ‘교육’만이 아닌 배우앤배움의 ‘교육+진로’에 대한 포괄적인 교육과 매니지먼트를 경험하시게 될 것입니다. 또한 배우앤배움에서는 데뷔 후 활동 중에도 개인연습실에서 대본을 보거나 시놉시스를 읽는 연기자들을 쉽게 보실 수 있습니다.

배우앤배움은 연간 이루어지는 국내 모든 드라마, 영화 오디션의 일정 및 내용을 파악하고 있으며, 오디션에서 어떤 경쟁력이 필요한지에 관해 집중적으로 교육하고 있습니다. 연기의 원리는 변하지 않지만, 패션은 지금 이 시간에도 트렌드를 쫓아 변하고 있습니다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 11
- sourceQuestion: 저는 연기 전공자입니다. 전공자들이 많이 다니나요?

배우앤배움 하이틴센터는 연간 15~20편의 드라마 전체 배역 캐스팅을 진행하고 있습니다.

때문에 학원 내부 혹은 방송국 오디션을 주기적으로 진행하고 있습니다.

그 외에 수강생의 연기 컨디션을 체크하기 위해 캐스팅 디렉터가 참여하는 레벨 테스트 및 수강생들을 대상으로

주기적으로 특강을 진행하는 등 다양한 연간 행사가 진행되고 있습니다.

### FAQ-12. 엔터테인먼트 위탁배우들이 얼마나 되나요?

- canonicalQuestion: 엔터테인먼트 위탁배우들이 얼마나 되나요?
- centers: `art`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 복수 centers 단일 레코드 가능

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 14
- sourceQuestion: 엔터테인먼트 위탁배우들이 얼마나 되나요?

배우앤배움은 전체 엔터테인먼트 위탁교육 시장의 70%이상을 점유하고 있습니다. 자세한 내용은 교육폴더 중 엔터테인먼트 위탁교육에 들어가시면 확인하실 수 있습니다.
엔터테인먼트 위탁교육 바로가기 (/web/html/manage_list.php?mid=entertain)

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 12
- sourceQuestion: 엔터테인먼트 위탁배우들이 얼마나 되나요?

배우앤배움은 전체 엔터테인먼트 위탁교육 시장의 70%이상을 점유하고 있습니다. 자세한 내용은 교육폴더 중 엔터테인먼트 위탁교육에 들어가시면 확인하실 수 있습니다.
엔터테인먼트 위탁교육 바로가기 (/web/html/manage_list.php?mid=entertain)

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 14
- sourceQuestion: 엔터테인먼트 위탁배우들이 얼마나 되나요?

배우앤배움은 전체 엔터테인먼트 위탁교육 시장의 70%이상을 점유하고 있습니다. 자세한 내용은 교육폴더 중 엔터테인먼트 위탁교육에 들어가시면 확인하실 수 있습니다.
엔터테인먼트 위탁교육 바로가기 (/web/html/manage_list.php?mid=entertain)

### FAQ-13. 프로필은 꼭 찍어야 하나요?

- canonicalQuestion: 프로필은 꼭 찍어야 하나요?
- centers: `art`, `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 17
- sourceQuestion: 프로필은 꼭 찍어야 하나요?

프로필은 오디션을 볼 때 연기 독백과 함께 꼭 필요한 준비 자료입니다. 프로필은 자신이 갖고 있는 연기적 캐릭터를 구체화 시킨 이미지 컷들과 필모그래피를 포함한 포트폴리오로서 일반적으로 서류상의 1차 오디션이나 현장 오디션에서 기본적으로 사용되어지기 때문에 필수적으로 준비해야 할 사항입니다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 9
- sourceQuestion: 프로필은 꼭 찍어야 하나요?

프로필은 오디션을 볼 때 연기 독백과 함께 꼭 필요한 준비 자료입니다.

프로필은 자신이 갖고 있는 연기적 캐릭터를 구체화 시킨 이미지 컷들과 필모그래피를 포함한 포토폴리오로서

오디션을 포함한 모든 캐스팅을 진행할때 꼭 필요한 '배우들의 이력서'이기 때문에 필수적으로 준비해야 할 사항입니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 10
- sourceQuestion: 프로필은 꼭 찍어야 하나요?

프로필은 오디션을 볼 때 연기 독백과 함께 꼭 필요한 준비 자료입니다.

프로필은 자신이 갖고 있는 연기적 캐릭터를 구체화 시킨 이미지 컷들과 필모그래피를 포함한 포토폴리오 로서 오디션을 포함한 모든 캐스팅을 진행할때 꼭 필요한 '배우들의 이력서'이기 때문에 필수적으로 준비해야 할 사항입니다.

### FAQ-14. 몇 세부터 수강할 수 있나요?

- canonicalQuestion: 몇 세부터 수강할 수 있나요?
- centers: `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 2
- sourceQuestion: 몇세부터 수강이 가능하나요?

배우앤배움 하이틴센터에서 수강 가능한 연령대는 14세부터 19세까지입니다.

성인이 된 이후에는 아트센터 담당자와 상담을 통해 성인 연기반 수업을 진행하게 됩니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 2
- sourceQuestion: 몇세부터 수강이 가능한가요?

배우앤배움 키즈센터에서 수강 가능한 아역배우 연령대는 6세부터 14세까지입니다.

14세 이후에는 청소년 연기 수업 과정을 진행하게 되며, 이동시에는 교육팀 담당자와 상담을 통해 에서 청소년 연기반 수업을 진행하게 됩니다.

### FAQ-15. 어떤 선생님이 교육을 진행하나요?

- canonicalQuestion: 어떤 선생님이 교육을 진행하나요?
- centers: `highteen`, `kids`
- 공통 여부: 통합 질문
- 권장 적재: 표준 질문 통합 + 센터별 답변 variant 권장
- 적재 메모: 표준 질문은 하나로 통합하되 답변이 다르므로, 센터 필터 결과가 정확해야 하면 센터별 답변 variant 또는 센터별 레코드가 필요하다.

#### 하이틴센터

- sourceCenter: `highteen`
- sourceUrl: https://baewoo.me/web/bbs/content.php?co_id=faq
- sourceOrder: 10
- sourceQuestion: 어떤 선생님이 교육을 진행하나요?

배우앤배움 하이틴센터 교육진은 중앙대, 한예종, 서울예대 출신들의 선생님,

드라마,영화 등 메이저 작품활동을 하셨던 분들을 포함해 현재까지도 배우로서 활발한 활동을 하시는 프로 배우분들로 구성되어 있습니다.

자세한 내용은 홈페이지 교육 폴더 중 SPECIAL 강사진에 들어가시면 확인하실 수 있습니다.

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 12
- sourceQuestion: 어떤 선생님이 교육을 진행하나요?

배우앤배움의 모든 교육진은 드라마,영화 등 메이저 작품활동을 하셨던 분들을 포함해 현재까지도 배우로서 활발한 활동을 하시는 프로 배우분들로 구성되어 있습니다.

자세한 내용은 홈페이지 교육폴더 중 SPECIAL 강사진 에 들어가시면 확인하실 수 있습니다.
SPECIAL 강사진 (/web/html/teacher_list.php?mid=teacher)

### FAQ-16. 학생들의 평균 나이대가 어떻게 되나요?

- canonicalQuestion: 학생들의 평균 나이대가 어떻게 되나요?
- centers: `art`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 2
- sourceQuestion: 학생들의 평균 나이대가 어떻게 되나요?

배우앤배움의 성인 Class 연령대는 가장 많은 비중을 차지하는 20대 중반~30대 초반이 40%, 20대 초중반이 30%, 30대 초중반~30대 후반이 30%비중으로 연령대가 구성되어 있습니다. 전체적으로 20세부터 39세까지 다양한 연령대의 인원들이 수강을 하고 있습니다.

### FAQ-17. 연기 전공자는 아니지만 타 학원에서 수강을 한 적이 있습니다. Class 신청 기준이 어떻게 되나요?

- canonicalQuestion: 연기 전공자는 아니지만 타 학원에서 수강을 한 적이 있습니다. Class 신청 기준이 어떻게 되나요?
- centers: `art`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 11
- sourceQuestion: 연기 전공자는 아니지만 타 학원에서 수강을 한 적이 있습니다. Class 신청 기준이 어떻게 되나요?

타 학원에서 6개월 이상 이수한 분들은 중급 R반에, 타 학원에서 1년 6개월 이상 수료하신 분들은 고급 U반에 신청할 수 있는 자격이 주어집니다. 자세한 내용은 홈페이지 교육폴더 중 등급제 교육관리시스템에 들어가시면 안내되어 있습니다.
등급제 교육관리시스템 바로가기 (/web/bbs/content.php?co_id=grade01)

### FAQ-18. 수강 학생들 중 유명한 배우가 있나요?

- canonicalQuestion: 수강 학생들 중 유명한 배우가 있나요?
- centers: `art`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 15
- sourceQuestion: 수강 학생들 중 유명한 배우가 있나요?

네, 그렇습니다. 뿐만 아니라 대형 기획사의 소속 배우들을 위탁 교육하고 있습니다. 하지만 학원을 알아보는 기준을 유명한 배우의 유무로 판단하는 것은 적절하지 않습니다. 이곳의 <배우 인큐베이팅> 과정과 결과를 살펴보는 것이 적절하다고 생각됩니다.

자세한 내용은 캐스팅폴더 중 수강생 촬영소식에 들어가시면 원하시는 내용을 확인하실 수 있습니다.

수강생 촬영소식 바로가기 (/web/bbs/board.php?bo_table=new_shoot)

### FAQ-19. 입시 연기도 교육하나요?

- canonicalQuestion: 입시 연기도 교육하나요?
- centers: `art`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 아트센터

- sourceCenter: `art`
- sourceUrl: https://baewoo.co.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 16
- sourceQuestion: 입시 연기도 교육하나요?

아트센터는 성인 방송 매체 연기 교육만을 담당하고 있으며 입시 연기는 배우앤배움 EnM 교육 계열사 <배우앤배움 입시센터>에서 교육하고 있습니다. 아울러 배우앤배움은 각 교육 센터의 목표와 방향이 잘 세워질 수 있도록 각각의 교육시설, 강사진, 학생관리 등 센터 운영을 분리시켜 운영하고 있습니다.

### FAQ-20. 연습실 개수 및 사용시간대는 어떻게 되나요?

- canonicalQuestion: 연습실 개수 및 사용시간대는 어떻게 되나요?
- centers: `exam`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 3
- sourceQuestion: 연습실 개수 및 사용시간대는 어떻게 되나요?

배우앤배움은 전체 500평 규모의 학원으로 총 21개의 연습실이 있으며, [ 24시 연습홀 ]의 경우 365일 24시간 상시 개방하여 학생들이 연습할 수 있는 환경을 구축하였습니다.
시설안내 바로가기 (/web/bbs/content.php?co_id=sisul)

### FAQ-21. 반 최대 정원이 어떻게 되나요?

- canonicalQuestion: 반 최대 정원이 어떻게 되나요?
- centers: `exam`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 6
- sourceQuestion: 반 최대 정원이 어떻게 되나요?

저희 배우앤배움 입시센터 반 최대인원은 8명입니다.

학생을 1:1로 집중적으로 케어하고, 교육하고있습니다. 더 자세한 내용은 홈페이지 교육 카테고리를 참조하시기 바랍니다.
교육 카테고리 바로가기 (/web/bbs/content.php?co_id=curi)

### FAQ-22. 주말입시반

- canonicalQuestion: 주말입시반
- centers: `exam`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 8
- sourceQuestion: 주말입시반

지방에서 통학하거나, 부득이 평일시간에 수업이 불가한 학생을 위한 클래스로, 타 학원과는 다르게 주말동안이라도 충분히 실기력을 향상 시킬 수 있도록 수업횟수가 주6회 [금.토.일] 3일간 진행됩니다.
자세한 내용은 홈페이지 교육카테고리 중 주말반 안내에 들어가시면 확인하실 수 있습니다.
입시반 안내 바로가기 (/web/bbs/content.php?co_id=curi)

### FAQ-23. 예비입시반

- canonicalQuestion: 예비입시반
- centers: `exam`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 9
- sourceQuestion: 예비입시반

예비반은 주말반으로 수업을 진행하고 있습니다. 주말반 [토.일] 2일간 4회 수업으로 진행됩니다.
자세한 내용은 홈페이지 교육카테고리 중 예비입시반 안내에 들어가시면 확인하실 수 있습니다.
예비입시반 안내 바로가기 (/web/bbs/content.php?co_id=curi03)

### FAQ-24. 연극영화과 세부전공 중 연기전공/뮤지컬전공 차이가 있나요?

- canonicalQuestion: 연극영화과 세부전공 중 연기전공/뮤지컬전공 차이가 있나요?
- centers: `exam`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 10
- sourceQuestion: 연극영화과 세부전공 중 연기전공/뮤지컬전공 차이가 있나요?

전공의 차이보단 단독학과의 구분차이라고 보시면 됩니다.

대부분의 학생들은 뮤지컬과 혹은 연극영화과. 연기과 중 본인에게 맞는 대학을 지원하고 있습니다.

* 중앙대 연극학과 (뮤지컬전공/ 연기전공)

* 동국대 연극학부 (뮤지컬전공/ 연기전공)

* 단국대 뮤지컬과 (여기도 사실 공연영화학부 내에 뮤지컬전공으로 있는 건데 뮤지컬과 개념으로 보면 맞습니다.), 서경대 뮤지컬과, 명지대 뮤지컬과, 한세대 공연예술학과, 호원대 공연미디어학부 뮤지컬과, 백석대 뮤지컬과, 청운대 뮤지컬연기과, 서울예대 뮤지컬과, 동아방송대 뮤지컬과

### FAQ-25. 내신등급이 어느정도 유지되어야 좋나요?

- canonicalQuestion: 내신등급이 어느정도 유지되어야 좋나요?
- centers: `exam`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 11
- sourceQuestion: 내신등급이 어느정도 유지되어야 좋나요?

내신은 사실 좋으면 좋을수록 안정권에 든다고 볼 수 있습니다. 연극영화과 입시의 반영비율은 학교마다 조금씩 차이가 있지만 내신관리를 잘 해두시는게 좋습니다.

<실기 반영비율 / 내신(수능) 반영비율>

실기 60% / 내신(수능) 40%

실기 70% / 내신(수능) 30%

실기 80% / 내신(수능) 20%

더 자세한 반영비율은 각 학교별 모집요강을 참조하시는게 더 정확합니다.

### FAQ-26. 연극영화과 입시 실기시험은 무엇을 보나요?

- canonicalQuestion: 연극영화과 입시 실기시험은 무엇을 보나요?
- centers: `exam`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 입시센터

- sourceCenter: `exam`
- sourceUrl: https://baewoo.kr/web/bbs/content.php?co_id=faq
- sourceOrder: 12
- sourceQuestion: 연극영화과 입시 실기시험은 무엇을 보나요?

크게 자유연기, 당일대사, 지정희곡연기, 즉흥연기, 특기, 질의응답으로 나눠져있습니다.

각 학교별로 실기내용이 다르므로, 자세한건 상담을 통해 본인이 쓰고자하는 학교의 실기내용과 유의사항을 토대로 상담하시길 바랍니다.

### FAQ-27. 학원 내에서 자체적으로 오디션을 진행하기도 하나요?

- canonicalQuestion: 학원 내에서 자체적으로 오디션을 진행하기도 하나요?
- centers: `kids`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 13
- sourceQuestion: 학원 내에서 자체적으로 오디션을 진행하기도 하나요?

배우앤배움 키즈센터는 연간 15~20편의 드라마 전체 배역 캐스팅을 진행하고 있습니다. 때문에 학원 내부 혹은 방송국 오디션을 주기적으로 진행하고 있습니다.

그 외에 아이들의 연기 컨디션을 체크하기 위해 캐스팅 디렉터가 참여하는 레벨 테스트 및 학부모님들을 대상으로 특강을 진행하는 등 다양한 연간 행사가 진행되고 있습니다.

### FAQ-28. 학원에 입학해야만 캐스팅이 진행되는건가요?

- canonicalQuestion: 학원에 입학해야만 캐스팅이 진행되는건가요?
- centers: `kids`
- 공통 여부: 센터 단독 질문
- 권장 적재: 단일 센터 레코드

#### 키즈센터

- sourceCenter: `kids`
- sourceUrl: https://baewoo.net/web/bbs/content.php?co_id=faq
- sourceOrder: 15
- sourceQuestion: 학원에 입학해야만 캐스팅이 진행되는건가요?

결론부터 말씀드리자면 입학을 하지 않아도 키즈센터에 프로필 등록이 되어 있다면 캐스팅 진행은 가능합니다.

하지만 모든 캐스팅은 배우앤배움 키즈센터의 재학중인 원생 우선으로 진행됩니다.

### FAQ-29. 스타카드는 어떻게 사용하나요?

- canonicalQuestion: 스타카드는 어떻게 사용하나요?
- centers: `art`, `exam`, `highteen`, `kids`
- tags: `스타카드`
- sourceType: `craftedFromPage`
- 공통 여부: 통합 질문
- 권장 적재: 복수 centers 단일 레코드

#### 통합 답변

- sourceUrls:
  - https://baewoo.co.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.me/web/bbs/content.php?co_id=starcard
  - https://baewoo.net/web/bbs/content.php?co_id=starcard
- sourceOrder: 1
- sourceQuestion: 스타카드 사용방법

배우앤배움 스타카드는 제휴 편의시설에서 카드를 제시하면 바로 사용할 수 있습니다.

지속적으로 사용하려면 매달 지정된 갱신기간에 카드 갱신을 해야 합니다. 제휴업체의 할인율은 변동될 수 있습니다.

### FAQ-30. 스타카드는 누가 발급받을 수 있나요?

- canonicalQuestion: 스타카드는 누가 발급받을 수 있나요?
- centers: `art`, `exam`, `highteen`, `kids`
- tags: `스타카드`
- sourceType: `craftedFromPage`
- 공통 여부: 통합 질문
- 권장 적재: 복수 centers 단일 레코드

#### 통합 답변

- sourceUrls:
  - https://baewoo.co.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.me/web/bbs/content.php?co_id=starcard
  - https://baewoo.net/web/bbs/content.php?co_id=starcard
- sourceOrder: 2
- sourceQuestion: 스타카드 발급안내

스타카드는 배우앤배움 각 센터 재학생이 발급받을 수 있습니다. 아트센터, 입시센터, 하이틴센터는 단기 휴학생도 발급 대상에 포함되며, 키즈센터 원문은 재학생만 발급 대상으로 표기되어 있습니다.

신규 등록과 동시에 발급이 진행되며, 등록일 기준 3일까지 신청할 수 있습니다.

| 센터 | 발급 대상 | 발급 장소/문의 |
|---|---|---|
| 아트센터 | 재학생 및 단기 휴학생 | 배우앤배움 아트센터 3층 안내데스크 |
| 입시센터 | 재학생 및 단기 휴학생 | 배우앤배움 입시센터 담당자에게 문의 |
| 하이틴센터 | 재학생 및 단기 휴학생 | 배우앤배움 하이틴센터 담당자에게 문의 |
| 키즈센터 | 재학생 | 배우앤배움 키즈센터 담당자에게 문의 |

### FAQ-31. 스타카드는 언제 갱신해야 하나요?

- canonicalQuestion: 스타카드는 언제 갱신해야 하나요?
- centers: `art`, `exam`, `highteen`, `kids`
- tags: `스타카드`
- sourceType: `craftedFromPage`
- 공통 여부: 통합 질문
- 권장 적재: 복수 centers 단일 레코드

#### 통합 답변

- sourceUrls:
  - https://baewoo.co.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.me/web/bbs/content.php?co_id=starcard
  - https://baewoo.net/web/bbs/content.php?co_id=starcard
- sourceOrder: 3
- sourceQuestion: 스타카드 갱신안내

스타카드는 매월 마지막 주에 갱신해야 합니다. 아트센터는 3층 안내데스크에서 갱신할 수 있고, 입시센터, 하이틴센터, 키즈센터는 각 센터 담당자에게 문의하면 됩니다.

스타카드는 매월 갱신되며, 특히 휘트니스 이용 권한은 월마다 리셋됩니다. 휘트니스 이용을 원하는 수강생은 매월 다시 신청해야 합니다.

### FAQ-32. 스타카드를 분실하거나 훼손하면 재발급받을 수 있나요?

- canonicalQuestion: 스타카드를 분실하거나 훼손하면 재발급받을 수 있나요?
- centers: `art`, `exam`, `highteen`, `kids`
- tags: `스타카드`
- sourceType: `craftedFromPage`
- 공통 여부: 통합 질문
- 권장 적재: 복수 centers 단일 레코드

#### 통합 답변

- sourceUrls:
  - https://baewoo.co.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.me/web/bbs/content.php?co_id=starcard
  - https://baewoo.net/web/bbs/content.php?co_id=starcard
- sourceOrder: 4
- sourceQuestion: 스타카드 재발급안내

스타카드를 분실했거나 훼손한 경우 재발급받을 수 있습니다.

재발급 시 3,000원의 비용이 청구됩니다.

| 센터 | 재발급 문의 |
|---|---|
| 아트센터 | 배우앤배움 운영팀 02-1577-9929 |
| 입시센터 | 배우앤배움 운영팀 02-1577-9929 |
| 하이틴센터 | 배우앤배움 운영팀 02-1577-9929 |
| 키즈센터 | 키즈센터 담당자 02-540-3980 |

### FAQ-33. 스타카드를 아직 수령하지 못했다면 어디에서 받을 수 있나요?

- canonicalQuestion: 스타카드를 아직 수령하지 못했다면 어디에서 받을 수 있나요?
- centers: `art`, `exam`, `highteen`, `kids`
- tags: `스타카드`
- sourceType: `craftedFromPage`
- 공통 여부: 통합 질문
- 권장 적재: 복수 centers 단일 레코드

#### 통합 답변

- sourceUrls:
  - https://baewoo.co.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.kr/web/bbs/content.php?co_id=starcard
  - https://baewoo.me/web/bbs/content.php?co_id=starcard
  - https://baewoo.net/web/bbs/content.php?co_id=starcard
- sourceOrder: 5
- sourceQuestion: 스타카드 미수령안내

스타카드를 아직 수령하지 못했다면 각 센터의 수령 안내를 따르면 됩니다.

| 센터 | 수령 안내 |
|---|---|
| 아트센터 | 배우앤배움 아트센터 본관 3층 안내데스크에서 직접 수령 |
| 입시센터 | 배우앤배움 입시센터 담당자에게 문의 |
| 하이틴센터 | 배우앤배움 하이틴센터 담당자에게 문의 |
| 키즈센터 | 배우앤배움 키즈센터 담당자에게 문의 |
