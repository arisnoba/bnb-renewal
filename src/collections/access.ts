import type { Access } from 'payload'

import { isGlobalAdminUser, userCenterValue } from './shared'

export const allowAll: Access = () => true

export const loggedInOnly: Access = ({ req }) => Boolean(req.user)

export const globalAdminOnly: Access = ({ req }) => isGlobalAdminUser(req.user)

export const centerScopedCreateAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  return isGlobalAdminUser(req.user) || Boolean(userCenterValue(req.user))
}

export const centerScopedAccess: Access = ({ req }) => {
  if (!req.user) {
    return false
  }

  if (isGlobalAdminUser(req.user)) {
    return true
  }

  const center = userCenterValue(req.user)

  if (!center) {
    return false
  }

  return {
    centers: {
      contains: center,
    },
  }
}

export const centerScopedReadAccess: Access = ({ req }) => {
  if (!req.user) {
    return true
  }

  if (isGlobalAdminUser(req.user)) {
    return true
  }

  const center = userCenterValue(req.user)

  if (!center) {
    return false
  }

  return {
    or: [
      {
        centers: {
          contains: center,
        },
      },
      {
        centers: {
          contains: 'all',
        },
      },
    ],
  }
}

export const centerScopedCollectionAccess = {
  create: centerScopedCreateAccess,
  delete: centerScopedAccess,
  read: centerScopedReadAccess,
  update: centerScopedAccess,
}
