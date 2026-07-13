import Image from 'next/image'

export function AdminLoginLogo() {
  return (
    <Image
      alt="배우앤배움 ENM"
      className="bnb-admin-login-logo"
      draggable={false}
      height={47}
      priority
      src="/assets/common/logo/logo-enm.svg"
      unoptimized
      width={137}
    />
  )
}
