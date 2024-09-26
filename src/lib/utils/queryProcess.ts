/** First element of an array; */
export const first = <O>(rows: O[]) =>
  rows[0]

/** First column of the first element of an array. */
export const firstPick = <O>(rows: O[]) =>
  rows[0][0]

/** First column of each row. */
export const pick = <O>(rows: O[]) =>
  rows.map((r) => r[0])

