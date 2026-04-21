import { type LegacyBoardSeedConfig, seedLegacyBoard } from './seed-legacy-board'
import { toNonEmptyString } from './runtime'

const seedConfig: LegacyBoardSeedConfig = {
  collection: 'shoots',
  fileName: 'g5_write_new_shoot.sql',
  legacyFieldKeys: ['wr_1', 'wr_2', 'wr_5', 'wr_6', 'wr_7', 'wr_8', 'wr_9', 'wr_10'],
  mapExtra: (row) => ({
    actorGeneration: toNonEmptyString(row.wr_4),
    actorName: toNonEmptyString(row.wr_3),
  }),
  printSummary: (records) => ({
    actorNameCounts: countBy(records, (record) => String(record.actorName ?? '(empty)')),
  }),
  slugPrefix: 'shoot',
}

function countBy<T>(items: T[], keyOf: (item: T) => string) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const key = keyOf(item)
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})
}

void seedLegacyBoard(seedConfig)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
