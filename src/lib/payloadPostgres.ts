import { attachDatabasePool } from '@vercel/functions/db-connections'
import pg, { type PoolConfig } from 'pg'

type PostgresPoolError = Error & {
  code?: string
}

export class PayloadPostgresPool extends pg.Pool {
  constructor(
    config?: PoolConfig,
    attachPool: typeof attachDatabasePool = attachDatabasePool,
  ) {
    super(config)

    this.on('error', (error: PostgresPoolError) => {
      console.error('[database] idle PostgreSQL client was removed from the pool', {
        code: error.code,
        message: error.message,
      })
    })

    if (process.env.VERCEL === '1') {
      attachPool(this)
    }
  }
}

export const payloadPostgres = {
  ...pg,
  Pool: PayloadPostgresPool,
} as typeof pg
