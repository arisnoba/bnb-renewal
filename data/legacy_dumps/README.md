# legacy_dumps

센터별 레거시 MariaDB 원본 덤프 보관 위치다. SQL dump 본문은 용량과 민감도 때문에 Git에 포함하지 않는다.

## 현재 기대 파일

- `baewoo.sql`: 아트센터 계열 원본 DB
- `bnbuniv.sql`: 입시센터 원본 DB
- `kidscenter.sql`: 키즈센터 원본 DB
- `bnbhighteen.sql`: 하이틴센터 원본 DB

## 로컬 복원

```bash
npm run legacy:db:up
npm run legacy:db:import
npm run legacy:db:verify
```

기존 로컬 복원본을 버리고 다시 넣을 때만 아래 명령을 사용한다.

```bash
npm run legacy:db:import:reset
```
