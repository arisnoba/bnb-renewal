import type { UIFieldServerComponent } from 'payload'

export const ForceUnlockHelp: UIFieldServerComponent = () => {
  return (
    <section
      style={{
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-border-color)',
        borderRadius: 'var(--style-radius-s)',
        color: 'var(--theme-elevation-700)',
        display: 'grid',
        gap: 6,
        marginTop: 'calc(var(--base) * 1.25)',
        padding: 'calc(var(--base) * 0.75)',
      }}
    >
      <strong style={{ color: 'var(--theme-text)', fontSize: 13 }}>강제 잠금 해제 안내</strong>
      <span style={{ fontSize: 13, lineHeight: 1.5 }}>
        다른 관리자가 편집 중인 문서의 잠금이 비정상적으로 남아 있을 때만 사용합니다.
        실제 편집 중인 문서를 강제로 해제하면 저장 전 변경사항과 충돌할 수 있습니다.
      </span>
    </section>
  )
}
