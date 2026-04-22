# BNB 5개 사이트 IA 구조 분석

> 분석일: 2026-03-26
> 방법: GNB/LNB 크롤링 + 링크 구조 파악
> 플랫폼: 전 사이트 **그누보드(Gnuboard) PHP 기반** (에비뉴센터 제외)

---

## 요약 비교표

| 사이트 | 도메인 | GNB depth | 총 페이지 수 | 특이사항 |
|--------|--------|-----------|-------------|---------|
| 아트센터 | baewoo.co.kr | 6개 1depth | 29 | 캐스팅/매니지먼트 특화 |
| 에비뉴센터 | baewoorun.co.kr | 없음 | **1** (랜딩) | 단일 원페이지 사이트 |
| 입시센터 | baewoo.kr | 6개 1depth | 29 | 입시반 커리큘럼 다수 |
| 키즈센터 | baewoo.net | 6개 1depth | 30 | 아역 특화, 캐스팅사 많음 |
| 하이틴센터 | baewoo.me | 6개 1depth | 31 | 특강/섭외뉴스 추가 |

### URL 패턴 (공통)
- `content.php?co_id=*` → 정적 콘텐츠
- `board.php?bo_table=*` → 게시판/갤러리
- `write.php?bo_table=*` → 신청/폼
- `/web/html/*.php` → 커스텀 PHP 페이지

---

## 1. 아트센터 (baewoo.co.kr)

**URL**: https://www.baewoo.co.kr/web/index.php

### 메뉴 구조

- **배우앤배움** (소개)
  - 기업소개 `?co_id=parents` [static]
  - 센터소개 `?co_id=identity` [static]
  - 시설안내 `?co_id=sisul` [gallery]
  - 오시는 길 `?co_id=map` [static]

- **교육**
  - 등급제 교육관리시스템 `?co_id=grade01` [static]
  - 엔터테인먼트 위탁교육 `/html/manage_list.php?mid=entertain` [static]
  - 교육진 소개 `/html/teacher_list.php?mid=teacher` [gallery]
  - 이달의 커리큘럼 `/html/class_curriculum.php` [기타 - Ajax 동적 필터]

- **캐스팅**
  - 이달의 드라마·광고 출연장면 `bo_table=new_drama` [gallery]
  - 진행중인 캐스팅 출연현황 `bo_table=new_appear` [gallery]
  - 드라마캐스팅(유캐스팅) `bo_table=new_casting2` [board]
  - 광고캐스팅(BX모델에이전시) `bo_table=new_casting_bx` [board]
  - 오디션 지원하기 `write.php?bo_table=new_audition` **[form]**

- **매니지먼트**
  - 매니지먼트 시스템 `?co_id=systemintro` [static]
  - 매니저 소개 `/web/management.php#sec1` [static]
  - 이달의 촬영·오디션 스케줄 `bo_table=new_calendar02` [기타 - 캘린더]
  - BNB출신 아티스트 `bo_table=new_shoot` [gallery]
  - BNB루키 `bo_table=new_profile` [gallery]
  - 촬영후기 `bo_table=new_hoogi` [gallery]
  - 프로필 촬영·제작 `?co_id=profile` [static]

- **운영**
  - NEWS&NOTICE `bo_table=new_notice` [board]
  - 입학안내 `?co_id=enterance` [static]
  - 학원 100% 소개영상 [외부링크 - YouTube]
  - 학원 100% 이용법 `?co_id=useguide` [static]
  - 스타카드 멤버쉽서비스 `bo_table=new_starcard` [board]

- **상담센터**
  - CS센터 운영안내 `?co_id=cs_call` [static]
  - 온라인 상담신청 `write.php?bo_table=new_counsel` **[form]**
  - 온라인 상담현황 `bo_table=new_counsel` [board]
  - FAQ `?co_id=faq` [static]

### 페이지 유형 요약

| 유형 | 수 |
|------|----|
| static | 14 |
| gallery | 8 |
| board | 5 |
| form | 2 |
| 기타(캘린더/Ajax) | 2 |
| 외부링크 | 1 |
| **합계** | **32** |

---

## 2. 에비뉴센터 (baewoorun.co.kr)

**URL**: https://www.baewoorun.co.kr
**구조**: GNB/LNB 없는 **원페이지 랜딩 사이트**

### 메뉴 구조

