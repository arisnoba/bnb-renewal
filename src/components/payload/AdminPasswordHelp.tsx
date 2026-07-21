const adminPasswordHelpTitle = '비밀번호를 잊으셨나요?'
const adminPasswordHelpMessage =
  '비밀번호 찾기에서 등록된 이메일로 재설정 링크를 받을 수 있습니다.'

export function AdminLoginPasswordHelp() {
  return (
    <aside className="bnb-admin-password-help">
      <strong>{adminPasswordHelpTitle}</strong>
      <p>{adminPasswordHelpMessage}</p>
    </aside>
  )
}
