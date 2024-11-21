import { ulid, type ULID } from "ulidx"
/** Unix timestamp */
type Timestamp = number
type SOURCE_ID = 'are.na' | 'filesystem' | ULID
export type HLC = `${Timestamp}:${number}:${SOURCE_ID}`

class Hlc {
  #c = 0
  #time = 0
  #deviceId: string

  constructor(deviceId: string) {
    this.#deviceId = deviceId
  }

  /** called before a send or local event */
  inc(): HLC {
    const now = Date.now()
    if (now > this.#time) {
      this.#time = Math.max(now, this.#time)
      this.#c = 0
      return `${this.#time}:${this.#c}:${this.#deviceId}`
    }
    return `${this.#time}:${this.#c++}:${this.#deviceId}`
  }

  /** 
   * negative = a < b
   * 0 means they are equal
   * positive = a > b
   */
  compare(a: HLC, b: HLC): number {
    const [timeA, countA, deviceA] = a.split(':')
    const [timeB, countB, deviceB] = b.split(':')

    if (timeA !== timeB) return Number(timeA) > Number(timeB) ? 1 : -1
    if (countA !== countB) return Number(countA) > Number(countB) ? 1 : -1
    return deviceA.localeCompare(deviceB)
  }

  /** When receiving an external event*/
  receive(recv: HLC): HLC {
    const now = Date.now()
    const [_rTime, rC, rD] = recv.split(':')
    const rTime = Number(_rTime)
    if (now > this.#time && now > rTime) {
      this.#c = 0
    }
    if (this.#time === rTime) {
      this.#c = Math.max(this.#c, Number(rC)) + 1
    } else if (rTime > this.#time) {
      this.#c = Number(rC) + 1
    } else {
      this.#c++
    }
    this.#time = Math.max(
      now,
      rTime,
      this.#time
    );
    return `${this.#time}:${this.#c}:${this.#deviceId}`
  }
}

if (!localStorage.getItem('deviceId')) {
  localStorage.setItem('deviceId', ulid())
}
export const deviceId: string = localStorage.getItem('deviceId')
export const hlc = new Hlc(deviceId)