네비게이션 없음. 단일 페이지에 4개 섹션 스크롤 구성.

| # | 섹션명 | 유형 | 비고 |
|---|--------|------|------|
| 1 | 애비뉴센터 소개 | static | 시설 소개 |
| 2 | 제휴업체 | static | 스타카드 파트너 16개 로고 |
| 3 | 강사진 소개 | static | 배우 프로필 |
| 4 | 캐스팅/모집 안내 | static | 유캐스팅 갤러리 + 상담 버튼 |
| (외부) | 온라인 상담신청 | **form** | baewoo.co.kr 도메인으로 이동 |

> 패밀리 사이트 링크(6개): 하단 Footer에 전 계열사 링크 나열

### 페이지 유형 요약

| 유형 | 수 |
|------|----|
| static (원페이지 전체) | 1 |
| **합계** | **1** |

---

## 3. 입시센터 (baewoo.kr)

**URL**: https://www.baewoo.kr/web/index.php

### 메뉴 구조

- **배우앤배움** (소개)
  - 회사소개 `?co_id=company` [static]
  - 대표인사말 `?co_id=greeting` [static]
  - 시설안내 `?co_id=sisul` [gallery]
  - 오시는 길 `?co_id=map` [static]
  - 자회사 `?co_id=parents` [static]
  - 연혁 `?co_id=history` [static]

- **교육**
  - 교육진 소개 `/html/teacher_list.php?mid=teacher` [gallery]
  - 입시반 커리큘럼 `?co_id=curi` [static]
  - 재입시반 커리큘럼 `?co_id=curi02` [static]
  - 편입반 커리큘럼 `?co_id=curi06` [static]
  - 입시 매니지먼트 `?co_id=exam_mng` [static]
  - 예비 입시반 커리큘럼 `?co_id=curi03` [static]
  - 예고 입시반 커리큘럼 `?co_id=curi04` [static]

- **합격현황**
  - 대학교 `bo_table=victory10` [gallery]
  - 예술고등학교 `bo_table=victory30` [gallery]

- **합격자 소개**
  - 수강생 합격후기 `bo_table=new_hoogi` [gallery]
  - 수강생 합격영상 `bo_table=new_shoot` [gallery]

- **입시센터100%이용법**
  - 학원 100% 이용법 `?co_id=useguide` [static]
  - 학원 100% 소개영상 [외부링크 - YouTube]
  - 특별한 시스템 `?co_id=new_sys02` [static]
  - 멤버쉽 서비스 `?co_id=new_sys06` [static]
  - 배우앤배움 스타카드 `bo_table=new_starcard` [gallery]
  - 장학제도 `?co_id=Scholarship` [static]

- **상담센터**
  - CS센터 운영안내 `?co_id=cs_call` [static]
  - NEWS&NOTICE `bo_table=new_notice` [board]
  - 온라인 상담신청 `write.php?bo_table=new_counsel` **[form]**
  - 온라인 상담현황 `bo_table=new_counsel` [board]
  - FAQ `?co_id=faq` [static]

### 페이지 유형 요약

| 유형 | 수 |
|------|----|
| static | 18 |
| gallery | 7 |
| board | 2 |
| form | 1 |
| 외부링크 | 1 |
| **합계** | **29** |

---

## 4. 키즈센터 (baewoo.net)

**URL**: https://baewoo.net/web/index.php

### 메뉴 구조

- **배우앤배움** (소개)
  - 회사소개 `?co_id=company` [static]
  - 대표인사말 `?co_id=greeting` [static]
  - 시설안내 `?co_id=sisul` [gallery]
  - 오시는 길 `?co_id=map` [static]

- **교육**
  - 등급제 교육관리시스템 `?co_id=grade01` [static]
  - 교육진 소개 `/html/teacher_list.php?mid=teacher` [gallery]
  - 영재 교육과정 `?co_id=edu01` [static]
  - 아역배우 교육과정 `?co_id=edu02` [static]
  - 아티스트 교육과정 `?co_id=edu03` [static]
  - 엔터테인먼트 위탁교육 `/html/manage_list.php?mid=entertain` [static]

