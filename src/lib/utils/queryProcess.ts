/** First element of an array; */
export const first = <T>(rows: T[]) =>
  rows[0]

/** Pick a column of each row. */
export const pick = <K extends PropertyKey>(key: K) =>
  <O extends Record<K, any>>(rows: O[]) => rows.map((r) => r[key])

/** First item of a 2D array. */
export const firstPick = <T>(rows: [T, ...any][]) =>
  rows[0][0]
