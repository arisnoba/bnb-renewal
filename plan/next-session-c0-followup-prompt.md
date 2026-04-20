# C0 후속 작업용 프롬프트

아래 프롬프트를 새 세션 시작 메시지로 그대로 사용하면 된다.

```text
/Users/arisnoba/Documents/GitHub/bnb-renewal/plan/c0-migration-plan.md
/Users/arisnoba/Documents/GitHub/bnb-renewal/plan/todo.md
/Users/arisnoba/Documents/GitHub/bnb-renewal/data/baewoo-curated/c0/castings-diff-report.md

기준으로 C0 마이그레이션 후속 작업 이어서 진행해줘.

현재 상태:
- Phase 0 완료
- Phase 1 완료
- Phase 2 완료
- Neon DB 현재 카운트: teachers=109, agencies=63, agencies_actors=185, profiles=660, news=2908, castings=22
- Castings diff 승인 게이트는 이미 통과했고 c0 22건으로 교체 완료
- slug 중복 검사는 profiles/news/castings 모두 0

이번 세션 목표:
1. 먼저 `plan/todo.md`와 `plan/c0-migration-plan.md`를 읽고 현재 기준 상태를 재확인
2. Phase 3 또는 Phase 4 중 지금 가장 안전한 다음 단계부터 진행
3. 단, `news/profiles/castings`의 2020년 이전 데이터 제외는 이번엔 즉시 삭제하지 말고 별도 후속 작업으로 다뤄줘
4. 만약 2020년 컷오프가 지금 필요한지 검토가 필요하면:
   - rollback 없이 별도 정리 phase로 제안
   - 영향 카운트와 대상 범위를 먼저 리포트
   - 바로 삭제하지 말고 승인 가능한 단위로 나눠줘

주의사항:
- destructive 작업 전에는 반드시 DB target / `ALLOW_DESTRUCTIVE_C0` 가드를 다시 확인
- 기존 패턴을 우선 따르고, 작은 변경으로 진행
- 가능하면 dry-run, typecheck, lint, read-only SQL 검증까지 하고 결과를 명시
- 검증하지 못한 것은 검증했다고 말하지 말 것

참고 메모:
- News 본문 legacy URL 잔존: `/data/=2869`, `/web/img/=3`, `http://www.baewoo.co.kr/=810`, `http://baewoobaewoo.cafe24.com/=27`, `https://baewoo.co.kr:443/=1274`
- News dry-run 메모리: parse 약 1470ms, RSS delta 약 554.6MB
- Castings source 분포: `g5_write_new_casting=5`, `g5_write_new_casting2=4`, `g5_write_new_casting3=5`, `g5_write_new_casting_abio=6`, `g5_write_new_casting_bx=2`

작업 시작 전에 짧은 계획을 제시하고, 끝나면 변경 파일 / 검증 결과 / 남은 리스크를 짧게 정리해줘.
```
