import type { AdminViewServerProps, ServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'

const adminPasswordHelpTitle = '비밀번호를 잊으셨나요?'
const adminPasswordHelpMessage =
  '계정 접근이 필요하면 시스템 관리자에게 비밀번호 재설정을 요청해 주세요.'

function resolveAdminLoginURL(payload: ServerProps['payload']) {
  const config = payload.config

  return formatAdminURL({
    adminRoute: config.routes.admin,
    path: config.admin.routes.login,
  })
}

export function AdminLoginPasswordHelp() {
  return (
    <aside className="bnb-admin-password-help">
      <strong>{adminPasswordHelpTitle}</strong>
      <p>{adminPasswordHelpMessage}</p>
    </aside>
  )
}

export function AdminForgotPasswordNotice({ initPageResult }: AdminViewServerProps) {
  const loginURL = resolveAdminLoginURL(initPageResult.req.payload)

  return (
    <section className="bnb-admin-password-notice">
      <h1>{adminPasswordHelpTitle}</h1>
      <p>{adminPasswordHelpMessage}</p>
      <a className="bnb-admin-password-notice__link" href={loginURL}>
        로그인으로 돌아가기
      </a>
    </section>
  )
}
