import { type LegacyBoardSeedConfig, seedLegacyBoard } from './seed-legacy-board'

const seedConfig: LegacyBoardSeedConfig = {
  collection: 'reviews',
  fileName: 'g5_write_new_hoogi.sql',
  legacyFieldKeys: ['wr_1', 'wr_2', 'wr_3', 'wr_4', 'wr_5', 'wr_6', 'wr_7', 'wr_8', 'wr_9', 'wr_10'],
  slugPrefix: 'review',
}

void seedLegacyBoard(seedConfig)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
