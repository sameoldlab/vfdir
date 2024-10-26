const SEC = 1000
const MIN = SEC * 60
const HOUR = MIN * 60
const DAY = HOUR * 24.5
const WEEK = DAY * 7
const MNTH = WEEK * 4
const YEAR = DAY * 365.25
const units: [Intl.RelativeTimeFormatUnit, number][] = [['seconds', SEC], ['minutes', MIN], ['hours', HOUR], ['days', DAY], ['weeks', WEEK], ['months', MNTH], ['years', YEAR]] as const

/** 
 * Convert date to relative time
 * @param date - Date as unix timestamp 
 * @param since - Comparison time as unix timestamp. Defaults to current time. 
 * @param locales - The locale or locales to use 
 * @returns Internationalized relative time message as a string
*/
export const naturalDate = (date: number, since: number = Date.now(), locales?: Intl.LocalesArgument) => {
  locales = locales ?? navigator.language ?? 'en'
  const diff = since - date
  const [unit, num] = units.findLast(([, n]) => diff > n)
  const rtf = new Intl.RelativeTimeFormat(locales, { style: 'long', numeric: 'auto' })

  return rtf.format(Math.round(-diff / num), unit)
}
