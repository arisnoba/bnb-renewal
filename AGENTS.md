# 개인 작업 규칙 추가

## Payload 관리자 검증 UI

- Payload 관리자에서 필수값 에러가 필드 UI에 보여야 하는 경우, 컬렉션 `beforeValidate`에서 `throw new Error(...)`로 처리하지 않는다. 이 방식은 필드별 빨간 border, tooltip, 탭 에러 카운트 같은 기본 validation UI에 붙지 않는다.
- 커스텀 UI라도 validation UI가 필요하면 `type: "ui"`만 쓰지 않는다. `text`, `select`, `relationship` 등 실제 form state를 가진 필드에 `validate`를 붙이고, 필요한 경우 `virtual: true`와 custom `Field` 컴포넌트를 조합한다.
- 기존 데이터에 빈 값이 있을 수 있는 컬렉션에서 단순히 `required: true`를 추가하면 DB `NOT NULL` 변경이 발생할 수 있다. 관리자 UI 검증만 필요한 경우 field-level `validate`를 우선 사용한다.
- 커스텀 필드 컴포넌트는 `useField`로 해당 필드 path의 `showError`, `errorMessage`, `setValue`를 연결하고, `FieldError`/`FieldLabel` 등 Payload 기본 UI 컴포넌트를 재사용한다.
- 숨겨진 보조 필드 값을 조작하는 커스텀 UI는 사용자가 조작할 때 대표 필드의 값도 함께 갱신해서 validation state가 최신 상태로 다시 계산되게 한다.

## Payload 배열 필드 제목

- Payload `array` 필드에 제목 역할을 할 수 있는 중요한 `text` 필드가 있으면 그 필드를 필수 입력으로 두고, 배열 row title/row label에 반드시 사용한다.
- 새 배열을 만들거나 기존 배열을 수정할 때는 관리자가 접힌 row만 보고도 항목을 구분할 수 있는 대표 텍스트 필드를 먼저 정한다.
- 대표 텍스트가 없는 배열은 가능한 한 `RowLabel` 컴포넌트나 동등한 관리자 표시 방식을 추가해 항목 식별이 되게 한다.
