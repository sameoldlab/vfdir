import { expect, it } from 'vitest'
import { arenaCsvToObj } from './parseArenaCsv'
import csv from '$lib/dummy/arenaCsv.csv?raw'

it('returns', () => {
  expect(arenaCsvToObj(csv)).toReturn
})