- **캐스팅**
  - 이달의 드라마·광고 출연장면 `bo_table=new_drama` [gallery]
  - 진행중인 캐스팅 출연현황 `bo_table=new_appear` [board]
  - 드라마캐스팅(BNB캐스팅) `bo_table=new_casting_enm` [board]
  - 드라마캐스팅(유캐스팅) `bo_table=new_casting2` [board]
  - 드라마캐스팅(IMGround) `bo_table=new_casting_img` [board]
  - 광고캐스팅(BX모델에이전시) `bo_table=new_casting_bx` [board]

- **매니지먼트**
  - 매니지먼트 시스템 `?co_id=systemintro` [static]
  - 촬영·오디션 스케줄 `bo_table=new_calendar` [기타 - 캘린더]
  - 아역배우 프로필 `bo_table=new_profile` [gallery]
  - 프로필 촬영·제작 `?co_id=profile` [static]

- **운영**
  - NEWS&NOTICE `bo_table=new_notice` [board]
  - 입학안내 `?co_id=enterance` [static]
  - 학원 100% 소개영상 [외부링크 - YouTube]
  - 학원 100% 이용법 `?co_id=useguide` [static]
  - 스타카드 멤버쉽서비스 `bo_table=new_starcard` [gallery]

- **상담센터**
  - CS센터 운영안내 `?co_id=cs_call` [static]
  - 온라인 상담신청 `write.php?bo_table=new_counsel` **[form]**
  - 온라인 상담현황 `bo_table=new_counsel` [board]
  - FAQ `?co_id=faq` [static]

### 페이지 유형 요약

| 유형 | 수 |
|------|----|
| static | 14 |
| board | 11 |
| gallery | 3 |
| form | 1 |
| 기타(캘린더) | 1 |
| 외부링크 | 1 |
| **합계** | **31** |

---

## 5. 하이틴센터 (baewoo.me)

**URL**: https://baewoo.me/web/index.php

### 메뉴 구조

- **배우앤배움** (소개)
  - 회사소개 `?co_id=company` [static]
  - 대표인사말 `?co_id=greeting` [static]
  - 시설안내 `?co_id=sisul` [gallery]
  - 오시는 길 `?co_id=map` [static]

- **교육**
  - 등급제 교육관리시스템 `?co_id=grade01` [static]
  - 엔터테인먼트 위탁교육 `/html/manage_list.php?mid=entertain` [static]
  - 교육진 소개 `/html/teacher_list.php?mid=teacher` [static]
  - 이달의 커리큘럼 `/html/class_curriculum.php` [기타 - 드롭다운 필터]
  - 하이틴센터 특강 `bo_table=new_specialclass` [gallery]

- **캐스팅**
  - 이달의 드라마·광고 출연장면 `bo_table=new_drama` [gallery]
  - 진행중인 캐스팅출연현황 `bo_table=new_appear` [gallery]
  - 드라마캐스팅(BNB캐스팅) `bo_table=new_casting_enm` [board]
  - 드라마캐스팅(유캐스팅) `bo_table=new_casting2` [board]
  - 드라마캐스팅(IMGround) `bo_table=new_casting_img` [board]
  - 광고캐스팅(BX모델에이전시) `bo_table=new_casting_bx` [board]
  - └ 다이렉트 캐스팅 (내부탭) `bo_table=new_direct_bx` [gallery]
  - BNB 캐스팅 섭외뉴스 `bo_table=bnb_highteen_news` [gallery]
  - AUDITION `write.php?bo_table=new_audition` **[form]**

- **매니지먼트**
  - 매니지먼트 시스템 `?co_id=systemintro` [static]
  - 촬영·오디션 스케줄 `bo_table=new_calendar02` [기타 - 캘린더]
  - BNB 루키 `bo_table=new_profile` [gallery]
  - 프로필 촬영·제작 `?co_id=profile` [static]

- **운영**
  - NEWS&NOTICE `bo_table=new_notice` [board]
  - 입학안내 `?co_id=enterance` [static]
  - 학원 100% 소개영상 [외부링크 - YouTube]
  - 학원 100% 이용법 `?co_id=useguide` [static]
  - 스타카드 멤버쉽서비스 `bo_table=new_starcard` [gallery]

- **상담센터**
  - CS센터 운영안내 `?co_id=cs_call` [static]
  - 온라인 상담신청 `write.php?bo_table=new_counsel` **[form]**
  - 온라인 상담현황 `bo_table=new_counsel` [board]
  - FAQ `?co_id=faq` [static]

### 페이지 유형 요약

