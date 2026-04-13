# Legacy SEO/GEO Root Assets

생성 기준일: 2026-04-13

이 디렉터리는 운영 소스 없이도 바로 배포할 수 있도록 만든 브랜드별 웹루트 정적 파일 세트입니다.
목표는 레거시 PHP/Gnuboard 소스를 거의 건드리지 않고 `robots.txt`, `sitemap.xml`, `llms.txt`만으로
SEO/GEO의 기본 크롤링 신호를 정리하는 것입니다.

## 2026-04-13 실 URL 확인 요약

| 브랜드 | 도메인 | robots.txt | sitemap.xml | llms.txt | 메모 |
| --- | --- | --- | --- | --- | --- |
| 아트센터 | `https://www.baewoo.co.kr` | 있음 | 있음 | 없음 | 라이브 sitemap은 최근 갱신됨. llms만 신규 필요 |
| 입시센터 | `https://www.baewoo.kr` | 있음 | 404 | 404 | robots에 Sitemap 선언도 없음 |
| 키즈센터 | `https://baewoo.net` | 있음 | 404 | 404 | robots에 Sitemap 선언도 없음 |
| 하이틴센터 | `https://baewoo.me` | 있음 | 있음(오류) | 404 | 현재 sitemap이 `baewoo.co.kr`을 잘못 가리킴 |
| 애비뉴센터 | `https://www.baewoorun.co.kr` | 404 | 404 | 404 | HTTPS 홈은 응답하지만 루트 보조 파일은 모두 없음 |

## 배포 방식

1. 각 브랜드 폴더 안의 `robots.txt`, `sitemap.xml`, `llms.txt`를 해당 도메인의 웹루트에 업로드합니다.
2. 이 파일들은 루트에 두되, sitemap 안의 실제 페이지 URL은 기존 운영 구조를 따라 `/web/...` 경로를 유지했습니다.
3. HTML/PHP 템플릿 수정은 포함하지 않았습니다. 이번 묶음은 루트 정적 파일만 교체하는 최소 변경안입니다.

## 배포 후 확인 명령

```bash
curl -L -sS https://도메인/robots.txt
curl -L -sS https://도메인/sitemap.xml
curl -L -sS https://도메인/llms.txt
```

## 폴더 구성

- `art-center/`
- `exam-center/`
- `kids-center/`
- `highteen-center/`
- `avenue-center/`
