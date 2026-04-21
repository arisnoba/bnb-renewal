import { type LegacyBoardSeedConfig, seedLegacyBoard } from './seed-legacy-board'
import { toNonEmptyString } from './runtime'

const seedConfig: LegacyBoardSeedConfig = {
  collection: 'directings',
  fileName: 'g5_write_new_direct_all.sql',
  legacyFieldKeys: ['wr_1', 'wr_3', 'wr_4', 'wr_5', 'wr_6', 'wr_7', 'wr_8', 'wr_9', 'wr_10'],
  mapExtra: (row) => ({
    productionMeta: toNonEmptyString(row.wr_2),
  }),
  slugPrefix: (sourceTable) => sourceTable.replace('g5_write_new_', 'direct-'),
  useInsertTables: true,
}

void seedLegacyBoard(seedConfig)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