| 유형 | 수 |
|------|----|
| static | 14 |
| gallery | 9 |
| board | 5 |
| form | 3 |
| 기타(캘린더) | 1 |
| 외부링크 | 1 |
| **합계** | **33** |

---

## 전체 통합 인벤토리

### 5개 사이트 페이지 유형 합산

| 유형 | 아트센터 | 에비뉴센터 | 입시센터 | 키즈센터 | 하이틴센터 | **합계** |
|------|---------|-----------|---------|---------|-----------|--------|
| static | 14 | 1 | 18 | 14 | 14 | **61** |
| gallery | 8 | 0 | 7 | 3 | 9 | **27** |
| board | 5 | 0 | 2 | 11 | 5 | **23** |
| form | 2 | 0 | 1 | 1 | 3 | **7** |
| 기타(캘린더/Ajax) | 2 | 0 | 0 | 1 | 1 | **4** |
| 외부링크 | 1 | 0 | 1 | 1 | 1 | **4** |
| **합계** | **32** | **1** | **29** | **31** | **33** | **126** |

### 사이트별 공통 페이지 (재사용 가능 컴포넌트 후보)

모든 그누보드 4개 사이트(아트센터 제외 일부)에 **공통으로 존재하는 페이지**:

| 공통 페이지 | co_id / bo_table | 유형 |
|------------|-----------------|------|
| 시설안내 | `co_id=sisul` | gallery |
| 오시는 길 | `co_id=map` | static |
| 교육진 소개 | `/html/teacher_list.php` | gallery |
| 엔터테인먼트 위탁교육 | `/html/manage_list.php` | static |
| 이달의 드라마·광고 출연장면 | `bo_table=new_drama` | gallery |
| 매니지먼트 시스템 | `co_id=systemintro` | static |
| BNB루키/프로필 | `bo_table=new_profile` | gallery |
| 프로필 촬영·제작 | `co_id=profile` | static |
| NEWS&NOTICE | `bo_table=new_notice` | board |
| 입학안내 | `co_id=enterance` | static |
| 학원 100% 이용법 | `co_id=useguide` | static |
| 스타카드 멤버쉽서비스 | `bo_table=new_starcard` | gallery |
| CS센터 운영안내 | `co_id=cs_call` | static |
| 온라인 상담신청 | `write.php?bo_table=new_counsel` | form |
| 온라인 상담현황 | `bo_table=new_counsel` | board |
| FAQ | `co_id=faq` | static |

### 사이트별 고유 페이지

| 사이트 | 고유 페이지 |
|--------|-----------|
| 아트센터 | 센터소개(identity), 오디션 지원하기, 매니저 소개, BNB출신 아티스트, 촬영후기 |
| 에비뉴센터 | 원페이지 전체 (독립 구성) |
| 입시센터 | 대표인사말, 자회사, 연혁, 입시반/재입시반/편입반/예비/예고 커리큘럼(5종), 입시매니지먼트, 합격현황(대학교/예고), 합격후기, 합격영상, 특별한 시스템, 멤버쉽 서비스, 장학제도 |
| 키즈센터 | 영재/아역/아티스트 교육과정(3종), 드라마캐스팅(BNB/IMGround) |
| 하이틴센터 | 하이틴센터 특강, 드라마캐스팅(BNB/IMGround), 다이렉트 캐스팅, BNB 캐스팅 섭외뉴스, 이달의 커리큘럼 |

---

## 개발공수 산정 참고사항

### 리뉴얼 시 주요 고려사항

1. **그누보드 탈피 여부**: 현재 `content.php?co_id=`, `board.php?bo_table=` 기반 URL은 SEO에 매우 불리. 리뉴얼 시 클린 URL 구조 필요
2. **공통 페이지 16종** → 공용 컴포넌트/템플릿으로 개발 가능 (공수 절감)
3. **에비뉴센터는 독립 개발** 필요 (원페이지, 구조 완전히 다름)
4. **폼 페이지(7개)**: 온라인 상담신청(4개 사이트 공통), 오디션 지원(아트센터/하이틴), 이달의 커리큘럼(아트/하이틴)
5. **캘린더 페이지(4개)**: 커스텀 캘린더 컴포넌트 개발 필요
6. **입시센터가 가장 복잡** (static 18개, 커리큘럼 5종 + 합격현황 2종 등)
