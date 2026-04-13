import type { Access } from 'payload'

export const allowAll: Access = () => true

export const loggedInOnly: Access = ({ req }) => Boolean(req.user)
