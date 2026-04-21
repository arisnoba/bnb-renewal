import { type LegacyBoardSeedConfig, seedLegacyBoard } from './seed-legacy-board'
import { toNonEmptyString } from './runtime'

const seedConfig: LegacyBoardSeedConfig = {
  collection: 'dramas',
  fileName: 'g5_write_new_drama.sql',
  legacyFieldKeys: [
    'wr_2',
    'wr_7',
    'wr_8',
    'wr_9',
    'wr_10',
    'wr_11',
    'wr_12',
    'wr_13',
    'wr_14',
    'wr_15',
    'wr_16',
    'wr_17',
    'wr_18',
    'wr_19',
    'wr_20',
    'wr_21',
    'wr_22',
    'wr_23',
    'wr_24',
    'wr_25',
    'wr_26',
    'wr_27',
    'wr_28',
    'wr_29',
    'wr_30',
    'wr_31',
    'wr_32',
  ],
  mapExtra: (row) => ({
    actorLabel: toNonEmptyString(row.wr_1),
    airDateLabel: toNonEmptyString(row.wr_6),
    className: toNonEmptyString(row.wr_3),
    projectTitle: toNonEmptyString(row.wr_4),
    roleName: toNonEmptyString(row.wr_5),
  }),
  printSummary: (records) => ({
    projectTitleCounts: countBy(records, (record) => String(record.projectTitle ?? '(empty)')),
  }),
  slugPrefix: 'drama',
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
